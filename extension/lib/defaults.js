/** Baked at build time in config.defaults.json (see scripts/zip-extension.mjs). */
let cached = null

export async function loadDefaults() {
  if (cached) return cached
  try {
    const res = await fetch(chrome.runtime.getURL('config.defaults.json'))
    if (res.ok) {
      cached = await res.json()
      return cached
    }
  } catch { /* optional */ }
  cached = {
    apiBaseUrl: 'http://localhost:3000',
    appId: 'budget-extension',
    environment: 'development',
  }
  return cached
}

export function isLocalApiUrl(url) {
  if (!url) return false
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
  }
}
