#!/usr/bin/env node
/*
QA script to verify event image URLs resolve correctly for a given API base.
Usage:
  node scripts/qa-image-urls.js http://localhost:8000/api/v1
  node scripts/qa-image-urls.js https://prod.example.com/api/v1
Requires Node 18+ (global fetch).
*/

const apiBase = process.argv[2] || process.env.VITE_API_URL || 'http://localhost:8000/api/v1';

if (typeof fetch === 'undefined') {
  console.error('[QA] This script requires Node 18+ where fetch is available globally.');
  process.exit(4);
}

function toOrigin(base) {
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}`;
  } catch {
    return base.replace(/\/api\/v1\/?$/, '');
  }
}

const origin = toOrigin(apiBase);

async function main() {
  console.log(`[QA] Checking events from: ${apiBase}`);
  const res = await fetch(`${apiBase}/events`);
  if (!res.ok) {
    console.error(`[QA] Failed to fetch events: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const events = await res.json();
  let total = 0, ok = 0, fail = 0, skipped = 0;
  for (const ev of events) {
    const img = ev.image;
    if (!img) { skipped++; continue; }
    let url = img;
    if (/^https?:\/\//i.test(img)) {
      // absolute
      url = img;
    } else if (img.startsWith('/static/')) {
      url = `${origin}${img}`;
    }
    total++;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head.ok) {
        ok++;
        console.log(`[OK] ${url}`);
      } else {
        fail++;
        console.warn(`[FAIL] ${url} -> ${head.status}`);
      }
    } catch (e) {
      fail++;
      console.warn(`[ERROR] ${url} -> ${e.message}`);
    }
  }
  console.log(`[QA] Completed. images checked=${total}, ok=${ok}, fail=${fail}, skipped(no image)=${skipped}`);
  process.exit(fail > 0 ? 2 : 0);
}

main().catch(err => { console.error(err); process.exit(3); });
