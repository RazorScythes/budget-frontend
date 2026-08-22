import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPlus, faMinus, faTrash, faPen, faCheck, faTimes, faFilter, faSearch,
    faFileExport, faSyncAlt, faClone, faEye, faEyeSlash, faSpinner, faCalendarDay,
    faArrowUp, faArrowDown, faExchangeAlt, faCogs, faCircle, faArrowRight,
    faChevronUp, faChevronDown, faTag,
} from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, ModalOverlay, SafeIcon } from './SharedComponents'
import { toLocalDateString } from './utils'
import { CURRENCIES, DEFAULT_EXCHANGE_RATES } from './constants'
import { findDuplicateCandidates, applyCategoryRules } from '../../../utils/duplicates'
import {
    searchBudgetExpenses, importBudgetCSV, processRecurring, clearSearchResults,
    createBudgetExpense, updateBudgetExpense, getExchangeRates, saveExchangeRates, resetExchangeRates,
} from '../../../actions/budget'

const TagChip = ({ tag, isLight, onRemove, compact = false }) => (
    <span className={`inline-flex items-center gap-1 rounded-md border border-solid font-medium ${
        compact ? 'px-1.5 py-0.5 text-xs' : 'pl-1.5 pr-1 py-1 text-xs'
    } ${isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-900/25 border-amber-700/50 text-amber-300'}`}>
        <FontAwesomeIcon icon={faTag} className={`${compact ? 'text-[8px]' : 'text-[9px]'} ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
        <span className="leading-none">{tag}</span>
        {onRemove && (
            <button
                type="button"
                onClick={onRemove}
                title={`Remove ${tag}`}
                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isLight ? 'text-amber-500 hover:bg-amber-100 hover:text-red-500' : 'text-amber-400 hover:bg-amber-800/40 hover:text-red-400'}`}
            >
                <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
            </button>
        )}
    </span>
)

// ==================== DAILY EXPENSES TAB ====================

