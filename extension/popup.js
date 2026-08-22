import {
  ensureConfig,
  getSession,
  clearSession,
  login,
  fetchCategories,
  fetchExpenses,
  createExpense,
} from './lib/api.js'

const $ = (id) => document.getElementById(id)

const views = {
  loading: $('view-loading'),
  login: $('view-login'),
  main: $('view-main'),
}

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    if (!el) return
    el.classList.toggle('hidden', key !== name)
    if (key === name) {
      el.classList.remove('view-enter')
      void el.offsetWidth
      el.classList.add('view-enter')
    }
  })
}

let currencySymbol = '₱'

function fmt(n) {
  return `${currencySymbol}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CURRENCY_SYMBOLS = { PHP: '₱', USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩', CNY: '¥', AUD: 'A$', CAD: 'C$', INR: '₹', THB: '฿' }

async function loadCurrencySymbol() {
  try {
    const stored = await chrome.storage.sync.get(['currencyCode'])
    const code = stored.currencyCode || 'PHP'
    currencySymbol = CURRENCY_SYMBOLS[code] || '₱'
  } catch {
    currencySymbol = '₱'
  }
}

function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate()
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fillCategories(categories) {
  const sel = $('exp-category')
  sel.innerHTML = '<option value="">Uncategorized</option>'
  categories
    .filter(c => c.type === 'expense' || !c.type)
    .forEach(c => {
      const opt = document.createElement('option')
      opt.value = c._id
      opt.textContent = c.name
      if (c.color) opt.dataset.color = c.color
      sel.appendChild(opt)
    })
}

function buildRecentItem(expense, categoryById) {
  const li = document.createElement('li')
  li.className = 'recent-item'
  const catObj = typeof expense.category === 'object' && expense.category
    ? expense.category
    : (expense.category ? categoryById[expense.category] : null)
  const catName = catObj?.name || 'Uncategorized'
  const dotColor = catObj?.color || '#3b82f6'
  const payment = expense.paymentMethod || 'Cash'
  li.innerHTML = `
    <span class="recent-dot" style="background:${escapeHtml(dotColor)}"></span>
    <div class="recent-body">
      <div class="recent-desc">${escapeHtml(expense.description || 'Expense')}</div>
      <div class="recent-meta">${escapeHtml(catName)} · ${escapeHtml(payment)}</div>
    </div>
    <span class="recent-amt">${fmt(expense.amount)}</span>
  `
  return li
}

async function loadTodayExpenses(token) {
  const now = new Date()
  const expenses = await fetchExpenses(token, now.getMonth() + 1, now.getFullYear())
  const today = expenses.filter(e => e.type === 'expense' && !e.listOnly && isSameDay(e.date, now))

  const list = $('recent-list')
  list.innerHTML = ''
  const total = today.reduce((s, e) => s + (e.amount || 0), 0)
  $('today-total').textContent = fmt(total)
  $('today-count').textContent = `${today.length} expense${today.length !== 1 ? 's' : ''}`

  if (!today.length) {
    $('recent-empty').classList.remove('hidden')
    return
  }
  $('recent-empty').classList.add('hidden')

  const categoryById = {}
  const stored = (await chrome.storage.local.get('categories')).categories || []
  stored.forEach(c => { categoryById[c._id] = c })

  today.slice(0, 10).forEach(e => list.appendChild(buildRecentItem(e, categoryById)))
}

async function initMain(token, profile) {
  const name = profile?.first_name || profile?.username || 'there'
  $('user-greeting').textContent = `Hi, ${name}`
  $('exp-date').value = todayISO()

  let categories = (await chrome.storage.local.get('categories')).categories
  if (!categories?.length) {
    categories = await fetchCategories(token)
  }
  fillCategories(categories || [])
  await loadTodayExpenses(token)
  showView('main')
}

async function boot() {
  showView('loading')
  try {
    await ensureConfig()
    await loadCurrencySymbol()
    const { token, profile } = await getSession()
    if (token && profile) {
      await initMain(token, profile)
    } else {
      showView('login')
    }
  } catch {
    showView('login')
  }
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = $('login-btn')
  const errEl = $('login-error')
  errEl.classList.add('hidden')
  btn.disabled = true
  btn.textContent = 'Signing in…'

  try {
    const username = $('login-username').value.trim()
    const password = $('login-password').value
    const data = await login(username, password)
    await fetchCategories(data.token)
    await initMain(data.token, data.result)
    $('login-password').value = ''
  } catch (err) {
    errEl.textContent = err.message || 'Login failed'
    errEl.classList.remove('hidden')
  } finally {
    btn.disabled = false
    btn.textContent = 'Sign in'
  }
})

$('expense-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = $('expense-btn')
  const errEl = $('expense-error')
  const okEl = $('expense-success')
  errEl.classList.add('hidden')
  okEl.classList.add('hidden')
  btn.disabled = true
  const prevHtml = btn.innerHTML
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Saving…'

  try {
    const { token } = await getSession()
    if (!token) throw new Error('Session expired — sign in again')

    const category = $('exp-category').value || null
    const dateStr = $('exp-date').value
    const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date()

    await createExpense(token, {
      description: $('exp-description').value.trim(),
      amount: parseFloat($('exp-amount').value),
      date: date.toISOString(),
      category,
      paymentMethod: $('exp-payment').value,
      notes: $('exp-notes').value.trim(),
      type: 'expense',
    })

    okEl.textContent = 'Expense logged successfully!'
    okEl.classList.remove('hidden')
    $('exp-description').value = ''
    $('exp-amount').value = ''
    $('exp-notes').value = ''
    $('exp-description').focus()

    await loadTodayExpenses(token)
  } catch (err) {
    errEl.textContent = err.message || 'Failed to save'
    errEl.classList.remove('hidden')
    if (err.status === 401 || err.status === 403) {
      await clearSession()
      showView('login')
    }
  } finally {
    btn.disabled = false
    btn.innerHTML = prevHtml
  }
})

$('logout-btn').addEventListener('click', async () => {
  await clearSession()
  showView('login')
})

$('open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

boot()
