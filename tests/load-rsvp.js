import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'
import exec from 'k6/execution'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js'

/*
 Requirements implemented:
 1. Login performed once per VU in setup() (tokens pre-generated). Failures remove that VU's token so its iterations become no-ops.
 2. Only RSVP requests are tagged with endpoint:rsvp; login requests untagged (or tagged login) and excluded from RSVP metrics.
 3. Thresholds already scoped to endpoint:rsvp (p95<200, fail-rate<5%).
 4. handleSummary outputs p95, fail-rate, total RSVP iterations, and success% (RSVP 2xx / total RSVP attempts).
 5. Compatible with Makefile & analyze_k6.py (metrics use standard http_req_duration{endpoint:rsvp} / http_req_failed{endpoint:rsvp}).
*/

export function handleSummary(data) {
  const metrics = data.metrics || {}
  const durationKey = Object.keys(metrics).find(k => k.startsWith('http_req_duration{endpoint:rsvp}')) || 'http_req_duration'
  const failKey = Object.keys(metrics).find(k => k.startsWith('http_req_failed{endpoint:rsvp}')) || 'http_req_failed'
  // k6 stores aggregated values under metric.values; trends expose p(95) there.
  const p95 = metrics[durationKey]?.values?.['p(95)']
    ?? metrics[durationKey]?.values?.['p(90)'] // fallback if 95 not present
    ?? null
  const failRate = metrics[failKey]?.values?.rate
    ?? metrics[failKey]?.rate
    ?? 0
  // RSVP-only counts via custom counters (counters expose values.count)
  const attempts = metrics.rsvp_attempts?.values?.count
    ?? metrics.rsvp_attempts?.count
    ?? 0
  const success = metrics.rsvp_success?.values?.count
    ?? metrics.rsvp_success?.count
    ?? 0
  const missingVUs = metrics.rsvp_missing_vus?.values?.count
    ?? metrics.rsvp_missing_vus?.count
    ?? 0
  const successPct = attempts ? (success / attempts) * 100 : 0
  const summary = {
    metrics: {
      p95,
      fail_rate: failRate,
      attempts,
      success,
      success_pct: successPct,
      missing_token_vus: missingVUs,
      iterations: metrics.iterations?.values?.count
        ?? metrics.iterations?.count
        ?? 0,
      vus: metrics.vus_max?.values?.value
        ?? metrics.vus_max?.values?.max
        ?? metrics.vus_max?.value
        ?? null,
    },
    thresholds: data.options.thresholds,
  }
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(summary, null, 2),
  }
}

// Defaults: 50 VUs, 20s (overridable)
const VUS = parseInt(__ENV.VUS || '50', 10)
const DURATION = __ENV.DURATION || '20s'

export const options = {
  scenarios: {
    rsvp_blast: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    // Fail-rate under 5% on RSVP-only tagged requests
    'http_req_failed{endpoint:rsvp}': ['rate<0.05'],
    // p95 latency under 200ms on RSVP-only tagged requests
    'http_req_duration{endpoint:rsvp}': ['p(95)<200'],
  },
}

const API = __ENV.API_BASE || 'http://127.0.0.1:8001/api/v1'
// Optional EVENT_ID; if not provided, we'll pick the first active event
const EVENT_ID = __ENV.EVENT_ID
// Predictable users: user{N}@example.com, using shared PASSWORD
const USER_START = parseInt(__ENV.USER_START || '1', 10)
const USER_COUNT = parseInt(__ENV.USER_COUNT || '50', 10)
const PASSWORD = __ENV.PASSWORD || 'password123'

const STATUSES = ['going', 'maybe', 'not_going', 'waiting_for_approval', 'approved', 'rejected']

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Custom counters to compute RSVP-only stats
const rsvpAttempts = new Counter('rsvp_attempts')
const rsvpSuccess = new Counter('rsvp_success')
const rsvpMissingVUs = new Counter('rsvp_missing_vus')
// Track which userIndexes already reported missing-token to avoid double counting
const reportedMissing = {}

function login(email, password) {
  const csrfRes = http.get(`${API}/auth/csrf-token`) // no rsvp tag
  const csrfToken = csrfRes.json('csrfToken')
  const payload = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  return http.post(`${API}/auth/login`, payload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRF-Token': csrfToken,
    },
  })
}

export function setup() {
  // Resolve event id
  let eventId = EVENT_ID
  if (!eventId) {
    const evRes = http.get(`${API}/events`)
    const list = evRes.json()
    if (Array.isArray(list) && list.length) {
      eventId = list[0].id
    }
  }
  // Pre-login each future VU user once (userX pattern)
  const tokens = {}
  for (let i = 0; i < VUS; i++) {
    const userIndex = USER_START + (i % USER_COUNT)
    const email = `user${userIndex}@example.com`
    const res = login(email, PASSWORD)
    if (res.status === 200) {
      tokens[userIndex] = res.json('access_token')
    }
  }
  return { eventId, tokens }
}

export default function (data) {
  const { eventId, tokens } = data
  if (!eventId) {
    sleep(1)
    return
  }
  const vuId = exec.vu.idInTest
  const userIndex = USER_START + ((vuId - 1) % USER_COUNT)
  const token = tokens[userIndex]
  if (!token) {
    // This VU's login failed in setup; count once and skip to avoid inflating fail metrics
    if (!reportedMissing[userIndex]) {
      rsvpMissingVUs.add(1)
      reportedMissing[userIndex] = true
    }
    sleep(1)
    return
  }
  const status = pick(STATUSES)
  rsvpAttempts.add(1)
  const res = http.post(
    `${API}/events/${eventId}/rsvp`,
    JSON.stringify({ status }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      tags: { endpoint: 'rsvp' },
    }
  )
  check(res, { 'rsvp 2xx': (r) => r.status >= 200 && r.status < 300 })
  if (res.status >= 200 && res.status < 300) {
    rsvpSuccess.add(1)
  }
}