const DailyExpensesTab = React.memo(({
    groupedByDate, categories, expenses, expenseForm, setExpenseForm, editingExpense,
    expenseItems, setExpenseItems, emptyItem,
    showExpenseForm, setShowExpenseForm, handleExpenseSubmit, handleEditExpense, handleDuplicateExpense,
    handleDeleteExpense, setEditingExpense, deleteConfirm, isLight, card, inputCls,
    selectCls, btnPrimary, btnSecondary, formatCurrency, paymentIcon, emptyExpense, isLoading,
    selectedExpenses, toggleSelectExpense, toggleSelectAll, handleBulkDelete,
    bulkDeleteConfirm, setSelectedExpenses, setBulkDeleteConfirm,
    handleBulkCategoryUpdate, handleBulkCurrencyUpdate, handleBulkDateUpdate, handleBulkPaymentMethodUpdate,
    dispatch, month, year, searchResults,
    attachmentPreview, setAttachmentPreview, handleReceiptUpload, removeReceipt,
    uploadingReceipt, setReceiptViewer,
    savedRates, liveRates, savedBaseCurrency,
    viewCurrency, setViewCurrency, exchangeRates, activeViewCurrency,
    toTargetCurrency, formatCurrencyRaw,
    PAYMENT_METHODS, isViewer, ownerParam = {}, pinExpense, urlSearchQuery = ''
}) => {
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')
    const [filterMethod, setFilterMethod] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [searchQuery, setSearchQuery] = useState(urlSearchQuery || '')
    const [isSearching, setIsSearching] = useState(false)
    const [showCSVImport, setShowCSVImport] = useState(false)
    const [sortField, setSortField] = useState('date')
    const [sortDir, setSortDir] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 50
    const [csvData, setCsvData] = useState([])
    const [showRecurring, setShowRecurring] = useState(false)
    const expenseFormRef = useRef(null)
    const searchTimeout = useRef(null)
    const searchIdRef = useRef(0)
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
            if (searchTimeout.current) clearTimeout(searchTimeout.current)
        }
    }, [])

    useEffect(() => {
        if (editingExpense && showExpenseForm && expenseFormRef.current) {
            expenseFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [editingExpense, showExpenseForm])

    const recurringTemplates = useMemo(() => expenses.filter(e => e.isRecurring && e.recurrenceRule), [expenses])

    const [showRateEditor, setShowRateEditor] = useState(false)
    const [rateEditorValues, setRateEditorValues] = useState({})
    const [resetting, setResetting] = useState(false)
    const [tagDraft, setTagDraft] = useState('')

    useEffect(() => {
        if (!showExpenseForm) setTagDraft('')
    }, [showExpenseForm])

    const commitTagDraft = useCallback((draft = tagDraft) => {
        const tag = String(draft || '').trim().toLowerCase()
        const current = expenseForm.tags || []
        if (!tag || current.includes(tag)) {
            setTagDraft('')
            return current
        }
        const next = [...current, tag]
        setExpenseForm(f => ({ ...f, tags: next }))
        setTagDraft('')
        return next
    }, [tagDraft, expenseForm.tags, setExpenseForm])

    const openRateEditor = () => {
        const vals = {}
        CURRENCIES.forEach(c => { if (c.code !== 'PHP') vals[c.code] = exchangeRates[c.code] || '' })
        setRateEditorValues(vals)
        setShowRateEditor(true)
    }

    const saveRateEditor = async () => {
        const rates = {}
        Object.entries(rateEditorValues).forEach(([code, val]) => {
            const num = parseFloat(val)
            if (num > 0) rates[code] = num
        })
        await dispatch(saveExchangeRates({ rates }))
        setShowRateEditor(false)
    }

    const handleResetRates = async () => {
        setResetting(true)
        const result = await dispatch(resetExchangeRates())
        setResetting(false)
        const freshLive = result.payload?.data?.result?.liveRates || liveRates || DEFAULT_EXCHANGE_RATES
        const vals = {}
        CURRENCIES.forEach(c => { if (c.code !== 'PHP') vals[c.code] = freshLive[c.code] || DEFAULT_EXCHANGE_RATES[c.code] || '' })
        setRateEditorValues(vals)
    }

    const convertAmount = (amount, fromCurrency) => {
        if (fromCurrency === activeViewCurrency) return null
        return toTargetCurrency(amount, fromCurrency, activeViewCurrency)
    }

    const handleSearch = (q) => {
        setSearchQuery(q)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        if (q.length >= 2) {
            setIsSearching(true)
            const id = ++searchIdRef.current
            searchTimeout.current = setTimeout(() => {
                dispatch(searchBudgetExpenses({ q, ...ownerParam })).finally(() => {
                    if (isMountedRef.current && searchIdRef.current === id) setIsSearching(false)
                })
            }, 400)
        } else {
            searchIdRef.current++
            setIsSearching(false)
            dispatch(clearSearchResults())
        }
    }

    useEffect(() => {
        if (urlSearchQuery && urlSearchQuery !== searchQuery) {
            handleSearch(urlSearchQuery)
        }
    }, [urlSearchQuery])

    const parseCSVLine = (line) => {
        const cols = []
        let cur = '', inQuotes = false
        for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
                else if (ch === '"') inQuotes = false
                else cur += ch
            } else {
                if (ch === '"') inQuotes = true
                else if (ch === ',') { cols.push(cur.trim()); cur = '' }
                else cur += ch
            }
        }
        cols.push(cur.trim())
        return cols
    }

    const autoCategorize = useCallback((description) => {
        if (!description || !categories.length || !expenses.length) return null
        const desc = description.toLowerCase()
        const catScores = {}
        expenses.filter(e => e.category).forEach(e => {
            const catId = e.category._id
            const existingDesc = (e.description || '').toLowerCase()
            const words = existingDesc.split(/\s+/).filter(w => w.length > 2)
            words.forEach(word => {
                if (desc.includes(word)) {
                    catScores[catId] = (catScores[catId] || 0) + 1
                }
            })
            if (desc === existingDesc || desc.includes(existingDesc) || existingDesc.includes(desc)) {
                catScores[catId] = (catScores[catId] || 0) + 5
            }
        })
        const best = Object.entries(catScores).sort((a, b) => b[1] - a[1])[0]
        return best && best[1] >= 2 ? best[0] : null
    }, [categories, expenses])

    const resolveCategoryName = useCallback((name) => {
        if (!name || !categories.length) return ''
        const lower = name.toLowerCase().trim()
        const match = categories.find(c => c.name.toLowerCase() === lower)
        return match ? match._id : ''
    }, [categories])

    const handleCSVFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            const text = ev.target.result
            const lines = text.split('\n').filter(l => l.trim())
            if (lines.length < 2) return
            const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''))
            const rows = lines.slice(1).map(line => {
                const cols = parseCSVLine(line)
                const row = {}
                headers.forEach((h, i) => { row[h] = cols[i] || '' })
                const description = row.description || row.name || row.item || ''
                const suggestedCategory = autoCategorize(description)
                const csvCategory = row.category ? resolveCategoryName(row.category) : ''
                return {
                    date: row.date || '',
                    description,
                    amount: row.amount || row.price || '0',
                    type: row.type || 'expense',
                    paymentMethod: row.paymentmethod || row['payment method'] || row.method || 'Cash',
                    notes: row.notes || '',
                    category: csvCategory || suggestedCategory || '',
                    autoCategory: !!suggestedCategory && !csvCategory,
                }
            }).filter(r => r.description && parseFloat(r.amount))
            setCsvData(rows)
            setShowCSVImport(true)
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const downloadCSVTemplate = () => {
        const headers = 'date,description,amount,type,category,paymentmethod,notes'
        const example = `${new Date().toISOString().split('T')[0]},Sample expense,100,expense,,Cash,`
        const blob = new Blob([headers + '\n' + example + '\n'], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'budget_import_template.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleCSVImport = async () => {
        if (csvData.length === 0) return
        await dispatch(importBudgetCSV({ rows: csvData, month, year, ...ownerParam }))
        setCsvData([])
        setShowCSVImport(false)
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
    }

    const hasFilters = filterDateFrom || filterDateTo || filterMethod || filterCategory

    const filtered = useMemo(() => {
        let list = expenses
        if (filterDateFrom) list = list.filter(e => toLocalDateString(e.date) >= filterDateFrom)
        if (filterDateTo) list = list.filter(e => toLocalDateString(e.date) <= filterDateTo)
        if (filterMethod) list = list.filter(e => e.paymentMethod === filterMethod)
        if (filterCategory) {
            if (filterCategory === 'uncategorized') list = list.filter(e => !e.category)
            else list = list.filter(e => e.category?._id === filterCategory)
        }
        return list
    }, [expenses, filterDateFrom, filterDateTo, filterMethod, filterCategory])

    const sorted = useMemo(() => {
        const list = [...filtered]
        list.sort((a, b) => {
            let cmp = 0
            switch (sortField) {
                case 'date': cmp = new Date(a.date) - new Date(b.date); break
                case 'amount': cmp = a.amount - b.amount; break
                case 'description': cmp = (a.description || '').localeCompare(b.description || ''); break
                case 'category': cmp = (a.category?.name || '').localeCompare(b.category?.name || ''); break
                default: cmp = new Date(a.date) - new Date(b.date)
            }
            return sortDir === 'asc' ? cmp : -cmp
        })
        return list
    }, [filtered, sortField, sortDir])

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
    const paginatedExpenses = useMemo(() => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [sorted, currentPage])

    useEffect(() => { setCurrentPage(1) }, [filterDateFrom, filterDateTo, filterMethod, filterCategory, sortField, sortDir, month, year])

    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('desc') }
    }

    const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

    const filteredGrouped = useMemo(() => {
        const groups = {}
        paginatedExpenses.forEach(e => {
            const d = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            if (!groups[d]) groups[d] = { items: [], totalIncome: 0, totalExpense: 0 }
            groups[d].items.push(e)
            if (!e.listOnly) {
                if (e.type === 'income') groups[d].totalIncome += e.amount
                else groups[d].totalExpense += e.amount
            }
        })
        return Object.entries(groups)
    }, [paginatedExpenses])

    const filteredIds = useMemo(() => filtered.map(e => e._id), [filtered])
    const allSelected = filtered.length > 0 && filteredIds.every(id => selectedExpenses.includes(id))
    const someSelected = selectedExpenses.length > 0

    const totalIncome = filtered.filter(e => e.type === 'income' && !e.listOnly).reduce((s, e) => s + e.amount, 0)
    const totalExpense = filtered.filter(e => e.type === 'expense' && !e.listOnly).reduce((s, e) => s + e.amount, 0)

    const hasMixedCurrencies = useMemo(() => {
        return filtered.some(e => (e.currency || 'PHP') !== activeViewCurrency)
    }, [filtered, activeViewCurrency])

    const convertedTotals = useMemo(() => {
        if (!hasMixedCurrencies && activeViewCurrency === 'PHP') return null
        let income = 0, expense = 0
        filtered.forEach(e => {
            if (e.listOnly) return
            const from = e.currency || 'PHP'
            const converted = toTargetCurrency(e.amount, from, activeViewCurrency)
            if (converted === null) return
            if (e.type === 'income') income += converted
            else expense += converted
        })
        return { income, expense, balance: income - expense }
    }, [filtered, activeViewCurrency, exchangeRates, hasMixedCurrencies])

    const convertGroupTotals = (items) => {
        const hasGroupMixed = items.some(e => (e.currency || 'PHP') !== activeViewCurrency)
        if (!hasGroupMixed && activeViewCurrency === 'PHP') return null
        let income = 0, expense = 0
        items.forEach(e => {
            if (e.listOnly) return
            const from = e.currency || 'PHP'
            const converted = toTargetCurrency(e.amount, from, activeViewCurrency)
            if (converted === null) return
            if (e.type === 'income') income += converted
            else expense += converted
        })
        return { income, expense }
    }

    const getCurrencyBreakdown = (items) => {
        const byCurrency = {}
        items.forEach(e => {
            if (e.listOnly) return
            const cur = e.currency || 'PHP'
            if (!byCurrency[cur]) byCurrency[cur] = { income: 0, expense: 0 }
            if (e.type === 'income') byCurrency[cur].income += e.amount
            else byCurrency[cur].expense += e.amount
        })
        return Object.entries(byCurrency).filter(([code]) => code !== activeViewCurrency).sort((a, b) => a[0].localeCompare(b[0]))
    }

    const overallBreakdown = useMemo(() => getCurrencyBreakdown(filtered), [filtered, activeViewCurrency])

    const clearFilters = () => { setFilterDateFrom(''); setFilterDateTo(''); setFilterMethod(''); setFilterCategory('') }

    const usedMethods = [...new Set(expenses.map(e => e.paymentMethod))].sort()
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    if (isLoading) {
        return (
            <div className="page-type-scale space-y-4">
                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="text-center flex-1">
                                <div className={`h-3 w-16 mx-auto mb-2 ${pulse}`} />
                                <div className={`h-5 w-20 mx-auto ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`${card} overflow-hidden`}>
                        <div className={`px-4 py-3 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className={`h-4 w-36 ${pulse}`} />
                        </div>
                        <div className="divide-y divide-solid" style={{ borderColor: isLight ? '#f1f5f9' : '#1f1f1f' }}>
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="flex items-center gap-3 px-4 py-3">
                                    <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                                    <div className="flex-1 space-y-1.5">
                                        <div className={`h-3.5 w-32 ${pulse}`} />
                                        <div className={`h-2.5 w-20 ${pulse}`} />
                                    </div>
                                    <div className={`h-4 w-16 ${pulse}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="page-type-scale space-y-4">
            {/* Summary Strip */}
            <AnimateIn delay={0}><div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className={`${card} px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                        <FontAwesomeIcon icon={faCalendarDay} className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 flex items-center justify-between sm:block">
                        <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Entries</p>
                        <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{filtered.length}{hasFilters ? ` / ${expenses.length}` : ''}</p>
                    </div>
                </div>
                <div className={`${card} px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                        <FontAwesomeIcon icon={faArrowUp} className="text-xs text-emerald-500" />
                    </div>
                    <div className="flex-1 sm:block">
                        <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income</p>
                        <p className="text-sm font-bold text-emerald-500">{convertedTotals ? formatCurrencyRaw(convertedTotals.income, activeViewCurrency) : formatCurrencyRaw(totalIncome, activeViewCurrency)}</p>
                        {overallBreakdown.filter(([, v]) => v.income > 0).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {overallBreakdown.filter(([, v]) => v.income > 0).map(([code, v]) => (
                                    <span key={code} className={`text-xs font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>
                                        {formatCurrencyRaw(v.income, code)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={`${card} px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-red-50' : 'bg-red-900/20'}`}>
                        <FontAwesomeIcon icon={faArrowDown} className="text-xs text-red-500" />
                    </div>
                    <div className="flex-1 sm:block">
                        <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Expenses</p>
                        <p className="text-sm font-bold text-red-500">{convertedTotals ? formatCurrencyRaw(convertedTotals.expense, activeViewCurrency) : formatCurrencyRaw(totalExpense, activeViewCurrency)}</p>
                        {overallBreakdown.filter(([, v]) => v.expense > 0).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {overallBreakdown.filter(([, v]) => v.expense > 0).map(([code, v]) => (
                                    <span key={code} className={`text-xs font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400'}`}>
                                        {formatCurrencyRaw(v.expense, code)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div></AnimateIn>

            {/* Currency Conversion Panel */}
            <AnimateIn delay={100}><div className={`${card} px-3 sm:px-4 py-3`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <FontAwesomeIcon icon={faExchangeAlt} className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>View in:</span>
                        <select
                            value={viewCurrency}
                            onChange={e => setViewCurrency(e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg text-sm border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                        >
                            {CURRENCIES.map(c => {
                                const val = c.code === 'PHP' ? '' : c.code
                                const isDefault = c.code === (savedBaseCurrency || 'PHP')
                                return <option key={c.code} value={val}>{c.symbol} {c.code}{isDefault ? ' (Default)' : ''}</option>
                            })}
                        </select>
                        {activeViewCurrency !== (savedBaseCurrency || 'PHP') && (
                            <button
                                onClick={() => dispatch(saveExchangeRates({ rates: savedRates || {}, baseCurrency: activeViewCurrency }))}
                                className={`text-sm font-medium px-2.5 py-1 rounded-md transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}
                            >
                                Set as default
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeViewCurrency !== 'PHP' && exchangeRates[activeViewCurrency] && (
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                1 PHP = {exchangeRates[activeViewCurrency]} {activeViewCurrency}
                            </span>
                        )}
                        <button onClick={openRateEditor} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`}>
                            <FontAwesomeIcon icon={faCogs} className="text-[10px]" />
                            Rates
                        </button>
                    </div>
                </div>
                {convertedTotals && (
                    <div className={`mt-2.5 pt-2.5 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income</p>
                                <p className="text-sm font-bold text-emerald-500">{formatCurrencyRaw(convertedTotals.income, activeViewCurrency)}</p>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Expenses</p>
                                <p className="text-sm font-bold text-red-500">{formatCurrencyRaw(convertedTotals.expense, activeViewCurrency)}</p>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Balance</p>
                                <p className={`text-sm font-bold ${convertedTotals.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(Math.abs(convertedTotals.balance), activeViewCurrency)}</p>
                            </div>
                        </div>
                        {overallBreakdown.length > 0 && (
                            <div className={`flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-dashed ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                {overallBreakdown.map(([code, v]) => (
                                    <div key={code} className={`inline-flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-md ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                        <span className={`font-bold ${isLight ? 'text-slate-500' : 'text-gray-300'}`}>{code}</span>
                                        {v.income > 0 && <span className="text-emerald-500">+{formatCurrencyRaw(v.income, code)}</span>}
                                        {v.expense > 0 && <span className="text-red-500">-{formatCurrencyRaw(v.expense, code)}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeViewCurrency !== 'PHP' && !exchangeRates[activeViewCurrency] && (
                    <p className={`text-sm mt-2 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                        No exchange rate set for {activeViewCurrency}. Click "Rates" to configure.
                    </p>
                )}
            </div>

            {/* Rate Editor Modal */}
            {showRateEditor && (
                <ModalOverlay isLight={isLight} onClose={() => setShowRateEditor(false)}>
                    <div
                        className={`relative w-full max-w-lg rounded-2xl border border-solid shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`px-6 pt-5 pb-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Exchange rates</h3>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Rates relative to PHP (₱1 = X foreign)</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRateEditor(false)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4 max-h-[min(62vh,460px)] overflow-y-auto">
                            {CURRENCIES.filter(c => c.code !== 'PHP').map(c => {
                                const liveVal = liveRates?.[c.code]
                                const currentVal = parseFloat(rateEditorValues[c.code])
                                const isCustom = liveVal && currentVal && Math.abs(currentVal - liveVal) > 0.000001
                                return (
                                    <div key={c.code} className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 w-28 flex-shrink-0">
                                            <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{c.symbol}</span>
                                            <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{c.code}</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                step="0.000001"
                                                min="0"
                                                placeholder="0.000000"
                                                value={rateEditorValues[c.code] || ''}
                                                onChange={e => setRateEditorValues(prev => ({ ...prev, [c.code]: e.target.value }))}
                                                className={inputCls}
                                            />
                                            {isCustom && (
                                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>
                                                    Custom
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className={`px-6 py-4 border-t border-solid flex items-center justify-between gap-3 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <button
                                type="button"
                                onClick={handleResetRates}
                                disabled={resetting}
                                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`}
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className={`text-xs ${resetting ? 'animate-spin' : ''}`} />
                                {resetting ? 'Resetting…' : 'Reset to live rates'}
                            </button>
                            <div className="flex items-center gap-2.5">
                                <button type="button" onClick={() => setShowRateEditor(false)} className={btnSecondary}>Cancel</button>
                                <button type="button" onClick={saveRateEditor} className={btnPrimary}>Save rates</button>
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}</AnimateIn>

            {/* Search + CSV Import */}
            <AnimateIn delay={200}><div className={`${card} p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2`}>
                <div className="flex-1 relative">
                    <FontAwesomeIcon icon={faSearch} className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                    <input
                        type="text" placeholder="Search all transactions..." value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        className={`${inputCls} pl-8`}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={downloadCSVTemplate} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`}>
                        <FontAwesomeIcon icon={faFileExport} className="text-[10px]" />
                        Template
                    </button>
                    <label className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-all ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        <FontAwesomeIcon icon={faFileExport} className="text-[10px]" />
                        Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
                    </label>
                </div>
            </div></AnimateIn>

            {/* Search Results */}
            {searchQuery.length >= 2 && (
                <div className={`${card} p-4`}>
                    {isSearching ? (
                        <div className="flex items-center justify-center gap-2 py-4">
                            <FontAwesomeIcon icon={faSpinner} className={`text-sm animate-spin ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Searching...</span>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <h4 className={`text-sm font-semibold mb-3 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Search results ({searchResults.length})</h4>
                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                {searchResults.slice(0, 20).map(e => (
                                    <div key={e._id} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className={`font-medium whitespace-pre-wrap break-words ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</span>
                                            {e.notes && <span className={`whitespace-pre-wrap break-words ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{e.notes}</span>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className={`font-semibold whitespace-nowrap ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount, e.currency || 'PHP')}</span>
                                            {(e.currency || 'PHP') !== activeViewCurrency && (
                                                <span className={`block text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency || 'PHP')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-1">
                            <FontAwesomeIcon icon={faSearch} className={`text-lg ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No results found for "{searchQuery}"</span>
                        </div>
                    )}
                </div>
            )}

            {/* CSV Import Preview */}
            {showCSVImport && csvData.length > 0 && (
                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>CSV preview ({csvData.length} rows)</h4>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowCSVImport(false); setCsvData([]) }} className={btnSecondary + ' !text-sm !px-3 !py-1.5'}>Cancel</button>
                            <button onClick={handleCSVImport} className={btnPrimary + ' !text-sm !px-3 !py-1.5'}>Import {csvData.length} rows</button>
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead><tr className={isLight ? 'text-slate-400' : 'text-gray-500'}><th className="text-left py-1 px-2">Date</th><th className="text-left py-1 px-2">Description</th><th className="text-right py-1 px-2">Amount</th><th className="text-left py-1 px-2">Type</th></tr></thead>
                            <tbody>
                                {csvData.slice(0, 10).map((r, i) => (
                                    <tr key={i} className={isLight ? 'text-slate-600' : 'text-gray-300'}>
                                        <td className="py-1 px-2">{r.date || '—'}</td>
                                        <td className="py-1 px-2 truncate max-w-[200px]">{r.description}</td>
                                        <td className="py-1 px-2 text-right">{r.amount}</td>
                                        <td className="py-1 px-2">{r.type}</td>
                                    </tr>
                                ))}
                                {csvData.length > 10 && <tr><td colSpan={4} className={`py-1 px-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>...and {csvData.length - 10} more rows</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className={`${card} overflow-hidden`}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-all ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#111]'}`}
                >
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilter} className={`text-[10px] ${hasFilters ? (isLight ? 'text-blue-500' : 'text-blue-400') : (isLight ? 'text-slate-400' : 'text-gray-500')}`} />
                        <span className={`text-sm font-medium ${hasFilters ? (isLight ? 'text-blue-600' : 'text-blue-400') : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>
                            {hasFilters ? 'Filters active' : 'Filter'}
                        </span>
                        {hasFilters && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                                {[filterDateFrom, filterDateTo, filterMethod, filterCategory].filter(Boolean).length}
                            </span>
                        )}
                    </div>
                    {hasFilters && (
                        <span
                            onClick={e => { e.stopPropagation(); clearFilters() }}
                            className={`text-sm font-medium px-2 py-0.5 rounded-md cursor-pointer transition-all ${isLight ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'}`}
                        >
                            Clear all
                        </span>
                    )}
                </button>
                {showFilters && (
                    <div className={`px-4 py-3 border-t border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#0a0a0a]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>From</label>
                                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>To</label>
                                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payment Method</label>
                                <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={`${selectCls} w-full`}>
                                    <option value="">All Methods</option>
                                    {usedMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
                                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${selectCls} w-full`}>
                                    <option value="">All Categories</option>
                                    <option value="uncategorized">Uncategorized</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {someSelected && !isViewer && (
                <div className={`rounded-xl p-3 border border-solid ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111] border-[#2B2B2B]'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAll(filteredIds)} className="w-4 h-4 rounded cursor-pointer accent-blue-500" />
                            <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{selectedExpenses.length} selected</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Date:</span>
                                <input
                                    type="date"
                                    onChange={e => { if (e.target.value) handleBulkDateUpdate(e.target.value) }}
                                    className={`px-2 py-1.5 rounded-lg text-sm border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                    title="Set date for selected transactions"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Move to:</span>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value !== '') handleBulkCategoryUpdate(e.target.value === 'none' ? '' : e.target.value); e.target.value = '' }}
                                    className={`px-2.5 py-1.5 rounded-lg text-sm border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                >
                                    <option value="" disabled>Select category</option>
                                    <option value="none">Uncategorized</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payment:</span>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value) handleBulkPaymentMethodUpdate(e.target.value); e.target.value = '' }}
                                    className={`px-2.5 py-1.5 rounded-lg text-sm border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                >
                                    <option value="" disabled>Select method</option>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Currency:</span>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value) handleBulkCurrencyUpdate(e.target.value); e.target.value = '' }}
                                    className={`px-2.5 py-1.5 rounded-lg text-sm border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                >
                                    <option value="" disabled>Select currency</option>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                                </select>
                            </div>
                            <div className={`w-px h-5 ${isLight ? 'bg-slate-200' : 'bg-[#333]'}`} />
                            <button onClick={() => { setSelectedExpenses([]); setBulkDeleteConfirm(false) }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isLight ? 'bg-white hover:bg-slate-100 text-slate-600 border border-solid border-slate-200' : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300 border border-solid border-[#333]'}`}>Cancel</button>
                            <button onClick={handleBulkDelete} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${isLight ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                {`Delete (${selectedExpenses.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Transaction Form */}
            <AnimateIn delay={300}><div ref={expenseFormRef} className={`${card} overflow-hidden`}>
                <div className={`flex items-center justify-between px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {editingExpense ? 'Edit Transaction' : 'Transactions'}
                    </h3>
                    {!isViewer && <button
                        onClick={() => { setShowExpenseForm(!showExpenseForm); setEditingExpense(null); setExpenseForm(emptyExpense); setExpenseItems([{ ...emptyItem }]) }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                            showExpenseForm
                                ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                : (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                        }`}
                    >
                        <FontAwesomeIcon icon={showExpenseForm ? faTimes : faPlus} className="text-[10px]" />
                        {showExpenseForm ? 'Cancel' : 'Add New'}
                    </button>}
                </div>

                {showExpenseForm && !isViewer && (
                    <div className={`px-5 py-5 border-b border-solid space-y-4 ${isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#111] border-[#1f1f1f]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Date</label>
                                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Type</label>
                                <select value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value, category: ''})} className={`${selectCls} w-full`}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Category</label>
                                <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className={`${selectCls} w-full`}>
                                    <option value="">None</option>
                                    {categories.filter(c => c.type === expenseForm.type).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Payment Method</label>
                                <select value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})} className={`${selectCls} w-full`}>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Currency</label>
                                <select value={expenseForm.currency || 'PHP'} onChange={e => setExpenseForm({...expenseForm, currency: e.target.value})} className={`${selectCls} w-full`}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {expenseItems.length > 1 ? `Items (${expenseItems.length})` : 'Description & amount'}
                                </label>
                                {!editingExpense && (
                                    <button
                                        type="button"
                                        onClick={() => setExpenseItems([...expenseItems, { ...emptyItem }])}
                                        className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md transition-all ${isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'}`}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-[8px]" />
                                        Add Item
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {expenseItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {expenseItems.length > 1 && (
                                            <span className={`text-sm font-medium w-5 text-center flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{idx + 1}</span>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={e => {
                                                const updated = [...expenseItems]
                                                updated[idx] = { ...updated[idx], description: e.target.value }
                                                setExpenseItems(updated)
                                            }}
                                            className={`${inputCls} flex-1`}
                                        />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={item.amount}
                                            onChange={e => {
                                                const updated = [...expenseItems]
                                                updated[idx] = { ...updated[idx], amount: e.target.value }
                                                setExpenseItems(updated)
                                            }}
                                            className={`${inputCls} w-28 sm:w-36 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                            min="0"
                                            step="0.01"
                                        />
                                        {expenseItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setExpenseItems(expenseItems.filter((_, i) => i !== idx))}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-red-50 text-red-400' : 'hover:bg-red-900/20 text-red-500'}`}
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {expenseItems.length > 1 && (
                                <div className="flex items-center justify-end gap-2 mt-1.5">
                                    <span className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total</span>
                                    <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                        {formatCurrency(expenseItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0))}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Notes (optional)</label>
                                <textarea rows={3} placeholder="Additional notes..." value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} className={`${inputCls} resize-y min-h-[42px]`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Tags (optional)</label>
                                <div className={`flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl border border-solid transition-colors ${
                                    isLight
                                        ? 'bg-white border-slate-200 focus-within:border-blue-300'
                                        : 'bg-[#1a1a1a] border-[#333] focus-within:border-blue-500'
                                }`}>
                                    {(expenseForm.tags || []).map((tag, ti) => (
                                        <TagChip
                                            key={`${tag}-${ti}`}
                                            tag={tag}
                                            isLight={isLight}
                                            onRemove={() => setExpenseForm(f => ({ ...f, tags: f.tags.filter((_, i) => i !== ti) }))}
                                        />
                                    ))}
                                    <input
                                        type="text"
                                        value={tagDraft}
                                        placeholder={(expenseForm.tags || []).length ? 'Add another…' : 'Add a tag and press Enter'}
                                        className={`flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm py-0.5 ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-gray-200 placeholder:text-gray-600'}`}
                                        onChange={e => setTagDraft(e.target.value)}
                                        onBlur={() => commitTagDraft()}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault()
                                                commitTagDraft()
                                            }
                                            if (e.key === 'Backspace' && !tagDraft && (expenseForm.tags || []).length) {
                                                setExpenseForm(f => ({ ...f, tags: f.tags.slice(0, -1) }))
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {expenseForm.isRecurring && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Frequency</label>
                                    <select value={expenseForm.recurrenceRule || ''} onChange={e => setExpenseForm({...expenseForm, recurrenceRule: e.target.value})} className={`${selectCls} w-full`}>
                                        <option value="">Select frequency</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>End date (optional)</label>
                                    <input type="date" value={expenseForm.recurrenceEnd || ''} onChange={e => setExpenseForm({...expenseForm, recurrenceEnd: e.target.value})} className={inputCls} />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <label className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all ${uploadingReceipt ? 'opacity-50 pointer-events-none' : 'cursor-pointer'} ${isLight ? 'bg-white border border-solid border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#1a1a1a] border border-solid border-[#333] text-gray-300 hover:bg-[#222]'}`}>
                                    <FontAwesomeIcon icon={uploadingReceipt ? faSyncAlt : faFileExport} className={`text-[10px] ${uploadingReceipt ? 'animate-spin' : ''}`} />
                                    {uploadingReceipt ? 'Uploading...' : attachmentPreview ? 'Change Receipt' : 'Attach Receipt'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={uploadingReceipt} />
                                </label>
                                {attachmentPreview && (
                                    <div className="flex items-center gap-2">
                                        <img src={attachmentPreview} alt="receipt" className="w-9 h-9 rounded-md object-cover border border-solid border-slate-200/50 cursor-pointer" onClick={() => setReceiptViewer(attachmentPreview)} />
                                        <button type="button" onClick={removeReceipt} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`}>
                                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                        </button>
                                    </div>
                                )}
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={!!expenseForm.isRecurring} onChange={e => setExpenseForm({...expenseForm, isRecurring: e.target.checked})} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                                    <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Recurring</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={!!expenseForm.listOnly} onChange={e => setExpenseForm({...expenseForm, listOnly: e.target.checked})} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                                    <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>List only</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setShowExpenseForm(false); setEditingExpense(null); setExpenseForm(emptyExpense); setExpenseItems([{ ...emptyItem }]); setTagDraft('') }} className={btnSecondary}>Cancel</button>
                                <button onClick={() => handleExpenseSubmit({ tags: commitTagDraft() })} className={btnPrimary} disabled={!expenseItems.some(i => i.description && i.amount)}>
                                    <FontAwesomeIcon icon={editingExpense ? faCheck : faPlus} className="mr-1.5 text-xs" />
                                    {editingExpense ? 'Update' : `Add ${expenseItems.filter(i => i.description && i.amount).length > 1 ? `(${expenseItems.filter(i => i.description && i.amount).length} items)` : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {filtered.length > 0 ? (
                <>
                    <div className="overflow-x-auto -mx-px">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className={`text-sm font-medium ${isLight ? 'text-slate-400 bg-slate-50/80' : 'text-gray-500 bg-[#111]'}`}>
                                    <th className="w-10 px-4 py-3 text-center">
                                        <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAll(filteredIds)} className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500" />
                                    </th>
                                    <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('date')}>Date{sortIcon('date')}</th>
                                    <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('description')}>Description{sortIcon('description')}</th>
                                    <th className="px-3 py-3 text-left font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('category')}>Category{sortIcon('category')}</th>
                                    <th className="px-3 py-3 text-left font-semibold">Method</th>
                                    <th className="px-3 py-3 text-right font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('amount')}>Amount{sortIcon('amount')}</th>
                                    <th className="w-20 px-3 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGrouped.map(([date, group]) => {
                                    const groupIds = group.items.map(e => e._id)
                                    const allGroupSelected = groupIds.every(id => selectedExpenses.includes(id))
                                    return (
                                        <React.Fragment key={date}>
                                            {/* Date separator row */}
                                            {(() => {
                                                const cg = convertGroupTotals(group.items)
                                                const gb = getCurrencyBreakdown(group.items)
                                                return (
                                                    <tr className={isLight ? 'bg-slate-50/50' : 'bg-[#0a0a0a]'}>
                                                        <td className="px-4 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={allGroupSelected}
                                                                onChange={() => {
                                                                    if (allGroupSelected) setSelectedExpenses(prev => prev.filter(id => !groupIds.includes(id)))
                                                                    else setSelectedExpenses(prev => [...new Set([...prev, ...groupIds])])
                                                                }}
                                                                className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500"
                                                            />
                                                        </td>
                                                        <td colSpan={4} className="px-3 py-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{date}</span>
                                                                {gb.map(([code, v]) => {
                                                                    const net = v.income - v.expense
                                                                    if (v.income === 0 && v.expense === 0) return null
                                                                    return (
                                                                        <span key={code} className={`text-xs font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                                                            {v.expense > 0 && <span className="text-red-500">-{formatCurrencyRaw(v.expense, code)}</span>}
                                                                            {v.income > 0 && v.expense > 0 && ' '}
                                                                            {v.income > 0 && <span className="text-emerald-500">+{formatCurrencyRaw(v.income, code)}</span>}
                                                                        </span>
                                                                    )
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                {(cg ? cg.income : group.totalIncome) > 0 && (
                                                                    <span className="text-sm font-semibold text-emerald-500">+{formatCurrencyRaw(cg ? cg.income : group.totalIncome, activeViewCurrency)}</span>
                                                                )}
                                                                {(cg ? cg.expense : group.totalExpense) > 0 && (
                                                                    <span className="text-sm font-semibold text-red-500">-{formatCurrencyRaw(cg ? cg.expense : group.totalExpense, activeViewCurrency)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td />
                                                    </tr>
                                                )
                                            })()}
                                            {/* Expense rows */}
                                            {group.items.map(e => {
                                                const isSelected = selectedExpenses.includes(e._id)
                                                const converted = convertAmount(e.amount, e.currency || 'PHP')
                                                const targetSym = CURRENCIES.find(c => c.code === viewCurrency)?.symbol || ''
                                                return (
                                                    <tr
                                                        key={e._id}
                                                        className={`group transition-colors ${e.listOnly ? (isLight ? 'opacity-60' : 'opacity-50') : ''} ${isSelected ? (isLight ? 'bg-blue-50/60' : 'bg-blue-900/10') : (isLight ? 'hover:bg-slate-50/50' : 'hover:bg-[#111]')} border-b border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}`}
                                                    >
                                                        <td className="px-4 py-3 text-center align-top">
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectExpense(e._id)} className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500" />
                                                        </td>
                                                        <td className={`px-3 py-3 text-sm whitespace-nowrap align-top ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            <div className="flex items-start gap-1.5 flex-wrap">
                                                                <p className={`text-sm font-medium whitespace-pre-wrap break-words max-w-[220px] ${e.listOnly ? 'line-through' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                                    {e.description}
                                                                    {e.groupId && <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>SPLIT</span>}
                                                                </p>
                                                                {e.listOnly && (
                                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400'}`}>
                                                                        <FontAwesomeIcon icon={faEye} className="text-[8px]" />
                                                                        LIST
                                                                    </span>
                                                                )}
                                                                {e.attachments?.length > 0 && (
                                                                    <button onClick={() => setReceiptViewer(e.attachments[0])} className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded transition-colors ${isLight ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'}`} title="View receipt">
                                                                        <FontAwesomeIcon icon={faFileExport} className="text-[8px]" />
                                                                        Receipt
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {e.notes && <p className={`text-sm whitespace-pre-wrap break-words max-w-[220px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>{e.notes}</p>}
                                                            {e.tags?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                                    {e.tags.map(tag => (
                                                                        <TagChip key={tag} tag={tag} isLight={isLight} compact />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                                                    {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-xs" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                                                </div>
                                                                <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{e.category?.name || 'Uncategorized'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                                                <FontAwesomeIcon icon={paymentIcon(e.paymentMethod)} className="text-[10px]" />
                                                                {e.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-right align-top">
                                                            {converted !== null ? (
                                                                <>
                                                                    <span className={`text-sm font-semibold whitespace-nowrap ${e.listOnly ? (isLight ? 'text-slate-400 line-through' : 'text-gray-500 line-through') : (e.type === 'income' ? 'text-emerald-500' : 'text-red-500')}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(converted, activeViewCurrency)}
                                                                    </span>
                                                                    <span className={`block text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, e.currency)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className={`text-sm font-semibold whitespace-nowrap ${e.listOnly ? (isLight ? 'text-slate-400 line-through' : 'text-gray-500 line-through') : (e.type === 'income' ? 'text-emerald-500' : 'text-red-500')}`}>
                                                                    {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, e.currency)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-right align-top">
                                                            <div className="flex items-center justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                                                {!isViewer && <>
                                                                <button
                                                                    onClick={async () => {
                                                                        await dispatch(updateBudgetExpense({ id: e._id, date: e.date, description: e.description, category: e.category?._id || '', amount: e.amount, type: e.type, paymentMethod: e.paymentMethod, notes: e.notes || '', currency: e.currency || 'PHP', listOnly: !e.listOnly, attachments: e.attachments || [], isRecurring: !!e.isRecurring, recurrenceRule: e.recurrenceRule || '', recurrenceEnd: e.recurrenceEnd || '', tags: e.tags || [], month, year, ...ownerParam }))
                                                                        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
                                                                    }}
                                                                    title={e.listOnly ? 'Include in totals' : 'Exclude from totals (list only)'}
                                                                    aria-label={e.listOnly ? `Include ${e.description} in totals` : `Exclude ${e.description} from totals`}
                                                                    className={`w-7 h-7 rounded-md flex items-center justify-center ${e.listOnly ? (isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400') : (isLight ? 'hover:bg-amber-50 text-slate-400' : 'hover:bg-amber-900/20 text-gray-500')}`}
                                                                >
                                                                    <FontAwesomeIcon icon={e.listOnly ? faEyeSlash : faEye} className="text-[10px]" />
                                                                </button>
                                                                <button onClick={() => handleEditExpense(e)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`} title="Edit" aria-label={`Edit ${e.description}`}>
                                                                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                                </button>
                                                                <button onClick={() => handleDuplicateExpense(e)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-violet-100 text-violet-500' : 'hover:bg-violet-900/30 text-violet-400'}`} title="Duplicate" aria-label={`Duplicate ${e.description}`}>
                                                                    <FontAwesomeIcon icon={faClone} className="text-[10px]" />
                                                                </button>
                                                                {pinExpense && (
                                                                    <button onClick={() => pinExpense(e)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-amber-100 text-amber-500' : 'hover:bg-amber-900/30 text-amber-400'}`} title="Pin for quick log" aria-label={`Pin ${e.description}`}>
                                                                        <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDeleteExpense(e._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-900/30 text-red-400'}`} title="Delete" aria-label={`Delete ${e.description}`}>
                                                                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                                </button>
                                                                </>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (() => {
                        const pages = []
                        const maxVisible = 5
                        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                        let end = Math.min(totalPages, start + maxVisible - 1)
                        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
                        for (let i = start; i <= end; i++) pages.push(i)

                        const btnBase = `w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed`
                        const btnIdle = isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#1f1f1f]'
                        const btnActive = isLight ? 'bg-blue-500 text-white shadow-sm' : 'bg-blue-600 text-white'

                        return (
                        <div className={`flex items-center justify-between px-4 py-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1a1a1a]'}`}>
                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className={`${btnBase} ${btnIdle}`} aria-label="First page">
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px] rotate-180" /><FontAwesomeIcon icon={faArrowRight} className="text-[10px] rotate-180 -ml-1" />
                                </button>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`${btnBase} ${btnIdle}`} aria-label="Previous page">
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px] rotate-180" />
                                </button>
                                {start > 1 && <span className={`w-6 text-center text-[10px] ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>…</span>}
                                {pages.map(p => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`${btnBase} ${currentPage === p ? btnActive : btnIdle}`}>
                                        {p}
                                    </button>
                                ))}
                                {end < totalPages && <span className={`w-6 text-center text-[10px] ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>…</span>}
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={`${btnBase} ${btnIdle}`} aria-label="Next page">
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                                </button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className={`${btnBase} ${btnIdle}`} aria-label="Last page">
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" /><FontAwesomeIcon icon={faArrowRight} className="text-[10px] -ml-1" />
                                </button>
                            </div>
                        </div>
                        )
                    })()}
                </>
                ) : (
                    <div className="text-center py-16 px-5">
                        <FontAwesomeIcon icon={hasFilters ? faFilter : faCalendarDay} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{hasFilters ? 'No transactions match your filters.' : 'No transactions this month.'}</p>
                        {hasFilters ? (
                            <button onClick={clearFilters} className={`mt-3 text-sm font-medium px-4 py-2 rounded-lg transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}>
                                <FontAwesomeIcon icon={faFilter} className="mr-1.5 text-[10px]" />Clear Filters
                            </button>
                        ) : (
                            <button onClick={() => setShowExpenseForm(true)} className={`mt-3 text-sm font-medium px-4 py-2 rounded-lg transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}>
                                <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-[10px]" />Add Your First Transaction
                            </button>
                        )}
                    </div>
                )}
            </div></AnimateIn>

            {/* Recurring Templates */}
            {recurringTemplates.length > 0 && (
                <div className={`${card} overflow-hidden`}>
                    <button onClick={() => setShowRecurring(!showRecurring)} className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faSyncAlt} className={`text-xs ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                            <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Recurring templates ({recurringTemplates.length})</span>
                        </div>
                        <FontAwesomeIcon icon={showRecurring ? faChevronUp : faChevronDown} className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                    </button>
                    {showRecurring && (
                        <div className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                {recurringTemplates.map(t => {
                                    const cat = categories.find(c => c._id === t.category?._id)
                                    return (
                                        <div key={t._id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (cat?.color || '#94a3b8') + '20' }}>
                                                {cat?.icon ? <SafeIcon name={cat.icon} cls="text-sm" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium whitespace-pre-wrap break-words ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{t.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>
                                                        {t.recurrenceRule}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#222] text-gray-400'}`}>
                                                        {t.paymentMethod || 'Cash'}
                                                    </span>
                                                    {t.recurrenceEnd && (
                                                        <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            ends {new Date(t.recurrenceEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {t.type === 'income' ? '+' : '-'}{formatCurrencyRaw(t.amount, t.currency || 'PHP')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => handleEditExpense(t)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`} title="Edit template">
                                                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        dispatch(updateBudgetExpense({ id: t._id, ...t, category: t.category?._id, isRecurring: false, recurrenceRule: '', recurrenceEnd: null, month, year }))
                                                    }}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-amber-900/10 text-amber-400'}`}
                                                    title="Stop recurring"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
})

export default DailyExpensesTab
