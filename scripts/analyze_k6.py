#!/usr/bin/env python3
"""Analyze k6 JSON output files and produce a summarized bottleneck report.

Usage:
  python scripts/analyze_k6.py reports/*.json

It expects k6 raw JSON output (from --out json=...). It will ignore any *summary.json
files produced by handleSummary and derive metrics from the raw result metrics blocks.

Outputs:
  Prints a markdown table you can append into PERF-BOTTLENECKS.md

Threshold Heuristics (hard-coded):
  - Reads (events) p95 > 250ms => breach
  - Writes / auth (rsvp, login) p95 > 200ms => breach
  - Fail-rate > 5% => breach

The endpoint name is inferred from filename prefix (events|rsvp|login) unless
explicit metric tag groups are found.
"""
from __future__ import annotations
import json
import sys
import statistics
from pathlib import Path
from typing import Dict, Any, List, Iterable

READ_P95_LIMIT = 0.250  # seconds
WRITE_P95_LIMIT = 0.200  # seconds
FAIL_RATE_LIMIT = 0.05

# Map filename prefix to endpoint + read/write category
PREFIX_META = {
    'events': {'endpoint': 'GET /events', 'kind': 'read'},
    'rsvp': {'endpoint': 'POST /rsvp', 'kind': 'write'},
    'login': {'endpoint': 'POST /auth/login', 'kind': 'write'},
}

