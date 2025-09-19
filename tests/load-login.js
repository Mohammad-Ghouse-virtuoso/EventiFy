import http from 'k6/http'
import { check } from 'k6'
import exec from 'k6/execution'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js'

const VUS = parseInt(__ENV.VUS || '50', 10)
const DURATION = __ENV.DURATION || '20s'

export const options = {
  scenarios: {
    login_spike: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    // Enforce login-specific thresholds
    'http_req_failed{endpoint:login}': ['rate<0.05'],
    'http_req_duration{endpoint:login}': ['p(95)<300'],
  },
}

const API = __ENV.API_BASE || 'http://127.0.0.1:8001/api/v1'
const USER_START = parseInt(__ENV.USER_START || '1', 10)
const USER_COUNT = parseInt(__ENV.USER_COUNT || String(VUS), 10)
const PASSWORD = __ENV.PASSWORD || 'password123'

export default function () {
  // Fetch CSRF token (not tagged as login)
  const csrfRes = http.get(`${API}/auth/csrf-token`)
  const csrfToken = csrfRes.json('csrfToken')

  // Predictable users: user1@example.com .. userN@example.com
  const vuId = exec.vu.idInTest
  const userIndex = USER_START + ((vuId - 1) % USER_COUNT)
  const email = `user${userIndex}@example.com`
  const payload = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(PASSWORD)}`

  const res = http.post(`${API}/auth/login`, payload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRF-Token': csrfToken,
    },
    tags: { endpoint: 'login' },
  })

  check(res, {
    'login 2xx': (r) => r.status === 200,
    'has access token': (r) => !!r.json('access_token'),
  })
}

export function handleSummary(data) {
  const metrics = data.metrics || {}
  const durationKey = Object.keys(metrics).find(k => k.startsWith('http_req_duration{endpoint:login}')) || 'http_req_duration'
  const failKey = Object.keys(metrics).find(k => k.startsWith('http_req_failed{endpoint:login}')) || 'http_req_failed'
  const p95 = metrics[durationKey]?.values?.['p(95)']
    ?? metrics[durationKey]?.values?.['p(90)']
    ?? null
  const fail = metrics[failKey]?.values?.rate
    ?? metrics[failKey]?.rate
    ?? 0
  const summary = {
    metrics: {
      p95,
      fail_rate: fail,
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
