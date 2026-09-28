export const CLOUDFRONT_URL = import.meta.env.VITE_API_URL ?? 'https://d3l3tyeyzgmm47.cloudfront.net'

const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12h
const LS_PREFIX = 'bull14:'

function lsGet(key) {
  try {
    const item = localStorage.getItem(LS_PREFIX + key)
    if (!item) return null
    const { data, ts } = JSON.parse(item)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data
  } catch { return null }
}

function lsSet(key, data) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
  } catch {} // quota exceeded — silencioso
}

async function fetchData(key) {
  const cached = lsGet(key)
  if (cached) return cached
  const res = await fetch(`${CLOUDFRONT_URL}/data/${key}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  lsSet(key, data)
  return data
}

export const getChangelog  = () => fetchData('changelog.json')
export const getPricing    = () => fetchData('pricing.json')
export const getModels     = () => fetchData('models.json')
export const getAnalytics  = () => fetchData('analytics.json')
export const getTools      = () => fetchData('tools.json')
export const getHardware   = () => fetchData('hardware.json')
export const getMetrics    = () => fetchData('metrics.json')