def _iter_lines(path: Path) -> Iterable[str]:
    with path.open('r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield line

def load_k6_stream(path: Path) -> Dict[str, Any]:
    """Parse k6 --out json stream (NDJSON). Build aggregated metrics.

    k6 raw output is a sequence of JSON objects (Metric definitions and Point data).
    We reconstruct minimal aggregates for http_req_duration and http_req_failed, plus iterations and vus.
    """
    # Structures to collect values
    durations_by_endpoint: Dict[str, List[float]] = {}
    failed_counts_by_endpoint: Dict[str, int] = {}
    total_counts_by_endpoint: Dict[str, int] = {}
    global_durations: List[float] = []
    global_failed = 0
    global_reqs = 0
    vus_max = None
    iterations = None

    for line in _iter_lines(path):
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            # Not a complete JSON object; skip
            continue
        obj_type = obj.get('type')
        metric_name = obj.get('metric')
        data = obj.get('data', {})
        if obj_type == 'Point' and metric_name in ('http_req_duration', 'http_req_failed', 'http_reqs'):
            tags = data.get('tags', {}) or {}
            endpoint = tags.get('endpoint')  # e.g., events, rsvp, login
            if metric_name == 'http_req_duration':
                val_ms = data.get('value')  # value in milliseconds per doc; convert to seconds
                if isinstance(val_ms, (int, float)):
                    seconds = val_ms / 1000.0
                    global_durations.append(seconds)
                    if endpoint:
                        durations_by_endpoint.setdefault(endpoint, []).append(seconds)
            elif metric_name == 'http_req_failed':
                # value 1 or 0 indicating failure
                val = data.get('value')
                if isinstance(val, (int, float)):
                    if val:
                        global_failed += 1
                        if endpoint:
                            failed_counts_by_endpoint[endpoint] = failed_counts_by_endpoint.get(endpoint, 0) + 1
                    if endpoint:
                        total_counts_by_endpoint[endpoint] = total_counts_by_endpoint.get(endpoint, 0) + 1
                    global_reqs += 1
            elif metric_name == 'http_reqs':
                # Keep total counts (some exporters separate http_req_failed; we still want denominators)
                tags = data.get('tags', {}) or {}
                endpoint = tags.get('endpoint')
                global_reqs += 1
                if endpoint:
                    total_counts_by_endpoint[endpoint] = total_counts_by_endpoint.get(endpoint, 0) + 1
        elif obj_type == 'Point' and metric_name in ('vus_max', 'iterations'):
            # If summary was streamed include these
            if metric_name == 'vus_max' and vus_max is None:
                vus_max = data.get('value')
            if metric_name == 'iterations' and iterations is None:
                iterations = data.get('count')

    metrics: Dict[str, Any] = {}

    def percentile(values: List[float], p: float) -> float | None:
        if not values:
            return None
        values_sorted = sorted(values)
        k = (len(values_sorted) - 1) * (p / 100.0)
        f = int(k)
        c = min(f + 1, len(values_sorted) - 1)
        if f == c:
            return values_sorted[f]
        d0 = values_sorted[f] * (c - k)
        d1 = values_sorted[c] * (k - f)
        return d0 + d1

    # Build aggregates similar to k6 summary structure
    # Global
    metrics['http_req_duration'] = {'aggregates': {'p(95)': percentile(global_durations, 95)} }
    if global_reqs:
        metrics['http_req_failed'] = {'aggregates': {'rate': global_failed / global_reqs}}
    # Endpoint specific
    for ep, vals in durations_by_endpoint.items():
        metrics[f'http_req_duration{{endpoint:{ep}}}'] = {'aggregates': {'p(95)': percentile(vals, 95)}}
    for ep, total in total_counts_by_endpoint.items():
        failed = failed_counts_by_endpoint.get(ep, 0)
        metrics[f'http_req_failed{{endpoint:{ep}}}'] = {'aggregates': {'rate': failed / total if total else 0.0}}

    metrics['iterations'] = {'count': iterations or global_reqs}
    metrics['vus_max'] = {'value': vus_max}

    return {'metrics': metrics}


def extract_metrics(data: Dict[str, Any]) -> Dict[str, Any]:
    metrics = data.get('metrics') or {}
    # Attempt to pick endpoint-tagged http_req_duration first
    p95 = None
    for key, val in metrics.items():
        if key.startswith('http_req_duration') and 'aggregates' in val:
            # endpoint scoped? choose first explicit endpoint tagged version
            if '{endpoint:' in key:
                p95 = val['aggregates'].get('p(95)')
                break
    if p95 is None:
        # fallback to global duration
        dur = metrics.get('http_req_duration', {})
        p95 = dur.get('aggregates', {}).get('p(95)')

    fail_rate = 0.0
    for key, val in metrics.items():
        if key.startswith('http_req_failed') and 'aggregates' in val:
            if '{endpoint:' in key:  # prefer endpoint scoped
                fail_rate = val['aggregates'].get('rate', 0.0)
                break
    if fail_rate == 0.0:
        fr = metrics.get('http_req_failed', {})
        fail_rate = fr.get('aggregates', {}).get('rate', 0.0)

    iterations = metrics.get('iterations', {}).get('count')
    vus = metrics.get('vus_max', {}).get('value') or metrics.get('vus', {}).get('value')
    return {
        'p95': p95,  # in seconds (k6 raw JSON uses seconds for aggregates)
        'fail_rate': fail_rate,
        'iterations': iterations,
        'vus': vus,
    }


def classify(meta: Dict[str, str], m: Dict[str, Any]) -> str:
    if m['p95'] is None:
        return 'no-data'
    limit = READ_P95_LIMIT if meta['kind'] == 'read' else WRITE_P95_LIMIT
    breaches = []
    if m['p95'] and m['p95'] > limit:
        breaches.append(f"p95>{int(limit*1000)}ms")
    if m['fail_rate'] and m['fail_rate'] > FAIL_RATE_LIMIT:
        breaches.append('fail-rate>5%')
    return ', '.join(breaches) if breaches else 'ok'


def main(files: List[str]):
    rows = []
    for path_str in files:
        p = Path(path_str)
        if not p.is_file():
            continue
        if p.name.endswith('_summary.json'):
            continue  # skip summary outputs
        # Identify prefix
        prefix = p.name.split('_', 1)[0]
        if prefix not in PREFIX_META:
            continue
        try:
            # Attempt single JSON load first (e.g., if user provides summary.json)
            with p.open('r') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            # Fallback to streaming parser for raw NDJSON
            data = load_k6_stream(p)
        metrics = extract_metrics(data)
        meta = PREFIX_META[prefix]
        status = classify(meta, metrics)
        rows.append({
            'endpoint': meta['endpoint'],
            'vus': metrics['vus'],
            'p95_ms': metrics['p95'] * 1000 if metrics['p95'] is not None else None,
            'fail_rate_pct': metrics['fail_rate'] * 100 if metrics['fail_rate'] is not None else None,
            'iterations': metrics['iterations'],
            'status': status,
            'file': p.name,
        })

    if not rows:
        print('No valid k6 raw JSON files found.')
        return

    # Output markdown table
    print('| Endpoint | VUs | p95 (ms) | Fail-rate (%) | Iterations | Status | Source |')
    print('|----------|-----|----------|---------------|------------|--------|--------|')
    for r in rows:
        print(f"| {r['endpoint']} | {r['vus']} | {r['p95_ms']:.2f} | {r['fail_rate_pct']:.2f} | {r['iterations']} | {r['status']} | {r['file']} |")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python scripts/analyze_k6.py reports/*.json')
        sys.exit(1)
    main(sys.argv[1:])
