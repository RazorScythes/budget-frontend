import { loadDefaults, isLocalApiUrl } from './lib/defaults.js'
import { ensureConfig } from './lib/api.js'

const $ = (id) => document.getElementById(id)

async function load() {
  await ensureConfig()
  const defaults = await loadDefaults()

  const data = await chrome.storage.sync.get(['apiBaseUrl', 'clientKey', 'appId'])
  const apiUrl = data.apiBaseUrl || defaults.apiBaseUrl || 'http://localhost:3000'
  $('apiBaseUrl').value = apiUrl
  $('clientKey').value = data.clientKey || ''

  const envEl = $('env-badge')
  if (envEl) {
    const env = defaults.environment || 'development'
    envEl.textContent = env === 'production' ? 'Production build' : 'Development build'
    envEl.dataset.env = env
  }
}

$('showClientKey').addEventListener('change', (e) => {
  $('clientKey').type = e.target.checked ? 'text' : 'password'
})

$('reset-api-url')?.addEventListener('click', async () => {
  const defaults = await loadDefaults()
  if (defaults.apiBaseUrl) {
    $('apiBaseUrl').value = defaults.apiBaseUrl
  }
})

$('options-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const status = $('status')
  const clientKey = $('clientKey').value.trim()
  const apiBaseUrl = $('apiBaseUrl').value.trim().replace(/\/$/, '')

  if (!isLocalApiUrl(apiBaseUrl) && (!clientKey.includes('.') || !clientKey.startsWith('bext_'))) {
    status.className = 'alert alert-error'
    status.classList.remove('hidden')
    status.textContent = 'Invalid client key — paste the full key from Settings → Tools (starts with bext_)'
    return
  }

  status.classList.remove('hidden')
  status.className = 'alert alert-success'
  status.textContent = 'Saving…'

  try {
    const defaults = await loadDefaults()
    await chrome.storage.sync.set({
      apiBaseUrl,
      clientKey,
      appId: 'budget-extension',
      configEnvironment: defaults.environment || 'development',
    })
    status.className = 'alert alert-success'
    status.textContent = 'Settings saved. You can sign in from the extension popup.'
  } catch {
    status.className = 'alert alert-error'
    status.textContent = 'Failed to save settings.'
  }
})

load()
