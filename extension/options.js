const $ = (id) => document.getElementById(id)

async function load() {
  let defaults = {}
  try {
    const res = await fetch(chrome.runtime.getURL('config.defaults.json'))
    if (res.ok) defaults = await res.json()
  } catch { /* optional */ }

  const data = await chrome.storage.sync.get(['apiBaseUrl', 'clientKey', 'appId'])
  $('apiBaseUrl').value = data.apiBaseUrl || defaults.apiBaseUrl || 'http://localhost:5001'
  $('clientKey').value = data.clientKey || ''
}

$('showClientKey').addEventListener('change', (e) => {
  $('clientKey').type = e.target.checked ? 'text' : 'password'
})

$('options-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const status = $('status')
  const clientKey = $('clientKey').value.trim()

  if (!clientKey.includes('.') || !clientKey.startsWith('bext_')) {
    status.className = 'alert alert-error'
    status.classList.remove('hidden')
    status.textContent = 'Invalid client key — paste the full key from Settings → Tools (starts with bext_)'
    return
  }

  status.classList.remove('hidden')
  status.className = 'alert alert-success'
  status.textContent = 'Saving…'

  try {
    await chrome.storage.sync.set({
      apiBaseUrl: $('apiBaseUrl').value.trim().replace(/\/$/, ''),
      clientKey,
      appId: 'budget-extension',
    })
    status.className = 'alert alert-success'
    status.textContent = 'Settings saved. You can sign in from the extension popup.'
  } catch {
    status.className = 'alert alert-error'
    status.textContent = 'Failed to save settings.'
  }
})

load()
