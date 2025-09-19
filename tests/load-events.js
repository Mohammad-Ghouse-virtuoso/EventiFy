import http from 'k6/http'
import { check, sleep } from 'k6'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js'

// handleSummary allows Makefile to pick up an additional summary artifact if redirected
export function handleSummary(data) {
  const durationKey = Object.keys(data.metrics).find(k => k.startsWith('http_req_duration{endpoint:events}')) || 'http_req_duration'
  const failKey = Object.keys(data.metrics).find(k => k.startsWith('http_req_failed{endpoint:events}')) || 'http_req_failed'
  const p95 = data.metrics[durationKey]?.percentiles?.['95'] ?? data.metrics[durationKey]?.percentiles?.p95 ?? null
  const failedRate = data.metrics[failKey]?.rate ?? 0
  const summary = {
    metrics: {
      http_req_duration_p95: p95,
      http_req_failed_rate: failedRate,
      iterations: data.metrics.iterations?.count || 0,
      vus: data.metrics.vus_max?.value || null,
    },
    thresholds: data.options.thresholds,
  }
  return {
    // stdout text summary
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    // JSON summary file (Makefile names it *_summary.json by convention)
    'summary.json': JSON.stringify(summary, null, 2),
  }
}

const VUS = parseInt(__ENV.VUS || '50', 10)
const DURATION = __ENV.DURATION || '20s'

export const options = {
  scenarios: {
    events_list: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    'http_req_failed{endpoint:events}': ['rate<0.05'],
    'http_req_duration{endpoint:events}': ['p(95)<250'],
  },
}

const API = __ENV.API_BASE || 'http://localhost:8000/api/v1'
const LIMIT = parseInt(__ENV.LIMIT || '20', 10)
const SEARCH = __ENV.SEARCH
const CATEGORY = __ENV.CATEGORY
const LOCATION = __ENV.LOCATION
const CREATED_BY = __ENV.CREATED_BY
const DATE = __ENV.DATE

export default function () {
  const params = {
    tags: { endpoint: 'events' },
  }
  const parts = [`limit=${encodeURIComponent(String(LIMIT))}`]
  if (SEARCH) parts.push(`search=${encodeURIComponent(SEARCH)}`)
  if (CATEGORY) parts.push(`category=${encodeURIComponent(CATEGORY)}`)
  if (LOCATION) parts.push(`location=${encodeURIComponent(LOCATION)}`)
  if (CREATED_BY) parts.push(`created_by=${encodeURIComponent(CREATED_BY)}`)
  if (DATE) parts.push(`date=${encodeURIComponent(DATE)}`)
  const qs = parts.join('&')
  const res = http.get(`${API}/events?${qs}`, params)
  check(res, {
    'events 2xx': (r) => r.status >= 200 && r.status < 300,
    'returns array': (r) => Array.isArray(r.json()),
  })
  sleep(1)
}
