import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { main, dark, light } from '../../style'
import styles from '../../style'
import { useDispatch, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { 
    faWallet, faChartPie, faCalendarDay, faCalendarAlt, faTags, faPlus, faMinus,
    faTrash, faPen, faCheck, faTimes, faArrowUp, faArrowDown, faEllipsisH,
    faMoneyBillWave, faCreditCard, faMobileAlt, faUniversity, faCoins,
    faExclamationTriangle, faCheckCircle, faArrowRight, faSyncAlt, faFileExport, faFilter, faPiggyBank, faHistory, faFilePdf,
    faHandHoldingUsd, faUserFriends, faCalendarCheck, faChevronDown, faChevronUp, faListAlt, faSearch, faCogs, faCircle,
    faEye, faEyeSlash, faExchangeAlt, faSpinner, faClone, faShare, faLock, faUsers,
    fas
} from '@fortawesome/free-solid-svg-icons'

library.add(
    faWallet, faChartPie, faCalendarDay, faCalendarAlt, faTags, faPlus, faMinus,
    faTrash, faPen, faCheck, faTimes, faArrowUp, faArrowDown, faEllipsisH,
    faMoneyBillWave, faCreditCard, faMobileAlt, faUniversity, faCoins,
    faExclamationTriangle, faCheckCircle, faArrowRight, faSyncAlt, faFileExport, faFilter, faPiggyBank, faHistory, faFilePdf,
    faHandHoldingUsd, faUserFriends, faCalendarCheck, faChevronDown, faChevronUp, faListAlt, faSearch, faCogs, faCircle,
    faEye, faEyeSlash, faExchangeAlt, faSpinner, faClone, faShare, faLock, faUsers,
    fas
)

const loadSocketIO = () => import('socket.io-client').then(m => m.io)
import { deleteReceipt as deleteReceiptApi, uploadReceipt as uploadReceiptApi, getBudgetExpenses as fetchBudgetExpensesApi } from '../../endpoint'
import { 
    getBudgetInitialLoad,
    getBudgetDashboard, getBudgetCategories, createBudgetCategory, updateBudgetCategory, 
    deleteBudgetCategory, shareBudgetCategory, unshareBudgetCategory,
    getBudgetExpenses, createBudgetExpense, updateBudgetExpense, 
    deleteBudgetExpense, restoreBudgetExpense, getNetWorthHistory,
    bulkDeleteBudgetExpenses, bulkUpdateBudgetCategory, bulkUpdateBudgetCurrency,
    bulkUpdateBudgetDate, bulkUpdateBudgetPaymentMethod,
    getExchangeRates, saveExchangeRates, resetExchangeRates, saveBudgetSettings,
    searchBudgetExpenses, importBudgetCSV, processRecurring, processSavingsInterest,
    getDebts, createDebt, updateDebt, deleteDebt, addDebtPayment, removeDebtPayment, toggleDebtStatus,
    getBudgetLists, createBudgetList, updateBudgetList, deleteBudgetList,
    getBudgetSavingsHistory,
    getFinancialGoals, createFinancialGoal, updateFinancialGoal, deleteFinancialGoal, addGoalContribution, removeGoalContribution,
    getBudgetSavings,
    shareBudget, unshareBudget, updateBudgetShareAction, getSharedBudgets, getSharedUsers, setViewingBudgetOwner,
    acceptBudgetInvite,
    clearAlert, clearSearchResults, setViewCurrency, setSelectedMonth, setSelectedYear,
    setExpenses, setCategories, setDashboard, setSavings, setSavingsHistory, setDebts, setBudgetLists, setGoals, setExchangeRatesData, setSharedUsers,
} from '../../actions/budget'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Notification from '../Custom/Notification'
import BudgetContext from './Budget/BudgetContext'
import { ModalOverlay, DeleteConfirmModal } from './Budget/SharedComponents'
import ShareBudgetModal from './Budget/ShareBudgetModal'
import ShareCategoryModal from './Budget/ShareCategoryModal'
import SavingsTab from './Budget/SavingsTab'
import BalanceAmount from './Budget/BalanceAmount'
import SettingsTab from './Budget/SettingsTab'
import DashboardTab from './Budget/DashboardTab'
import DailyExpensesTab from './Budget/DailyExpensesTab'
import MonthlyBudgetTab from './Budget/MonthlyBudgetTab'
import CategoriesTab from './Budget/CategoriesTab'
import DebtTab from './Budget/DebtTab'
import ListsTab from './Budget/ListsTab'
import SummaryTab from './Budget/SummaryTab'
import GoalsTab from './Budget/GoalsTab'
import TrendsChart from './Budget/TrendsChart'
import { calcAllSavingsTotal, calcAccountTotal } from '../../utils/savings'
import { calcNetWorth } from '../../utils/netWorth'
import { findDuplicateCandidates, applyCategoryRules } from '../../utils/duplicates'
import { loadGlobalBalancesVisible, saveGlobalBalancesVisible, maskedBalanceText } from '../../utils/balancePrivacy'
import { generateBudgetSummaryPdf, formatPdfAmount, sanitizePdfText } from '../../utils/budgetSummaryPdf'
import { toLocalDateString } from './Budget/utils'
import {
    DEFAULT_PAYMENT_METHODS, CATEGORY_COLORS, MONTHS, VALID_TABS,
    CURRENCIES, DEFAULT_EXCHANGE_RATES, ICON_GRID, DENOMINATIONS as DENOMINATIONS_CONST,
    getPageLayout, usesContentTabs,
} from './Budget/constants'
import { ALL_BUDGET_TABS, getVisibleBudgetTabs } from '../Layout/budgetTabNav'

const Budget = ({ user, theme }) => {
    const dispatch = useDispatch()
    const { dashboard, categories, expenses, savingsAccounts, savingsHistory, debts, budgetLists, goals, searchResults, exchangeRates: savedRates, liveRates, baseCurrency: savedBaseCurrency, viewCurrency, budgetSettings, sharedUsers, sharedBudgets, viewingBudgetOwner, alert: budgetAlert, isLoading, isCategoriesLoading, isExpensesLoading, isSavingsLoading, isDebtsLoading, isGoalsLoading, isListsLoading, netWorthHistory, categoryRules } = useSelector(state => state.budget)
    const [searchParams, setSearchParams] = useSearchParams()

    const isLight = theme === 'light'
    const now = new Date()

    const isViewingShared = !!viewingBudgetOwner
    const viewingRole = isViewingShared ? (sharedBudgets.find(s => s.owner?._id === viewingBudgetOwner?.id)?.role || 'viewer') : 'owner'
    const isViewer = viewingRole === 'viewer'
    const isOwner = !isViewingShared
    const budgetOwnerId = isViewingShared ? viewingBudgetOwner.id : undefined
    const ownerParam = useMemo(() => budgetOwnerId ? { budgetOwnerId } : {}, [budgetOwnerId])

    const [showShareBudgetModal, setShowShareBudgetModal] = useState(false)
    const [shareBudgetUsername, setShareBudgetUsername] = useState('')
    const [shareBudgetRole, setShareBudgetRole] = useState('viewer')
    const [modalAlert, setModalAlert] = useState(null)
    const [showBudgetDropdown, setShowBudgetDropdown] = useState(false)

    const tabParam = searchParams.get('tab')
    const urlSearchQuery = searchParams.get('q') || ''
    const [activeTab, setActiveTabState] = useState(VALID_TABS.includes(tabParam) ? tabParam : 'dashboard')
    const setActiveTab = (tab) => {
        setActiveTabState(tab)
        const params = new URLSearchParams(searchParams)
        params.set('tab', tab)
        if (tab !== 'daily') params.delete('q')
        setSearchParams(params, { replace: true })
    }
    useEffect(() => {
        const current = searchParams.get('tab')
        const q = searchParams.get('q')
        if (q && q.length >= 2 && current !== 'daily') {
            const params = new URLSearchParams(searchParams)
            params.set('tab', 'daily')
            setSearchParams(params, { replace: true })
            setActiveTabState('daily')
            return
        }
        if (current && VALID_TABS.includes(current) && current !== activeTab) setActiveTabState(current)
    }, [searchParams])

    useEffect(() => {
        const hidden = budgetSettings?.hiddenTabs || []
        if (hidden.includes(activeTab) && activeTab !== 'dashboard' && activeTab !== 'settings') {
            setActiveTab('dashboard')
        }
    }, [budgetSettings?.hiddenTabs, activeTab])

    useEffect(() => {
        if (!showBudgetDropdown) return
        const close = (e) => { if (!e.target.closest('[aria-haspopup]')?.parentElement?.contains(e.target)) setShowBudgetDropdown(false) }
        document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [showBudgetDropdown])
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())

    useEffect(() => {
        dispatch(setSelectedMonth(month))
        dispatch(setSelectedYear(year))
    }, [month, year, dispatch])
    const [notification, setNotification] = useState({})
    const [showNotif, setShowNotif] = useState(true)

    // expense form
    const emptyItem = useMemo(() => ({ description: '', amount: '' }), [])
    const getDefaultDate = useCallback(() => {
        const today = new Date()
        if (today.getMonth() + 1 === month && today.getFullYear() === year) {
            return today.toISOString().split('T')[0]
        }
        const d = new Date(year, month - 1, 1)
        return d.toISOString().split('T')[0]
    }, [month, year])
    const emptyExpense = useMemo(() => ({ date: getDefaultDate(), category: '', type: 'expense', paymentMethod: 'Cash', notes: '', currency: 'PHP', listOnly: false, isRecurring: false, recurrenceRule: '', recurrenceEnd: '', tags: [] }), [getDefaultDate])
    const [expenseForm, setExpenseForm] = useState(emptyExpense)
    const [expenseItems, setExpenseItems] = useState([{ ...emptyItem }])
    const [editingExpense, setEditingExpense] = useState(null)
    const [showExpenseForm, setShowExpenseForm] = useState(false)

    // Pinned/favorite expenses for quick repeat logging
    const [pinnedExpenses, setPinnedExpenses] = useState(() => {
        try { return JSON.parse(localStorage.getItem('budget_pinned_expenses') || '[]') } catch { return [] }
    })
    const [showGlobalBalances, setShowGlobalBalances] = useState(loadGlobalBalancesVisible)

    useEffect(() => {
        saveGlobalBalancesVisible(showGlobalBalances)
    }, [showGlobalBalances])

    // category form
    const emptyCategory = { name: '', color: '#3b82f6', type: 'expense', budget: '', icon: '', rollover: false, rolloverRule: 'none', allocationPercent: 80 }
    const [categoryForm, setCategoryForm] = useState(emptyCategory)
    const [editingCategory, setEditingCategory] = useState(null)
    const [showCategoryForm, setShowCategoryForm] = useState(false)

    // delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteModal, setDeleteModal] = useState(null)

    // bulk selection
    const [selectedExpenses, setSelectedExpenses] = useState([])
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

    // Smart notifications / alerts
    const [budgetNotifications, setBudgetNotifications] = useState([])
    const [dismissedAlerts, setDismissedAlerts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('budget_dismissed_alerts') || '[]') } catch { return [] }
    })

    const dismissAlert = useCallback((alertId) => {
        setDismissedAlerts(prev => {
            const next = [...prev, alertId]
            localStorage.setItem('budget_dismissed_alerts', JSON.stringify(next))
            return next
        })
    }, [])

    const pinExpense = useCallback((expense) => {
        setPinnedExpenses(prev => {
            const exists = prev.find(p => p.description === expense.description && p.category === expense.category?._id)
            if (exists) return prev
            const pinned = { description: expense.description, amount: expense.amount, category: expense.category?._id, categoryName: expense.category?.name, categoryColor: expense.category?.color, categoryIcon: expense.category?.icon, type: expense.type, paymentMethod: expense.paymentMethod, currency: expense.currency || 'PHP', tags: expense.tags || [] }
            const next = [...prev, pinned].slice(0, 8)
            localStorage.setItem('budget_pinned_expenses', JSON.stringify(next))
            return next
        })
    }, [])

    const unpinExpense = useCallback((idx) => {
        setPinnedExpenses(prev => {
            const next = prev.filter((_, i) => i !== idx)
            localStorage.setItem('budget_pinned_expenses', JSON.stringify(next))
            return next
        })
    }, [])

    const quickLogPinned = useCallback(async (pinned) => {
        const items = [{ description: pinned.description, amount: pinned.amount.toString() }]
        try {
            await dispatch(createBudgetExpense({
                date: getDefaultDate(),
                category: pinned.category,
                type: pinned.type,
                paymentMethod: pinned.paymentMethod,
                notes: '',
                currency: pinned.currency,
                tags: pinned.tags || [],
                items,
                month, year, ...ownerParam
            }))
            dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
            setNotification({ message: `Logged "${pinned.description}"`, variant: 'success' })
            setShowNotif(true)
        } catch (err) {
            setNotification({ message: 'Failed to log expense', variant: 'danger' })
            setShowNotif(true)
        }
    }, [dispatch, getDefaultDate, month, year, ownerParam])

    // YTD expenses (fetched separately so monthly expenses stay in Redux)
    const [ytdExpenses, setYtdExpenses] = useState([])
    const [ytdLoading, setYtdLoading] = useState(false)
    const ytdRequestRef = useRef(0)

    const fetchYtdExpenses = useCallback(async (y, ownerOverride) => {
        const requestId = ++ytdRequestRef.current
        setYtdLoading(true)
        try {
            const params = { year: y, ...(ownerOverride || ownerParam) }
            const res = await fetchBudgetExpensesApi(params)
            if (requestId !== ytdRequestRef.current) return
            setYtdExpenses(Array.isArray(res.data?.result) ? res.data.result : [])
        } catch (err) {
            if (requestId !== ytdRequestRef.current) return
            console.error('Failed to fetch YTD expenses:', err)
            setYtdExpenses([])
            setNotification({
                message: err.response?.data?.alert?.message || 'Failed to load year-to-date data.',
                variant: 'danger',
            })
            setShowNotif(true)
        } finally {
            if (requestId === ytdRequestRef.current) {
                setYtdLoading(false)
            }
        }
    }, [ownerParam])

    const initialLoadRef = useRef(false)

    useEffect(() => {
        if (!user) return

        const currentOwnerParam = budgetOwnerId ? { budgetOwnerId } : {}
        const isShared = !!budgetOwnerId

        dispatch(getBudgetInitialLoad({ month, year, ...currentOwnerParam }))

        setSelectedExpenses([])
        setBulkDeleteConfirm(false)

        // Defer non-critical loads to avoid blocking first paint
        const deferTimer = setTimeout(() => {
            fetchYtdExpenses(year, currentOwnerParam)
            dispatch(getNetWorthHistory(currentOwnerParam))
        }, 100)

        if (!initialLoadRef.current) {
            initialLoadRef.current = true
            setTimeout(() => {
                dispatch(getSharedBudgets())
                dispatch(getSharedUsers())
                if (!isShared) {
                    dispatch(processRecurring()).then((action) => {
                        if (action?.payload?.data?.created > 0) {
                            dispatch(getBudgetExpenses({ month, year, ...currentOwnerParam }))
                            dispatch(getBudgetDashboard({ month, year, ...currentOwnerParam }))
                        }
                    })
                    dispatch(processSavingsInterest()).then((action) => {
                        if (action?.payload?.data?.accountsUpdated > 0) {
                            dispatch(getBudgetSavingsHistory({}))
                        }
                    })
                }
            }, 200)
        }

        return () => {
            ytdRequestRef.current += 1
            clearTimeout(deferTimer)
        }
    }, [user, month, year, budgetOwnerId, fetchYtdExpenses])

    // ==================== SOCKET.IO REAL-TIME ====================

    const socketUrl = import.meta.env.VITE_DEVELOPMENT == "true"
        ? `${import.meta.env.VITE_APP_PROTOCOL}://${import.meta.env.VITE_APP_LOCALHOST}:${import.meta.env.VITE_APP_SERVER_PORT}`
        : import.meta.env.VITE_APP_BASE_URL

    useEffect(() => {
        if (!user) return
        let socket = null
        let cancelled = false

        const roomId = budgetOwnerId || user._id
        const myId = user._id

        loadSocketIO().then(socketIO => {
            if (cancelled) return
            socket = socketIO(socketUrl, { transports: ['websocket', 'polling'], withCredentials: true })

            socket.emit('join_budget', roomId)

            socket.on('budget_expenses_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) {
                    dispatch(setExpenses(data.result))
                    dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
                }
            })

            socket.on('budget_categories_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) {
                    dispatch(setCategories(data.result))
                    dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
                }
            })

            socket.on('budget_savings_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setSavings(data.result))
            })

            socket.on('budget_savings_history_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setSavingsHistory(data.result))
            })

            socket.on('budget_debts_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setDebts(data.result))
            })

            socket.on('budget_lists_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setBudgetLists(data.result))
            })

            socket.on('budget_goals_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setGoals(data.result))
            })

            socket.on('budget_settings_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setExchangeRatesData(data.result))
            })

            socket.on('budget_sharing_updated', (data) => {
                if (data.userId === roomId && data.actorId !== myId) dispatch(setSharedUsers(data.result))
            })

            socket.on('budget_access_changed', (data) => {
                dispatch(getSharedBudgets())
                if (data?.revoked && data?.ownerId === budgetOwnerId) {
                    dispatch(setViewingBudgetOwner(null))
                }
            })
        })

        return () => {
            cancelled = true
            if (socket) {
                socket.emit('leave_budget', roomId)
                socket.disconnect()
            }
        }
    }, [user, budgetOwnerId, month, year, dispatch])

    useEffect(() => {
        if (budgetAlert && Object.keys(budgetAlert).length > 0) {
            if (showShareBudgetModal) {
                setModalAlert(budgetAlert)
            } else {
                setNotification(budgetAlert)
                setShowNotif(true)
            }
            dispatch(clearAlert())
        }
    }, [budgetAlert, showShareBudgetModal, dispatch])

    useEffect(() => {
        const fromUrl = searchParams.get('invite')
        if (!fromUrl) return
        try { sessionStorage.setItem('budget_pending_invite', fromUrl) } catch { /* ignore */ }
        const next = new URLSearchParams(searchParams)
        next.delete('invite')
        setSearchParams(next, { replace: true })
    }, [])

    useEffect(() => {
        let token = null
        try { token = sessionStorage.getItem('budget_pending_invite') } catch { /* ignore */ }
        if (!token || !user) return

        const acceptInvite = async () => {
            try {
                sessionStorage.removeItem('budget_pending_invite')
                const res = await dispatch(acceptBudgetInvite({ token })).unwrap()
                const msg = res.data?.alert?.message || 'Invite accepted'
                const variant = res.data?.alert?.variant || 'success'
                setNotification({ message: msg, variant })
                setShowNotif(true)
                dispatch(getSharedBudgets())
                const { ownerId, ownerUsername } = res.data?.result || {}
                if (ownerId) {
                    dispatch(setViewingBudgetOwner({ id: ownerId, username: ownerUsername }))
                }
            } catch (err) {
                setNotification({ message: err?.alert?.message || 'Invalid or expired invite link', variant: 'danger' })
                setShowNotif(true)
            }
        }
        acceptInvite()
    }, [user, dispatch])

    useEffect(() => {
        if (!showNotif) setNotification({})
    }, [showNotif])

    const refreshData = () => {
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        dispatch(getBudgetExpenses({ month, year, ...ownerParam }))
        dispatch(getBudgetCategories(ownerParam))
        fetchYtdExpenses(year, ownerParam)
    }

    // ==================== HANDLERS ====================

    const [attachmentPreview, setAttachmentPreview] = useState(null)
    const [uploadingReceipt, setUploadingReceipt] = useState(false)
    const [receiptViewer, setReceiptViewer] = useState(null)

    const handleExpenseSubmit = useCallback(async (opts = {}) => {
        try {
            const tags = Array.isArray(opts.tags) ? opts.tags : (expenseForm.tags || [])
            if (editingExpense) {
                const item = expenseItems[0]
                if (!item?.description || !item?.amount) return
                await dispatch(updateBudgetExpense({ ...expenseForm, tags, ...ownerParam, description: item.description, amount: parseFloat(item.amount), id: editingExpense, month, year })).unwrap()
            } else {
                const validItems = expenseItems.filter(i => i.description && i.amount)
                if (validItems.length === 0) return
                const confirmDuplicates = !!opts.confirmDuplicates
                if (!confirmDuplicates) {
                    const dups = validItems.flatMap(i => findDuplicateCandidates(expenses, {
                        description: i.description,
                        amount: i.amount,
                        date: expenseForm.date,
                    }))
                    if (dups.length) {
                        setDeleteModal({
                            type: 'duplicate',
                            title: 'Possible duplicate',
                            message: `This looks like ${dups.length} existing transaction${dups.length > 1 ? 's' : ''} on the same day. Add anyway?`,
                        })
                        return
                    }
                }
                const items = validItems.map(i => {
                    const suggested = applyCategoryRules(i.description, categoryRules)
                    const suggestedId = suggested && (suggested._id || suggested)
                    return { ...i, category: expenseForm.category || suggestedId || '' }
                })
                await dispatch(createBudgetExpense({
                    ...expenseForm,
                    tags,
                    ...ownerParam,
                    items,
                    confirmDuplicates,
                    month,
                    year,
                })).unwrap()
            }
            setExpenseForm(emptyExpense)
            setExpenseItems([{ ...emptyItem }])
            setEditingExpense(null)
            setShowExpenseForm(false)
            setAttachmentPreview(null)
            dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        } catch (err) {
            if (err?.duplicates || err?.alert?.variant === 'warning') {
                setDeleteModal({
                    type: 'duplicate',
                    title: 'Possible duplicate',
                    message: err?.alert?.message || 'This looks like an existing transaction. Add anyway?',
                })
                return
            }
            setNotification({ message: err?.alert?.message || err?.message || 'Failed to save transaction. Please try again.', variant: 'danger' })
            setShowNotif(true)
        }
    }, [editingExpense, expenseForm, expenseItems, emptyExpense, emptyItem, month, year, dispatch, ownerParam, expenses, categoryRules])

    const handleEditExpense = useCallback((e) => {
        setExpenseForm({
            date: toLocalDateString(e.date),
            category: e.category?._id || '',
            type: e.type,
            paymentMethod: e.paymentMethod,
            notes: e.notes || '',
            currency: e.currency || 'PHP',
            listOnly: !!e.listOnly,
            attachments: e.attachments || [],
            isRecurring: !!e.isRecurring,
            recurrenceRule: e.recurrenceRule || '',
            recurrenceEnd: e.recurrenceEnd ? toLocalDateString(e.recurrenceEnd) : '',
            tags: e.tags || [],
        })
        setExpenseItems([{ description: e.description, amount: e.amount.toString() }])
        setEditingExpense(e._id)
        setShowExpenseForm(true)
        setAttachmentPreview(e.attachments?.[0] || null)
    }, [])

    const handleDuplicateExpense = useCallback((e) => {
        setExpenseForm({
            date: getDefaultDate(),
            category: e.category?._id || '',
            type: e.type,
            paymentMethod: e.paymentMethod,
            notes: e.notes || '',
            currency: e.currency || 'PHP',
            listOnly: !!e.listOnly,
            attachments: [],
            isRecurring: false,
            recurrenceRule: '',
            recurrenceEnd: '',
            tags: e.tags || [],
        })
        setExpenseItems([{ description: e.description, amount: e.amount.toString() }])
        setEditingExpense(null)
        setShowExpenseForm(true)
        setAttachmentPreview(null)
    }, [getDefaultDate])

    const handleReceiptUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (file.size > 5 * 1024 * 1024) return
        setUploadingReceipt(true)
        try {
            if (attachmentPreview?.includes('vercel-storage')) {
                await deleteReceiptApi({ url: attachmentPreview }).catch(() => {})
            }
            const formData = new FormData()
            formData.append('receipt', file)
            const res = await uploadReceiptApi(formData, ownerParam)
            const url = res.data?.result?.url
            if (url) {
                setAttachmentPreview(url)
                setExpenseForm(prev => ({ ...prev, attachments: [url] }))
            }
        } catch (err) { console.error('Receipt upload failed:', err) }
        finally { setUploadingReceipt(false); e.target.value = '' }
    }

    const removeReceipt = async () => {
        if (attachmentPreview?.includes('vercel-storage')) {
            await deleteReceiptApi({ url: attachmentPreview }).catch(() => {})
        }
        setAttachmentPreview(null)
        setExpenseForm(prev => ({ ...prev, attachments: [] }))
    }

    const handleDeleteExpense = useCallback((id) => {
        setDeleteModal({ type: 'expense', id, title: 'Delete Expense', message: 'Delete this expense? You can undo it from the notification.' })
    }, [])

    const confirmDeleteExpense = useCallback(async (id) => {
        await dispatch(deleteBudgetExpense({ id, month, year, ...ownerParam }))
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        setDeleteModal(null)
        setNotification({
            message: 'Transaction deleted',
            variant: 'success',
            onUndo: () => {
                dispatch(restoreBudgetExpense({ id, month, year, ...ownerParam })).then(() => {
                    dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
                })
            },
        })
        setShowNotif(true)
    }, [month, year, dispatch, ownerParam])

    const handleBulkDelete = () => {
        setDeleteModal({ type: 'bulk', title: 'Delete Expenses', message: `Delete ${selectedExpenses.length} selected expense${selectedExpenses.length > 1 ? 's' : ''}? You can undo this from the notification.` })
    }

    const confirmBulkDelete = async () => {
        const ids = [...selectedExpenses]
        await dispatch(bulkDeleteBudgetExpenses({ ids, month, year, ...ownerParam }))
        setSelectedExpenses([])
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        setDeleteModal(null)
        setNotification({
            message: `${ids.length} transaction${ids.length > 1 ? 's' : ''} deleted`,
            variant: 'success',
            onUndo: () => {
                dispatch(restoreBudgetExpense({ ids, month, year, ...ownerParam })).then(() => {
                    dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
                })
            },
        })
        setShowNotif(true)
    }

    const handleBulkCategoryUpdate = async (categoryId) => {
        await dispatch(bulkUpdateBudgetCategory({ ids: selectedExpenses, category: categoryId, month, year, ...ownerParam }))
        setSelectedExpenses([])
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
    }

    const handleBulkCurrencyUpdate = async (currency) => {
        await dispatch(bulkUpdateBudgetCurrency({ ids: selectedExpenses, currency, month, year, ...ownerParam }))
        setSelectedExpenses([])
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
    }

    const handleBulkDateUpdate = async (date) => {
        if (!date) return
        await dispatch(bulkUpdateBudgetDate({ ids: selectedExpenses, date, month, year, ...ownerParam }))
        setSelectedExpenses([])
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
    }

    const handleBulkPaymentMethodUpdate = async (paymentMethod) => {
        if (!paymentMethod) return
        await dispatch(bulkUpdateBudgetPaymentMethod({ ids: selectedExpenses, paymentMethod, month, year, ...ownerParam }))
        setSelectedExpenses([])
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
    }

    const toggleSelectExpense = (id) => {
        setSelectedExpenses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const toggleSelectAll = (filteredIds) => {
        if (filteredIds) {
            const allSelected = filteredIds.every(id => selectedExpenses.includes(id))
            if (allSelected) setSelectedExpenses(prev => prev.filter(id => !filteredIds.includes(id)))
            else setSelectedExpenses(prev => [...new Set([...prev, ...filteredIds])])
        } else {
            const allIds = expenses.map(e => e._id)
            if (selectedExpenses.length === allIds.length) setSelectedExpenses([])
            else setSelectedExpenses(allIds)
        }
    }

    const handleCategorySubmit = async () => {
        if (!categoryForm.name) return
        const data = { ...categoryForm, ...ownerParam, budget: parseFloat(categoryForm.budget) || 0, rollover: !!categoryForm.rollover, rolloverRule: categoryForm.rolloverRule || 'none', allocationPercent: categoryForm.type === 'income' ? (parseFloat(categoryForm.allocationPercent) || 100) : undefined }
        try {
            if (editingCategory) {
                await dispatch(updateBudgetCategory({ ...data, id: editingCategory })).unwrap()
            } else {
                await dispatch(createBudgetCategory(data)).unwrap()
            }
            setCategoryForm(emptyCategory)
            setEditingCategory(null)
            setShowCategoryForm(false)
            dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        } catch (err) {
            setNotification({ message: err?.message || 'Failed to save category. Please try again.', variant: 'danger' })
            setShowNotif(true)
        }
    }

    const handleEditCategory = (c) => {
        setCategoryForm({ name: c.name, color: c.color, type: c.type, budget: c.budget?.toString() || '', icon: c.icon || '', rollover: !!c.rollover, rolloverRule: c.rolloverRule || (c.rollover ? 'carry' : 'none'), allocationPercent: c.allocationPercent ?? 80 })
        setEditingCategory(c._id)
        setShowCategoryForm(true)
    }

    const handleDeleteCategory = (id) => {
        setDeleteModal({ type: 'category', id, title: 'Delete Category', message: 'Are you sure you want to delete this category? All expenses in this category will become uncategorized.' })
    }

    const confirmDeleteCategory = async (id) => {
        await dispatch(deleteBudgetCategory({ id, ...ownerParam }))
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        setDeleteModal(null)
    }

    const handleExportCSV = () => {
        if (!expenses.length) return
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Payment Method', 'Notes']
        const rows = expenses.map(e => [
            new Date(e.date).toLocaleDateString('en-US'),
            `"${(e.description || '').replace(/"/g, '""')}"`,
            e.category?.name || 'Uncategorized',
            e.amount,
            e.type,
            e.paymentMethod,
            `"${(e.notes || '').replace(/"/g, '""')}"`
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `budget_${MONTHS[month - 1]}_${year}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const prevMonth = useCallback(() => {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }, [month])
    const nextMonth = useCallback(() => {
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }, [month])

    // ==================== KEYBOARD SHORTCUTS ====================

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
            if (e.target.closest('[role="dialog"]') || e.target.closest('[contenteditable]')) return
            if (e.key === 'Escape') {
                if (receiptViewer) { setReceiptViewer(null); return }
                if (showExpenseForm) { setShowExpenseForm(false); setEditingExpense(null); return }
                if (showCategoryForm) { setShowCategoryForm(false); setEditingCategory(null); return }
                if (showShareBudgetModal) { setShowShareBudgetModal(false); return }
            }
            if (showExpenseForm || showCategoryForm || receiptViewer || showShareBudgetModal) return
            if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) prevMonth()
            if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) nextMonth()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [receiptViewer, showExpenseForm, showCategoryForm, showShareBudgetModal, prevMonth, nextMonth])

    // ==================== GROUPED EXPENSES ====================

    const groupedByDate = useMemo(() => {
        const groups = {}
        expenses.forEach(e => {
            const d = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            if (!groups[d]) groups[d] = { items: [], totalIncome: 0, totalExpense: 0 }
            groups[d].items.push(e)
            if (!e.listOnly) {
                if (e.type === 'income') groups[d].totalIncome += e.amount
                else groups[d].totalExpense += e.amount
            }
        })
        return Object.entries(groups)
    }, [expenses])

    // ==================== SHARED STYLES ====================

    const activeTemplate = budgetSettings?.template || 'default'
    const pageLayout = getPageLayout(budgetSettings)
    const showContentTabs = usesContentTabs(pageLayout)

    const templateStyles = useMemo(() => {
        switch (activeTemplate) {
            case 'compact':
                return {
                    card: `rounded-lg border border-solid ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`,
                    radius: 'rounded-lg',
                    // Page layout
                    contentWidthCls: styles.boxWidthEx,
                    pageMarginCls: 'my-4 sm:my-6',
                    tabBarCls: `p-1 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-[#0a0a0a]'}`,
                    tabRadiusCls: 'rounded-md',
                    tabLayout: 'segment',
                    statGridCls: 'grid grid-cols-2 lg:grid-cols-4',
                    chartGridCls: 'grid grid-cols-1 xl:grid-cols-2',
                    // Layout & density
                    cardPadding: 'p-3 sm:p-4',
                    headerPadding: 'p-3 sm:p-4 mb-3',
                    sectionGap: 'space-y-3',
                    gridGap: 'gap-2 sm:gap-3',
                    tabCls: 'px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs',
                    tabGap: 'gap-0.5',
                    tabIconCls: 'text-[10px]',
                    tabShowLabel: true,
                    headerTitleCls: 'text-sm sm:text-base font-bold',
                    headerSubCls: 'text-[10px] sm:text-[11px]',
                    headerIconSize: 'w-8 h-8 sm:w-9 sm:h-9',
                    headerIconCls: 'text-sm sm:text-base',
                    sectionTitleCls: 'text-xs font-semibold',
                    bodyTextCls: 'text-[11px]',
                    valueTextCls: 'text-base sm:text-lg font-bold',
                    // Colors
                    tabActive: isLight ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-500 text-white',
                    tabInactive: isLight ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:bg-[#1a1a1a]',
                    headerIcon: isLight ? 'bg-slate-100' : 'bg-slate-800/40',
                    headerIconText: isLight ? 'text-slate-600' : 'text-slate-300',
                    accentBg: isLight ? 'bg-slate-50' : 'bg-slate-800/20',
                    accentText: isLight ? 'text-slate-600' : 'text-slate-300',
                    accentBorder: isLight ? 'border-slate-300' : 'border-slate-700',
                    focusBorder: isLight ? 'focus:border-slate-400' : 'focus:border-slate-500',
                    btnPrimary: `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isLight ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'}`,
                    btnSecondary: `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`,
                    progressBar: 'bg-slate-500',
                    badgeBg: isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/40 text-slate-300',
                    highlightBg: isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-800',
                    fabBg: isLight ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-200' : 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-900/50',
                }
            case 'vibrant':
                return {
                    card: `rounded-2xl border border-solid shadow-lg ${isLight ? 'bg-white border-slate-100 shadow-violet-100/50' : 'bg-[#0e0e0e] border-[#2B2B2B] shadow-violet-900/10'}`,
                    radius: 'rounded-xl',
                    // Page layout
                    contentWidthCls: styles.boxWidth,
                    pageMarginCls: 'my-8 sm:my-14',
                    tabBarCls: '',
                    tabRadiusCls: 'rounded-xl',
                    tabLayout: 'pill-lg',
                    statGridCls: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
                    chartGridCls: 'grid grid-cols-1 lg:grid-cols-2',
                    // Layout & density
                    cardPadding: 'p-5 sm:p-7',
                    headerPadding: 'p-5 sm:p-7 mb-5',
                    sectionGap: 'space-y-5',
                    gridGap: 'gap-4 sm:gap-5',
                    tabCls: 'px-4 sm:px-5 py-2.5 text-xs sm:text-sm',
                    tabGap: 'gap-1.5',
                    tabIconCls: 'text-sm',
                    tabShowLabel: true,
                    headerTitleCls: 'text-lg sm:text-xl font-extrabold',
                    headerSubCls: 'text-xs sm:text-sm',
                    headerIconSize: 'w-11 h-11 sm:w-12 sm:h-12',
                    headerIconCls: 'text-lg sm:text-xl',
                    sectionTitleCls: 'text-sm font-bold',
                    bodyTextCls: 'text-xs',
                    valueTextCls: 'text-xl sm:text-2xl font-extrabold',
                    // Colors
                    tabActive: isLight ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200/50' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30',
                    tabInactive: isLight ? 'text-violet-500 hover:bg-violet-50' : 'text-violet-400 hover:bg-violet-900/10',
                    headerIcon: isLight ? 'bg-gradient-to-br from-violet-100 to-fuchsia-100' : 'bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30',
                    headerIconText: isLight ? 'text-violet-600' : 'text-violet-400',
                    accentBg: isLight ? 'bg-violet-50' : 'bg-violet-900/10',
                    accentText: isLight ? 'text-violet-600' : 'text-violet-400',
                    accentBorder: isLight ? 'border-violet-200' : 'border-violet-800',
                    focusBorder: isLight ? 'focus:border-violet-400' : 'focus:border-violet-500',
                    btnPrimary: `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLight ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-md shadow-violet-200/50' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-md shadow-violet-900/30'}`,
                    btnSecondary: `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLight ? 'bg-violet-50 hover:bg-violet-100 text-violet-700' : 'bg-violet-900/20 hover:bg-violet-900/30 text-violet-300'}`,
                    progressBar: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
                    badgeBg: isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-900/30 text-violet-400',
                    highlightBg: isLight ? 'bg-violet-50 border-violet-200' : 'bg-violet-900/10 border-violet-800',
                    fabBg: isLight ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-xl shadow-violet-200/60' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-xl shadow-violet-900/50',
                }
            case 'minimal':
                return {
                    card: `rounded-xl ${isLight ? 'bg-white shadow-sm shadow-slate-100' : 'bg-[#0e0e0e]'}`,
                    radius: 'rounded-lg',
                    // Page layout
                    contentWidthCls: styles.boxWidth,
                    pageMarginCls: 'my-8 sm:my-14',
                    tabBarCls: `border-b border-solid ${isLight ? 'border-slate-200' : 'border-[#222]'} gap-0 pb-0`,
                    tabRadiusCls: 'rounded-none',
                    tabLayout: 'underline',
                    statGridCls: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                    chartGridCls: 'grid grid-cols-1 lg:grid-cols-2',
                    // Layout & density
                    cardPadding: 'p-5 sm:p-6',
                    headerPadding: 'p-5 sm:p-6 mb-5',
                    sectionGap: 'space-y-5',
                    gridGap: 'gap-4',
                    tabCls: 'px-3 sm:px-4 py-2.5 text-xs sm:text-sm',
                    tabGap: 'gap-4 sm:gap-6',
                    tabIconCls: 'hidden',
                    tabShowLabel: true,
                    headerTitleCls: 'text-base sm:text-lg font-semibold',
                    headerSubCls: 'text-[11px] sm:text-xs',
                    headerIconSize: 'w-9 h-9 sm:w-10 sm:h-10',
                    headerIconCls: 'text-base sm:text-lg',
                    sectionTitleCls: 'text-sm font-medium',
                    bodyTextCls: 'text-xs',
                    valueTextCls: 'text-lg sm:text-xl font-semibold',
                    // Colors
                    tabActive: isLight ? 'text-emerald-600 bg-transparent font-semibold shadow-[inset_0_-2px_0_0_#10b981]' : 'text-emerald-400 bg-transparent font-semibold shadow-[inset_0_-2px_0_0_#34d399]',
                    tabInactive: isLight ? 'text-slate-500 hover:text-emerald-600 bg-transparent' : 'text-gray-400 hover:text-emerald-400 bg-transparent',
                    headerIcon: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20',
                    headerIconText: isLight ? 'text-emerald-600' : 'text-emerald-400',
                    accentBg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/10',
                    accentText: isLight ? 'text-emerald-600' : 'text-emerald-400',
                    accentBorder: isLight ? 'border-emerald-200' : 'border-emerald-800',
                    focusBorder: isLight ? 'focus:border-emerald-400' : 'focus:border-emerald-500',
                    btnPrimary: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`,
                    btnSecondary: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-300'}`,
                    progressBar: 'bg-emerald-500',
                    badgeBg: isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400',
                    highlightBg: isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-900/10 border-emerald-800',
                    fabBg: isLight ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/50',
                }
            case 'glass':
                return {
                    card: `rounded-2xl border border-solid backdrop-blur-md ${isLight ? 'bg-white/60 border-white/40 shadow-lg shadow-slate-200/30' : 'bg-[#0e0e0e]/70 border-[#2B2B2B]/40 shadow-lg shadow-black/20'}`,
                    radius: 'rounded-xl',
                    // Page layout
                    contentWidthCls: styles.boxWidthEx,
                    pageMarginCls: 'my-6 sm:my-10',
                    tabBarCls: `p-1 rounded-xl backdrop-blur-md border border-solid ${isLight ? 'bg-white/40 border-slate-200/60' : 'bg-[#111]/50 border-[#333]/60'}`,
                    tabRadiusCls: 'rounded-lg',
                    tabLayout: 'segment-glass',
                    statGridCls: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                    chartGridCls: 'grid grid-cols-1 lg:grid-cols-2',
                    // Layout & density
                    cardPadding: 'p-5 sm:p-6',
                    headerPadding: 'p-5 sm:p-6 mb-4',
                    sectionGap: 'space-y-4',
                    gridGap: 'gap-4',
                    tabCls: 'px-3.5 sm:px-4 py-2 text-xs sm:text-sm',
                    tabGap: 'gap-1',
                    tabIconCls: 'text-xs',
                    tabShowLabel: true,
                    headerTitleCls: 'text-base sm:text-lg font-bold',
                    headerSubCls: 'text-[11px] sm:text-xs',
                    headerIconSize: 'w-10 h-10 sm:w-11 sm:h-11',
                    headerIconCls: 'text-base sm:text-lg',
                    sectionTitleCls: 'text-sm font-semibold',
                    bodyTextCls: 'text-xs',
                    valueTextCls: 'text-lg sm:text-xl font-bold',
                    // Colors
                    tabActive: isLight ? 'bg-cyan-500/80 backdrop-blur-sm text-white shadow-md shadow-cyan-200/30' : 'bg-cyan-600/80 backdrop-blur-sm text-white shadow-md shadow-cyan-900/20',
                    tabInactive: isLight ? 'text-cyan-600 hover:bg-cyan-50/50 backdrop-blur-sm' : 'text-cyan-400 hover:bg-cyan-900/10',
                    headerIcon: isLight ? 'bg-cyan-100/60 backdrop-blur-sm' : 'bg-cyan-900/20 backdrop-blur-sm',
                    headerIconText: isLight ? 'text-cyan-600' : 'text-cyan-400',
                    accentBg: isLight ? 'bg-cyan-50/60' : 'bg-cyan-900/10',
                    accentText: isLight ? 'text-cyan-600' : 'text-cyan-400',
                    accentBorder: isLight ? 'border-cyan-200' : 'border-cyan-800',
                    focusBorder: isLight ? 'focus:border-cyan-400' : 'focus:border-cyan-500',
                    btnPrimary: `px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm ${isLight ? 'bg-cyan-500/90 hover:bg-cyan-600/90 text-white shadow-sm' : 'bg-cyan-600/90 hover:bg-cyan-700/90 text-white'}`,
                    btnSecondary: `px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm ${isLight ? 'bg-cyan-50/60 hover:bg-cyan-100/60 text-cyan-700' : 'bg-cyan-900/20 hover:bg-cyan-900/30 text-cyan-300'}`,
                    progressBar: 'bg-cyan-500',
                    badgeBg: isLight ? 'bg-cyan-100/60 text-cyan-600' : 'bg-cyan-900/30 text-cyan-400',
                    highlightBg: isLight ? 'bg-cyan-50/60 border-cyan-200' : 'bg-cyan-900/10 border-cyan-800',
                    fabBg: isLight ? 'bg-cyan-500/90 hover:bg-cyan-600/90 text-white shadow-cyan-200 backdrop-blur-sm' : 'bg-cyan-600/90 hover:bg-cyan-700/90 text-white shadow-cyan-900/50',
                }
            default:
                return {
                    card: `rounded-xl border border-solid ${isLight ? 'bg-white/90 backdrop-blur-sm border-slate-200/80' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`,
                    radius: 'rounded-lg',
                    // Page layout
                    contentWidthCls: styles.boxWidthEx,
                    pageMarginCls: 'my-6 sm:my-12',
                    tabBarCls: '',
                    tabRadiusCls: 'rounded-lg',
                    tabLayout: 'pill',
                    statGridCls: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                    chartGridCls: 'grid grid-cols-1 lg:grid-cols-2',
                    // Layout & density
                    cardPadding: 'p-4 sm:p-5',
                    headerPadding: 'p-4 sm:p-6 mb-4',
                    sectionGap: 'space-y-4',
                    gridGap: 'gap-3 sm:gap-4',
                    tabCls: 'px-3 sm:px-4 py-2 text-xs sm:text-sm',
                    tabGap: 'gap-1',
                    tabIconCls: 'text-xs',
                    tabShowLabel: true,
                    headerTitleCls: 'text-base sm:text-lg font-bold',
                    headerSubCls: 'text-[11px] sm:text-xs',
                    headerIconSize: 'w-9 h-9 sm:w-10 sm:h-10',
                    headerIconCls: 'text-base sm:text-lg',
                    sectionTitleCls: 'text-sm font-semibold',
                    bodyTextCls: 'text-xs',
                    valueTextCls: 'text-lg sm:text-xl font-bold',
                    // Colors
                    tabActive: isLight ? 'bg-blue-500 text-white shadow-sm' : 'bg-blue-600 text-white',
                    tabInactive: isLight ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:bg-[#1a1a1a]',
                    headerIcon: isLight ? 'bg-blue-100' : 'bg-blue-900/30',
                    headerIconText: isLight ? 'text-blue-600' : 'text-blue-400',
                    accentBg: isLight ? 'bg-blue-50' : 'bg-blue-900/20',
                    accentText: isLight ? 'text-blue-600' : 'text-blue-400',
                    accentBorder: isLight ? 'border-blue-200' : 'border-blue-800',
                    focusBorder: isLight ? 'focus:border-blue-400' : 'focus:border-blue-500',
                    btnPrimary: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`,
                    btnSecondary: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`,
                    progressBar: 'bg-blue-500',
                    badgeBg: isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400',
                    highlightBg: isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-800',
                    fabBg: isLight ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/50',
                }
        }
    }, [activeTemplate, isLight])

    const card = templateStyles.card
    const cardP = `${templateStyles.card} ${templateStyles.cardPadding}`
    const inputCls = `w-full px-3 py-2 ${templateStyles.radius} text-sm border border-solid outline-none transition-all ${isLight ? `bg-white border-slate-200 ${templateStyles.focusBorder} text-slate-800` : `bg-[#1a1a1a] border-[#333] ${templateStyles.focusBorder} text-gray-200`}`
    const selectCls = `px-3 py-2 ${templateStyles.radius} text-sm border border-solid outline-none transition-all cursor-pointer ${isLight ? `bg-white border-slate-200 ${templateStyles.focusBorder} text-slate-800` : `bg-[#1a1a1a] border-[#333] ${templateStyles.focusBorder} text-gray-200`}`
    const btnPrimary = templateStyles.btnPrimary
    const btnSecondary = templateStyles.btnSecondary

    const allTabs = ALL_BUDGET_TABS
    const hiddenTabs = budgetSettings?.hiddenTabs || []
    const tabs = getVisibleBudgetTabs({ isViewer, hiddenTabs })

    const paymentIcon = useCallback((m) => {
        switch(m) {
            case 'GCash': return faMobileAlt
            case 'Bank': return faUniversity
            case 'Credit Card': case 'Debit Card': return faCreditCard
            case 'PayPal': return faCoins
            default: return faMoneyBillWave
        }
    }, [])

    const formatCurrencyRaw = useCallback((v, currencyCode) => {
        const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]
        return `${cur.symbol}${(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }, [])

    // Exchange rate state (viewCurrency in Redux for navbar sync)
    const [baseCurrencyLoaded, setBaseCurrencyLoaded] = useState(false)

    useEffect(() => {
        if (savedBaseCurrency && !baseCurrencyLoaded) {
            dispatch(setViewCurrency(savedBaseCurrency === 'PHP' ? '' : savedBaseCurrency))
            setBaseCurrencyLoaded(true)
        }
    }, [savedBaseCurrency, baseCurrencyLoaded, dispatch])

    const exchangeRates = useMemo(() => {
        const live = liveRates || {}
        const user = savedRates || {}
        const merged = { ...DEFAULT_EXCHANGE_RATES }
        CURRENCIES.forEach(c => {
            if (c.code === 'PHP') return
            if (live[c.code]) merged[c.code] = live[c.code]
        })
        Object.entries(user).forEach(([code, val]) => {
            if (val > 0) merged[code] = val
        })
        return merged
    }, [savedRates, liveRates])

    const PAYMENT_METHODS = useMemo(() => {
        const custom = budgetSettings?.paymentMethods || []
        const all = [...DEFAULT_PAYMENT_METHODS, ...custom.filter(m => !DEFAULT_PAYMENT_METHODS.includes(m))]
        return all
    }, [budgetSettings])

    const activeViewCurrency = viewCurrency || 'PHP'

    const setViewCurrencyAction = useCallback((val) => dispatch(setViewCurrency(val)), [dispatch])

    const toTargetCurrency = useCallback((amount, fromCurrency, target) => {
        if (fromCurrency === target) return amount
        if (target === 'PHP') {
            if (fromCurrency === 'PHP') return amount
            const fromRate = exchangeRates[fromCurrency]
            return (fromRate && fromRate > 0) ? amount / fromRate : amount
        }
        const targetRate = exchangeRates[target]
        if (!targetRate || targetRate <= 0) return null
        if (fromCurrency === 'PHP') return amount * targetRate
        const fromRate = exchangeRates[fromCurrency]
        return (fromRate && fromRate > 0) ? (amount / fromRate) * targetRate : amount * targetRate
    }, [exchangeRates])

    const formatCurrency = useCallback((v, currencyCode) => {
        const from = currencyCode || 'PHP'
        if (from === activeViewCurrency) return formatCurrencyRaw(v, activeViewCurrency)
        const converted = toTargetCurrency(v || 0, from, activeViewCurrency)
        if (converted !== null) return formatCurrencyRaw(converted, activeViewCurrency)
        return formatCurrencyRaw(v, from)
    }, [activeViewCurrency, formatCurrencyRaw, toTargetCurrency])

    const maskedBalance = useMemo(() => maskedBalanceText(formatCurrency), [formatCurrency])
    const displayCurrencyRaw = useCallback((v, currencyCode) => (
        showGlobalBalances ? formatCurrencyRaw(v, currencyCode) : maskedBalance
    ), [showGlobalBalances, formatCurrencyRaw, maskedBalance])
    const displayCurrency = useCallback((v, currencyCode) => (
        showGlobalBalances ? formatCurrency(v, currencyCode) : maskedBalance
    ), [showGlobalBalances, formatCurrency, maskedBalance])

    const getMonthAllocation = (cat) => {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`
        const monthly = cat.monthlyAllocation
        if (monthly && (monthly instanceof Map ? monthly.has(monthKey) : monthly[monthKey] != null)) {
            return Number(monthly instanceof Map ? monthly.get(monthKey) : monthly[monthKey])
        }
        return cat.allocationPercent ?? 80
    }

    const allocatedPool = useMemo(() => {
        const incomeCats = categories.filter(c => c.type === 'income')
        const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
        let pool = 0
        incomeCats.forEach(cat => {
            const catIncome = expenses
                .filter(e => e.category?._id === cat._id && e.type === 'income' && !e.listOnly)
                .reduce((s, e) => s + convert(e.amount, e.currency), 0)
            const pct = getMonthAllocation(cat)
            pool += catIncome * (pct / 100)
        })
        const uncategorizedIncome = expenses
            .filter(e => !e.category && e.type === 'income' && !e.listOnly)
            .reduce((s, e) => s + convert(e.amount, e.currency), 0)
        pool += uncategorizedIncome
        return pool
    }, [categories, expenses, activeViewCurrency, exchangeRates, month, year])

    const totalIncomeGlobal = useMemo(() => {
        const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
        return expenses.filter(e => e.type === 'income' && !e.listOnly).reduce((s, e) => s + convert(e.amount, e.currency), 0)
    }, [expenses, activeViewCurrency, exchangeRates])

    const autoSavings = totalIncomeGlobal - allocatedPool

    const monthlyBudgetData = useMemo(() => {
        const convertAmt = (e) => {
            const converted = toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency)
            return converted ?? e.amount
        }
        const expenseCats = categories.filter(c => c.type === 'expense')
        const totalStaticBudget = expenseCats.reduce((s, c) => s + (c.budget || 0), 0)
        const rows = expenseCats.map(cat => {
            const spent = expenses
                .filter(e => e.category?._id === cat._id && e.type === 'expense' && !e.listOnly)
                .reduce((s, e) => s + convertAmt(e), 0)
            const baseBudget = toTargetCurrency(cat.budget || 0, 'PHP', activeViewCurrency) ?? (cat.budget || 0)
            const allocated = totalStaticBudget > 0 && allocatedPool > 0
                ? ((cat.budget || 0) / totalStaticBudget) * allocatedPool
                : baseBudget
            const budget = allocated
            const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0
            return { ...cat, spent, budget, baseBudget, remaining: budget - spent, percentage: pct }
        })
        const uncategorizedSpent = expenses
            .filter(e => !e.category && e.type === 'expense' && !e.listOnly)
            .reduce((s, e) => s + convertAmt(e), 0)
        if (uncategorizedSpent > 0 || expenseCats.length > 0) {
            rows.push({
                _id: 'uncategorized',
                name: 'Unallocated / Uncategorized',
                color: '#94a3b8',
                icon: '',
                spent: uncategorizedSpent,
                budget: 0,
                baseBudget: 0,
                remaining: -uncategorizedSpent,
                percentage: 0,
                unallocated: true,
            })
        }
        return rows
    }, [categories, expenses, activeViewCurrency, exchangeRates, allocatedPool])

    const ytdData = useMemo(() => {
        if (!ytdExpenses.length) return null
        const active = ytdExpenses.filter(e => !e.listOnly)
        const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
        const ytdIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
        const ytdExpense = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
        const ytdBalance = ytdIncome - ytdExpense
        const ytdTxCount = active.length

        const monthlyBreakdown = {}
        active.forEach(e => {
            const d = new Date(e.date)
            const m = d.getMonth()
            if (!monthlyBreakdown[m]) monthlyBreakdown[m] = { income: 0, expense: 0, count: 0 }
            const amt = convert(e.amount, e.currency)
            if (e.type === 'income') monthlyBreakdown[m].income += amt
            else monthlyBreakdown[m].expense += amt
            monthlyBreakdown[m].count++
        })

        const catSpending = {}
        const categoryByMonth = {}
        active.filter(e => e.type === 'expense').forEach(e => {
            const catId = e.category?._id || 'uncategorized'
            const catName = e.category?.name || 'Uncategorized'
            const catColor = e.category?.color || '#94a3b8'
            const catIcon = e.category?.icon || ''
            if (!catSpending[catId]) catSpending[catId] = { name: catName, color: catColor, icon: catIcon, amount: 0 }
            catSpending[catId].amount += convert(e.amount, e.currency)
            const m = new Date(e.date).getMonth()
            if (!categoryByMonth[catId]) categoryByMonth[catId] = {}
            if (!categoryByMonth[catId][m]) categoryByMonth[catId][m] = 0
            categoryByMonth[catId][m] += convert(e.amount, e.currency)
        })
        const topCategories = Object.values(catSpending).sort((a, b) => b.amount - a.amount).slice(0, 5)

        const elapsed = month
        const monthlyAvg = elapsed > 0 ? ytdExpense / elapsed : 0

        return { ytdIncome, ytdExpense, ytdBalance, ytdTxCount, monthlyBreakdown, topCategories, monthlyAvg, categoryBreakdown: categoryByMonth }
    }, [ytdExpenses, activeViewCurrency, exchangeRates, month])

    // Smart Notifications Generator
    useEffect(() => {
        if (!dashboard || !categories.length) return
        const alerts = []
        const today = new Date()
        const currentDay = (today.getMonth() + 1 === month && today.getFullYear() === year) ? today.getDate() : null

        monthlyBudgetData.filter(c => c.budget > 0).forEach(cat => {
            if (cat.percentage >= 80 && cat.percentage < 100) {
                alerts.push({ id: `warn-${cat._id}-${month}`, severity: 'warning', icon: faExclamationTriangle, message: `${cat.name} is at ${Math.round(cat.percentage)}% — ${displayCurrencyRaw(cat.budget - cat.spent, activeViewCurrency)} left` })
            } else if (cat.percentage > 100) {
                alerts.push({ id: `over-${cat._id}-${month}`, severity: 'danger', icon: faExclamationTriangle, message: `${cat.name} exceeded budget by ${displayCurrencyRaw(cat.spent - cat.budget, activeViewCurrency)}` })
            }
        })

        if (currentDay && currentDay >= 25) {
            const recurringCount = expenses.filter(e => e.isRecurring).length
            if (recurringCount > 0) {
                alerts.push({ id: `bills-${month}`, severity: 'info', icon: faSyncAlt, message: `${recurringCount} recurring transaction${recurringCount > 1 ? 's' : ''} scheduled this month` })
            }
        }

        const upcomingDebts = (debts || []).filter(d => d.due_date && d.amount_paid < d.total_amount).filter(d => {
            const due = new Date(d.due_date)
            const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
            return daysUntil >= 0 && daysUntil <= 3
        })
        if (upcomingDebts.length > 0) {
            alerts.push({ id: `debt-due-${month}-${today.getDate()}`, severity: 'warning', icon: faHandHoldingUsd, message: `${upcomingDebts.length} debt payment${upcomingDebts.length > 1 ? 's' : ''} due within 3 days` })
        }

        setBudgetNotifications(alerts)
    }, [dashboard, monthlyBudgetData, expenses, debts, month, year, displayCurrencyRaw, activeViewCurrency])

    const statusColor = useCallback((pct) => {
        if (pct > 100) return { bg: isLight ? 'bg-red-50' : 'bg-red-900/20', text: 'text-red-500', bar: 'bg-red-500', border: isLight ? 'border-red-200' : 'border-red-800/50', label: 'Over budget', icon: faExclamationTriangle }
        if (pct === 100) return { bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20', text: 'text-emerald-500', bar: 'bg-emerald-500', border: isLight ? 'border-emerald-200' : 'border-emerald-800/50', label: 'Exactly on budget', icon: faCheckCircle }
        if (pct >= 80) return { bg: isLight ? 'bg-amber-50' : 'bg-amber-900/20', text: 'text-amber-500', bar: 'bg-amber-500', border: isLight ? 'border-amber-200' : 'border-amber-800/50', label: 'Near limit', icon: faExclamationTriangle }
        return { bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20', text: 'text-emerald-500', bar: 'bg-emerald-500', border: isLight ? 'border-emerald-200' : 'border-emerald-800/50', label: 'On track', icon: faCheckCircle }
    }, [isLight])

    if (!user) {
        return (
            <div className={`relative overflow-hidden min-h-full w-full ${main.font} ${isLight ? light.body : dark.body}`}>
                <div className={`${styles.paddingX} ${styles.flexCenter}`}>
                    <div className={`${styles.boxWidthEx}`}>
                        <div className="flex items-center justify-center py-32">
                            <div className={`text-center ${card} p-8`}>
                                <FontAwesomeIcon icon={faWallet} className={`text-4xl mb-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                                <h2 className={`text-lg font-semibold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>Login Required</h2>
                                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Please log in to access the budget system.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const budgetContextValue = useMemo(() => ({
        isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, templateStyles,
        formatCurrency: displayCurrency, formatCurrencyRaw: displayCurrencyRaw, activeViewCurrency, toTargetCurrency,
        dispatch, month, year, categories, expenses, isLoading,
        PAYMENT_METHODS, paymentIcon, statusColor,
        setReceiptViewer, setNotification, setShowNotif,
    }), [isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, templateStyles, displayCurrency, displayCurrencyRaw, activeViewCurrency, toTargetCurrency, dispatch, month, year, categories, expenses, isLoading, PAYMENT_METHODS, paymentIcon, statusColor])

    return (
        <BudgetContext.Provider value={budgetContextValue}>
        <div className={`relative min-h-full w-full ${main.font} ${isLight ? light.body : dark.body}`}>
            <a href="#budget-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[10000] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">Skip to content</a>
            <style>{`
                @keyframes barGrow { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); transform-origin: left; } }
                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes countPulse { 0% { transform: scale(0.95); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
            `}</style>
            <div className={`${styles.paddingX} ${styles.flexCenter}`}>
                <div className={`${templateStyles.contentWidthCls} min-w-0`}>
                    <div className={`relative px-0 ${templateStyles.pageMarginCls}`}>

                        <Notification theme={theme} data={notification} show={showNotif} setShow={setShowNotif} />

                        {/* Shared Budget Banner */}
                        {isViewingShared && (
                            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3 border border-solid ${
                                isViewer
                                    ? (isLight ? 'bg-amber-50 border-amber-200' : 'bg-[#111] border-amber-900')
                                    : (isLight ? 'bg-blue-50 border-blue-200' : 'bg-[#111] border-blue-900')
                            }`}>
                                <FontAwesomeIcon icon={isViewer ? faEye : faPen} className={`text-xs ${isViewer ? 'text-amber-500' : 'text-blue-500'}`} />
                                <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                    Viewing <strong>{viewingBudgetOwner?.username}</strong>'s budget
                                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isViewer
                                            ? (isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400')
                                            : (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400')
                                    }`}>{viewingRole}</span>
                                </span>
                                <button
                                    onClick={() => dispatch(setViewingBudgetOwner(null))}
                                    className={`ml-auto text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all ${isLight ? 'bg-white hover:bg-slate-50 text-slate-600 border border-solid border-slate-200' : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300 border border-solid border-[#333]'}`}
                                >
                                    Back to My Budget
                                </button>
                            </div>
                        )}

                        {/* Header */}
                        <div className={`${card} ${templateStyles.headerPadding}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`${templateStyles.headerIconSize} ${templateStyles.radius} flex items-center justify-center flex-shrink-0 ${templateStyles.headerIcon}`}>
                                        <FontAwesomeIcon icon={faWallet} className={`${templateStyles.headerIconCls} ${templateStyles.headerIconText}`} />
                                    </div>
                                    <div>
                                        <h1 className={`${templateStyles.headerTitleCls} ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                            {isViewingShared ? `${viewingBudgetOwner?.username}'s Budget` : 'Budget Manager'}
                                        </h1>
                                        <p className={`${templateStyles.headerSubCls} ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {isViewingShared ? `${viewingRole === 'viewer' ? 'View only' : 'Editor'} access` : 'Track your income and expenses'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    {/* Month navigation */}
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={prevMonth} disabled={isLoading} aria-label="Previous month" className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#1f1f1f] text-gray-400'}`}>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs rotate-180" />
                                        </button>
                                        <span className={`text-xs sm:text-sm font-semibold min-w-[100px] sm:min-w-[140px] text-center flex-shrink-0 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                            {MONTHS[month - 1]} {year}
                                        </span>
                                        <button onClick={nextMonth} disabled={isLoading} aria-label="Next month" className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#1f1f1f] text-gray-400'}`}>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                        </button>
                                        <button onClick={refreshData} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#1f1f1f] text-gray-400'}`} title="Refresh" aria-label="Refresh data">
                                            <FontAwesomeIcon icon={faSyncAlt} className={`text-xs ${isLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                        {(month !== now.getMonth() + 1 || year !== now.getFullYear()) && (
                                            <button onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()) }} className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 ${templateStyles.radius} flex-shrink-0 transition-all ${templateStyles.accentBg} ${templateStyles.accentText}`} title="Jump to current month">
                                                <FontAwesomeIcon icon={faCalendarDay} className="text-[10px]" />
                                                <span className="hidden sm:inline">Today</span>
                                            </button>
                                        )}
                                    </div>
                                    {/* Action icons */}
                                    <div className="flex items-center justify-center gap-2">
                                        {expenses.length > 0 && (
                                            <button onClick={handleExportCSV} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 ${templateStyles.radius} flex-shrink-0 transition-all ${isLight ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`} title="Export to CSV">
                                                <FontAwesomeIcon icon={faFileExport} className="text-[10px]" />
                                                <span className="hidden sm:inline">Export</span>
                                            </button>
                                        )}
                                        <div className={`flex items-center gap-1 pl-2 border-l border-solid flex-shrink-0 ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`}>
                                            <button
                                                type="button"
                                                onClick={() => setShowGlobalBalances(v => !v)}
                                                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-all ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#1a1a1a]'}`}
                                                title={showGlobalBalances ? 'Hide all balances' : 'Show all balances'}
                                            >
                                                <FontAwesomeIcon icon={showGlobalBalances ? faEye : faEyeSlash} className="text-[10px]" />
                                                <span className="hidden sm:inline">{showGlobalBalances ? 'Hide' : 'Show'}</span>
                                            </button>
                                        </div>
                                        <div className={`flex items-center gap-1 pl-2 border-l border-solid flex-shrink-0 ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`}>
                                            <FontAwesomeIcon icon={faExchangeAlt} className={`text-[10px] hidden sm:inline ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                            <select
                                                value={viewCurrency}
                                                onChange={e => dispatch(setViewCurrency(e.target.value))}
                                                className={`text-[11px] font-semibold py-1 pl-1 pr-5 rounded-md border-0 cursor-pointer appearance-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500/30 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}
                                                title="View currency"
                                            >
                                                {CURRENCIES.map(c => {
                                                    const val = c.code === 'PHP' ? '' : c.code
                                                    const isDefault = c.code === (savedBaseCurrency || 'PHP')
                                                    return <option key={c.code} value={val} className={isLight ? 'bg-white text-slate-700' : 'bg-[#1a1a1a] text-gray-200'}>{c.symbol} {c.code}{isDefault ? ' ★' : ''}</option>
                                                })}
                                            </select>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={() => { setShowShareBudgetModal(true); dispatch(getSharedUsers()) }}
                                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0 transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}
                                                title="Share budget"
                                            >
                                                <FontAwesomeIcon icon={faShare} className="text-[10px]" />
                                                <span className="hidden sm:inline">Share</span>
                                            </button>
                                        )}
                                        {sharedBudgets.length > 0 && (
                                            <div className="relative flex-shrink-0">
                                                <button
                                                    onClick={() => setShowBudgetDropdown(prev => !prev)}
                                                    aria-expanded={showBudgetDropdown}
                                                    aria-haspopup="true"
                                                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300'}`}
                                                    title="Shared budgets"
                                                >
                                                    <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                                                    <span className="hidden sm:inline">Budgets</span>
                                                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full ${templateStyles.badgeBg}`}>{sharedBudgets.length}</span>
                                                </button>
                                            {showBudgetDropdown && (
                                            <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl border border-solid shadow-xl z-50 overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}>
                                                {!isViewingShared && (
                                                    <div className={`px-3 py-2 text-[11px] font-bold ${isLight ? 'text-blue-600 bg-blue-50' : 'text-blue-400 bg-blue-900/10'}`}>
                                                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5 text-[10px]" />My Budget
                                                    </div>
                                                )}
                                                {isViewingShared && (
                                                    <button
                                                        onClick={() => dispatch(setViewingBudgetOwner(null))}
                                                        className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-[#111] text-gray-300'}`}
                                                    >
                                                        <FontAwesomeIcon icon={faWallet} className="mr-1.5 text-[10px]" />My Budget
                                                    </button>
                                                )}
                                                <div className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`} />
                                                {sharedBudgets.map(s => (
                                                    <button
                                                        key={s._id}
                                                        onClick={() => dispatch(setViewingBudgetOwner({ id: s.owner?._id, username: s.owner?.username }))}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium transition-colors ${
                                                            viewingBudgetOwner?.id === s.owner?._id
                                                                ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/10 text-blue-400')
                                                                : (isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-[#111] text-gray-300')
                                                        }`}
                                                    >
                                                        <span className="truncate">{s.owner?.username}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                            s.role === 'editor'
                                                                ? (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400')
                                                                : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-500')
                                                        }`}>{s.role}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`grid duration-300 ease-out ${showContentTabs ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'}`}
                                style={{ transitionProperty: 'grid-template-rows, opacity, margin-top' }}
                                aria-hidden={!showContentTabs}
                            >
                                <div className="overflow-hidden min-h-0">
                            <div className={`flex flex-nowrap items-center ${templateStyles.tabGap} overflow-x-auto overflow-y-hidden -mx-1 px-1 ${templateStyles.tabBarCls}`} role="tablist" aria-label="Budget sections"
                                onKeyDown={(e) => {
                                    const idx = tabs.findIndex(t => t.id === activeTab)
                                    if (e.key === 'ArrowRight') { e.preventDefault(); setActiveTab(tabs[(idx + 1) % tabs.length].id) }
                                    if (e.key === 'ArrowLeft') { e.preventDefault(); setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].id) }
                                    if (e.key === 'Home') { e.preventDefault(); setActiveTab(tabs[0].id) }
                                    if (e.key === 'End') { e.preventDefault(); setActiveTab(tabs[tabs.length - 1].id) }
                                }}
                            >
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                        aria-controls={`tabpanel-${tab.id}`}
                                        tabIndex={activeTab === tab.id ? 0 : -1}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 sm:gap-2 ${templateStyles.tabCls} ${templateStyles.tabRadiusCls} font-medium whitespace-nowrap transition-all ${
                                            activeTab === tab.id
                                                ? templateStyles.tabActive
                                                : templateStyles.tabInactive
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={tab.icon} className={templateStyles.tabIconCls} />
                                        {templateStyles.tabShowLabel && <span className="hidden sm:inline">{tab.label}</span>}
                                        {templateStyles.tabShowLabel && <span className="sm:hidden">{tab.label.split(' ')[0]}</span>}
                                    </button>
                                ))}
                            </div>
                                </div>
                            </div>
                        </div>

                        {/* Pinned Expenses - Quick Log */}
                        {pinnedExpenses.length > 0 && !isViewer && (
                            <div className={`mb-3 ${card} px-3 py-2.5`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <FontAwesomeIcon icon={faClone} className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                    <span className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Quick Log</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {pinnedExpenses.map((p, i) => (
                                        <div key={i} className="group relative">
                                            <button onClick={() => quickLogPinned(p)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border border-solid ${
                                                isLight ? 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600' : 'bg-[#111] hover:bg-blue-900/20 border-[#1f1f1f] hover:border-blue-800/50 text-gray-300 hover:text-blue-300'
                                            }`} title={`Quick log: ${p.description} (${p.amount})`}>
                                                {p.categoryColor && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.categoryColor }} />}
                                                <span className="truncate max-w-[100px]">{p.description}</span>
                                                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{displayCurrencyRaw(p.amount, p.currency)}</span>
                                            </button>
                                            <button onClick={() => unpinExpense(i)} className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-red-100 text-red-500' : 'bg-red-900/40 text-red-400'}`}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Smart Notifications */}
                        {budgetNotifications.length > 0 && (
                            <div className="mb-3 space-y-1.5">
                                {budgetNotifications.filter(n => !dismissedAlerts.includes(n.id)).slice(0, 3).map(n => (
                                    <div key={n.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-solid ${
                                        n.severity === 'danger' ? (isLight ? 'bg-red-50/80 border-red-200' : 'bg-red-900/10 border-red-800/30') :
                                        n.severity === 'warning' ? (isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-900/10 border-amber-800/30') :
                                        (isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-blue-900/10 border-blue-800/30')
                                    }`}>
                                        <FontAwesomeIcon icon={n.icon || faExclamationTriangle} className={`text-xs flex-shrink-0 ${
                                            n.severity === 'danger' ? 'text-red-500' : n.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                                        }`} />
                                        <span className={`text-xs flex-1 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{n.message}</span>
                                        <button onClick={() => dismissAlert(n.id)} className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'}`}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tab Content */}
                        <div id="budget-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
                        {activeTab === 'dashboard' && <DashboardTab dashboard={dashboard} expenses={expenses} categories={categories} monthlyBudgetData={monthlyBudgetData} isLight={isLight} card={card} formatCurrency={displayCurrency} formatCurrencyRaw={displayCurrencyRaw} statusColor={statusColor} isLoading={isLoading} activeViewCurrency={activeViewCurrency} toTargetCurrency={toTargetCurrency} month={month} year={year} savingsAccounts={savingsAccounts} debts={debts} goals={goals} paymentIcon={paymentIcon} setReceiptViewer={setReceiptViewer} ytdData={ytdData} ytdLoading={ytdLoading} isViewer={isViewer} templateStyles={templateStyles} allocatedPool={allocatedPool} autoSavings={autoSavings} showBalances={showGlobalBalances} maskedBalance={maskedBalance} netWorthHistory={netWorthHistory} />}
                        {activeTab === 'daily' && (
                            <DailyExpensesTab
                                groupedByDate={groupedByDate} categories={categories} expenses={expenses}
                                expenseForm={expenseForm} setExpenseForm={setExpenseForm} editingExpense={editingExpense}
                                expenseItems={expenseItems} setExpenseItems={setExpenseItems} emptyItem={emptyItem}
                                showExpenseForm={showExpenseForm} setShowExpenseForm={setShowExpenseForm}
                                handleExpenseSubmit={handleExpenseSubmit} handleEditExpense={handleEditExpense}
                                handleDuplicateExpense={handleDuplicateExpense}
                                handleDeleteExpense={handleDeleteExpense} setEditingExpense={setEditingExpense}
                                deleteConfirm={deleteConfirm} isLight={isLight} card={card} inputCls={inputCls}
                                selectCls={selectCls} btnPrimary={btnPrimary} btnSecondary={btnSecondary}
                                formatCurrency={displayCurrency} paymentIcon={paymentIcon}
                                emptyExpense={emptyExpense} isLoading={isLoading || isExpensesLoading}
                                selectedExpenses={selectedExpenses} toggleSelectExpense={toggleSelectExpense}
                                toggleSelectAll={toggleSelectAll} handleBulkDelete={handleBulkDelete}
                                bulkDeleteConfirm={bulkDeleteConfirm} setSelectedExpenses={setSelectedExpenses}
                                setBulkDeleteConfirm={setBulkDeleteConfirm}
                                handleBulkCategoryUpdate={handleBulkCategoryUpdate}
                                handleBulkCurrencyUpdate={handleBulkCurrencyUpdate}
                                handleBulkDateUpdate={handleBulkDateUpdate}
                                handleBulkPaymentMethodUpdate={handleBulkPaymentMethodUpdate}
                                dispatch={dispatch} month={month} year={year} searchResults={searchResults}
                                attachmentPreview={attachmentPreview} setAttachmentPreview={setAttachmentPreview}
                                handleReceiptUpload={handleReceiptUpload} removeReceipt={removeReceipt}
                                uploadingReceipt={uploadingReceipt} setReceiptViewer={setReceiptViewer}
                                savedRates={savedRates} liveRates={liveRates} savedBaseCurrency={savedBaseCurrency}
                                viewCurrency={viewCurrency} setViewCurrency={setViewCurrencyAction}
                                exchangeRates={exchangeRates} activeViewCurrency={activeViewCurrency}
                                toTargetCurrency={toTargetCurrency} formatCurrencyRaw={displayCurrencyRaw}
                                PAYMENT_METHODS={PAYMENT_METHODS}
                                isViewer={isViewer}
                                ownerParam={ownerParam}
                                pinExpense={pinExpense}
                                urlSearchQuery={urlSearchQuery}
                            />
                        )}
                        {activeTab === 'monthly' && (
                            <MonthlyBudgetTab
                                monthlyBudgetData={monthlyBudgetData} dashboard={dashboard}
                                isLight={isLight} card={card} formatCurrency={displayCurrency} statusColor={statusColor}
                                month={month} year={year} isLoading={isLoading}
                                expenses={expenses} formatCurrencyRaw={displayCurrencyRaw}
                                activeViewCurrency={activeViewCurrency} toTargetCurrency={toTargetCurrency}
                                categories={categories} paymentIcon={paymentIcon}
                                setReceiptViewer={setReceiptViewer}
                            />
                        )}
                        {activeTab === 'categories' && (
                            <CategoriesTab
                                categories={categories} categoryForm={categoryForm} setCategoryForm={setCategoryForm}
                                editingCategory={editingCategory} showCategoryForm={showCategoryForm}
                                setShowCategoryForm={setShowCategoryForm} handleCategorySubmit={handleCategorySubmit}
                                handleEditCategory={handleEditCategory} handleDeleteCategory={handleDeleteCategory}
                                setEditingCategory={setEditingCategory} deleteConfirm={deleteConfirm}
                                isLight={isLight} card={card} inputCls={inputCls} selectCls={selectCls}
                                btnPrimary={btnPrimary} btnSecondary={btnSecondary} formatCurrency={displayCurrency}
                                emptyCategory={emptyCategory} isLoading={isLoading || isCategoriesLoading}
                                dispatch={dispatch} currentUserId={user?._id}
                                isViewer={isViewer} ownerParam={ownerParam}
                            />
                        )}
                        {activeTab === 'savings' && (
                            <SavingsTab isLight={isLight} card={card} inputCls={inputCls} formatCurrency={formatCurrency} dispatch={dispatch} savingsAccounts={savingsAccounts} savingsHistory={savingsHistory} isLoading={isSavingsLoading} isViewer={isViewer} templateStyles={templateStyles} />
                        )}
                        {activeTab === 'debts' && (
                            <DebtTab
                                debts={debts} categories={categories} dispatch={dispatch} isLight={isLight} card={card}
                                inputCls={inputCls} selectCls={selectCls} btnPrimary={btnPrimary}
                                btnSecondary={btnSecondary} formatCurrency={displayCurrency} isLoading={isDebtsLoading}
                                PAYMENT_METHODS={PAYMENT_METHODS}
                                isViewer={isViewer} ownerParam={ownerParam}
                                showBalances={showGlobalBalances} maskedBalance={maskedBalance}
                            />
                        )}
                        {activeTab === 'lists' && (
                            <ListsTab
                                budgetLists={budgetLists} dispatch={dispatch} isLight={isLight} card={card}
                                inputCls={inputCls} selectCls={selectCls} btnPrimary={btnPrimary} btnSecondary={btnSecondary}
                                isLoading={isListsLoading}
                                isViewer={isViewer} ownerParam={ownerParam}
                                month={month} year={year}
                            />
                        )}
                        {activeTab === 'goals' && (
                            <GoalsTab
                                goals={goals} categories={categories} savingsAccounts={savingsAccounts} dispatch={dispatch} isLight={isLight} card={card}
                                inputCls={inputCls} selectCls={selectCls} btnPrimary={btnPrimary}
                                btnSecondary={btnSecondary} formatCurrency={displayCurrency} isLoading={isGoalsLoading}
                                isViewer={isViewer} ownerParam={ownerParam}
                                showBalances={showGlobalBalances} maskedBalance={maskedBalance}
                            />
                        )}
                        {activeTab === 'summary' && (
                            <SummaryTab
                                dashboard={dashboard} expenses={expenses} categories={categories}
                                monthlyBudgetData={monthlyBudgetData} groupedByDate={groupedByDate}
                                month={month} year={year} isLight={isLight} card={card}
                                formatCurrency={displayCurrency} formatCurrencyRaw={displayCurrencyRaw}
                                statusColor={statusColor} paymentIcon={paymentIcon} isLoading={isLoading}
                                activeViewCurrency={activeViewCurrency} toTargetCurrency={toTargetCurrency}
                                ytdData={ytdData} ytdLoading={ytdLoading} debts={debts}
                                showBalances={showGlobalBalances} maskedBalance={maskedBalance}
                            />
                        )}
                        {activeTab === 'settings' && (
                            <SettingsTab
                                isLight={isLight} card={card} inputCls={inputCls} selectCls={selectCls}
                                btnPrimary={btnPrimary} btnSecondary={btnSecondary}
                                dispatch={dispatch} categories={categories} expenses={expenses}
                                savedRates={savedRates} liveRates={liveRates}
                                savedBaseCurrency={savedBaseCurrency} exchangeRates={exchangeRates}
                                viewCurrency={viewCurrency} setViewCurrency={setViewCurrencyAction}
                                activeViewCurrency={activeViewCurrency} formatCurrencyRaw={displayCurrencyRaw}
                                budgetSettings={budgetSettings} PAYMENT_METHODS={PAYMENT_METHODS}
                                month={month} year={year} templateStyles={templateStyles}
                                dashboard={dashboard} monthlyBudgetData={monthlyBudgetData}
                                allTabs={allTabs}
                                allocatedPool={allocatedPool} autoSavings={autoSavings} totalIncomeGlobal={totalIncomeGlobal}
                                isLoading={isLoading}
                            />
                        )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add FAB */}
            {!isViewer && activeTab !== 'daily' && !showExpenseForm && (
                <button
                    onClick={() => { setActiveTab('daily'); setTimeout(() => setShowExpenseForm(true), 100) }}
                    className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${templateStyles.fabBg}`}
                    title="Quick add expense (navigate to Daily tab)"
                    aria-label="Quick add expense"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-lg" />
                </button>
            )}

            {/* Receipt Viewer Lightbox */}
            {receiptViewer && (
                <ModalOverlay onClose={() => setReceiptViewer(null)} isLight={isLight}>
                    <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-3">
                            <a href={receiptViewer} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                                <FontAwesomeIcon icon={faArrowRight} className="mr-1.5 text-[10px]" />
                                Open in new tab
                            </a>
                            <button onClick={() => setReceiptViewer(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                                <FontAwesomeIcon icon={faTimes} className="mr-1.5 text-[10px]" />
                                Close
                            </button>
                        </div>
                        <img src={receiptViewer} alt="Receipt" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
                    </div>
                </ModalOverlay>
            )}

            {/* Share Budget Modal */}
            {showShareBudgetModal && (
                <ShareBudgetModal
                    isLight={isLight}
                    sharedUsers={sharedUsers}
                    username={shareBudgetUsername}
                    onUsernameChange={setShareBudgetUsername}
                    role={shareBudgetRole}
                    onRoleChange={setShareBudgetRole}
                    externalAlert={modalAlert}
                    onInvite={async (username, role) => {
                        await dispatch(shareBudget({ username, role })).unwrap()
                    }}
                    onUpdateRole={(targetUserId, role) => dispatch(updateBudgetShareAction({ targetUserId, role }))}
                    onRemove={async (targetUserId) => {
                        await dispatch(unshareBudget({ targetUserId })).unwrap()
                    }}
                    onClose={() => {
                        setShowShareBudgetModal(false)
                        setShareBudgetUsername('')
                        setShareBudgetRole('viewer')
                        setModalAlert(null)
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <DeleteConfirmModal
                    isLight={isLight}
                    title={deleteModal.title}
                    message={deleteModal.message}
                    confirmLabel={deleteModal.type === 'duplicate' ? 'Add anyway' : 'Delete'}
                    onCancel={() => setDeleteModal(null)}
                    onConfirm={() => {
                        if (deleteModal.type === 'expense') confirmDeleteExpense(deleteModal.id)
                        else if (deleteModal.type === 'category') confirmDeleteCategory(deleteModal.id)
                        else if (deleteModal.type === 'bulk') confirmBulkDelete()
                        else if (deleteModal.type === 'duplicate') {
                            setDeleteModal(null)
                            handleExpenseSubmit({ confirmDuplicates: true })
                        }
                        else setDeleteModal(null)
                    }}
                />
            )}
        </div>
        </BudgetContext.Provider>
    )
}

export default Budget
