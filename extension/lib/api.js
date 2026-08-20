const encoder = new TextEncoder()

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Parse bext_<id>.<secret> client key */
export function parseClientKey(clientKey) {
  if (!clientKey || typeof clientKey !== 'string') return null
  const trimmed = clientKey.trim()
  const dot = trimmed.indexOf('.')
  if (dot <= 0 || dot === trimmed.length - 1) return null
  const clientId = trimmed.slice(0, dot)
  const clientSecret = trimmed.slice(dot + 1)
  if (!clientId.startsWith('bext_') || clientSecret.length < 32) return null
  return { clientId, clientSecret, clientKey: trimmed }
}

import { loadDefaults } from './defaults.js'

export async function ensureConfig() {
  const defaults = await loadDefaults()
  const data = await chrome.storage.sync.get(['apiBaseUrl', 'configEnvironment', 'appId'])
  const env = defaults.environment || 'development'
  const shouldApply =
    !data.apiBaseUrl ||
    (defaults.apiBaseUrl && data.configEnvironment !== env)

  if (shouldApply && defaults.apiBaseUrl) {
    await chrome.storage.sync.set({
      apiBaseUrl: defaults.apiBaseUrl.replace(/\/$/, ''),
      configEnvironment: env,
      appId: defaults.appId || 'budget-extension',
    })
  }
}

export async function getConfig() {
  await ensureConfig()
  const defaults = await loadDefaults()
  const data = await chrome.storage.sync.get(['apiBaseUrl', 'clientKey', 'appId'])
  const fallback = (defaults.apiBaseUrl || 'http://localhost:3000').replace(/\/$/, '')
  return {
    apiBaseUrl: (data.apiBaseUrl || fallback).replace(/\/$/, ''),
    clientKey: (data.clientKey || '').trim(),
    appId: data.appId || defaults.appId || 'budget-extension',
  }
}

export async function getSession() {
  return chrome.storage.local.get(['token', 'profile'])
}

export async function saveSession(token, profile) {
  await chrome.storage.local.set({ token, profile })
}

export async function clearSession() {
  await chrome.storage.local.remove(['token', 'profile', 'categories'])
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const config = await getConfig()
  const url = `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = {
    'Content-Type': 'application/json',
    'X-App-Id': config.appId,
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const parsedClient = parseClientKey(config.clientKey)
  if (parsedClient) {
    headers['X-Client-Key'] = parsedClient.clientKey
  }

  const upperMethod = method.toUpperCase()
  let bodyRaw = ''
  if (body !== undefined && body !== null) {
    bodyRaw = JSON.stringify(body)
  }

  const signSecret = parsedClient?.clientSecret
  if (signSecret && !['GET', 'HEAD', 'OPTIONS'].includes(upperMethod)) {
    const timestamp = String(Date.now())
    const pathname = new URL(url).pathname
    const hasBody = bodyRaw && bodyRaw !== '{}'
    const bodyHash = await sha256Hex(hasBody ? bodyRaw : '')
    const payload = `${timestamp}.${upperMethod}.${pathname}.${bodyHash}`
    const sign = await hmacSha256Hex(signSecret, payload)
    headers['X-Request-Time'] = timestamp
    headers['X-Request-Sign'] = sign
  }

  const res = await fetch(url, {
    method: upperMethod,
    headers,
    body: bodyRaw && upperMethod !== 'GET' ? bodyRaw : undefined,
  })

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text || 'Invalid response' }
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.alert?.message || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export async function login(username, password) {
  const config = await getConfig()
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(config.apiBaseUrl)
  if (!parseClientKey(config.clientKey) && !isLocal) {
    throw new Error('Add your personal client key in extension settings (from Budget → Settings → Tools)')
  }

  const data = await apiRequest('/user/login', {
    method: 'POST',
    body: { username, password },
  })
  if (!data.token) throw new Error('No token returned')
  await saveSession(data.token, data.result)
  return data
}

export async function fetchCategories(token) {
  const data = await apiRequest('/budget/categories', { token })
  const categories = data.result || []
  await chrome.storage.local.set({ categories })
  return categories
}

export async function fetchExpenses(token, month, year) {
  const data = await apiRequest(`/budget/expenses?month=${month}&year=${year}`, { token })
  return data.result || []
}

export async function createExpense(token, payload) {
  const now = new Date()
  const data = await apiRequest('/budget/expense', {
    method: 'POST',
    token,
    body: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      type: 'expense',
      currency: 'PHP',
      paymentMethod: 'Cash',
      ...payload,
    },
  })
  return data
}
