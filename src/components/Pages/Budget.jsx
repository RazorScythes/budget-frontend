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

const loadVercelBlob = () => import('@vercel/blob').then(m => m.put)
import { deleteReceipt as deleteReceiptApi, getBudgetExpenses as fetchBudgetExpensesApi } from '../../endpoint'
const loadSocketIO = () => import('socket.io-client').then(m => m.io)
import { 
    getBudgetInitialLoad,
    getBudgetDashboard, getBudgetCategories, createBudgetCategory, updateBudgetCategory, 
    deleteBudgetCategory, shareBudgetCategory, unshareBudgetCategory,
    getBudgetExpenses, createBudgetExpense, updateBudgetExpense, 
    deleteBudgetExpense, bulkDeleteBudgetExpenses, bulkUpdateBudgetCategory, bulkUpdateBudgetCurrency,
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
import { ModalOverlay, AnimateIn as AnimateInShared, SafeIcon as SafeIconShared } from './Budget/SharedComponents'
import ShareBudgetModal from './Budget/ShareBudgetModal'
import ShareCategoryModal from './Budget/ShareCategoryModal'
import SavingsTab from './Budget/SavingsTab'
import BalanceAmount from './Budget/BalanceAmount'
import SettingsTab from './Budget/SettingsTab'
import TrendsChart from './Budget/TrendsChart'
import { calcAllSavingsTotal, calcAccountTotal } from '../../utils/savings'
import { calcNetWorth } from '../../utils/netWorth'
import { loadGlobalBalancesVisible, saveGlobalBalancesVisible, maskedBalanceText } from '../../utils/balancePrivacy'
import { generateBudgetSummaryPdf, formatPdfAmount, sanitizePdfText } from '../../utils/budgetSummaryPdf'
import { toLocalDateString } from './Budget/utils'
import {
    DEFAULT_PAYMENT_METHODS, CATEGORY_COLORS, MONTHS, VALID_TABS,
    CURRENCIES, DEFAULT_EXCHANGE_RATES, ICON_GRID, DENOMINATIONS as DENOMINATIONS_CONST
} from './Budget/constants'

const DeleteConfirmModal = ({ isLight, onConfirm, onCancel, title = 'Delete', message = 'Are you sure? This action cannot be undone.' }) => {
    return (
        <ModalOverlay onClose={onCancel} isLight={isLight}>
            <div className={`relative rounded-xl shadow-2xl w-full max-w-md p-6 ${isLight ? 'bg-white' : 'bg-[#161616] border border-[#222]'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-red-50' : 'bg-red-900/20'}`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg text-red-500" />
                    </div>
                    <div>
                        <h3 className={`text-base font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{title}</h3>
                        <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2.5">
                    <button onClick={onCancel} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#252525]'}`}>Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">Delete</button>
                </div>
            </div>
        </ModalOverlay>
    )
}

const AnimateIn = ({ children, delay = 0, className = '' }) => {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(t)
    }, [delay])
    return (
        <div className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
            {children}
        </div>
    )
}

const Budget = ({ user, theme }) => {
    const dispatch = useDispatch()
    const { dashboard, categories, expenses, savingsAccounts, savingsHistory, debts, budgetLists, goals, searchResults, exchangeRates: savedRates, liveRates, baseCurrency: savedBaseCurrency, viewCurrency, budgetSettings, sharedUsers, sharedBudgets, viewingBudgetOwner, alert: budgetAlert, isLoading, isCategoriesLoading, isExpensesLoading, isSavingsLoading, isDebtsLoading, isGoalsLoading, isListsLoading } = useSelector(state => state.budget)
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
            socket = socketIO(socketUrl, { transports: ['websocket', 'polling'] })

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
        const token = searchParams.get('invite')
        if (!token || !user) return

        const acceptInvite = async () => {
            try {
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
            const next = new URLSearchParams(searchParams)
            next.delete('invite')
            setSearchParams(next, { replace: true })
        }
        acceptInvite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, searchParams.get('invite')])

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

    const handleExpenseSubmit = useCallback(async () => {
        try {
            if (editingExpense) {
                const item = expenseItems[0]
                if (!item?.description || !item?.amount) return
                await dispatch(updateBudgetExpense({ ...expenseForm, ...ownerParam, description: item.description, amount: parseFloat(item.amount), id: editingExpense, month, year })).unwrap()
            } else {
                const validItems = expenseItems.filter(i => i.description && i.amount)
                if (validItems.length === 0) return
                await dispatch(createBudgetExpense({ ...expenseForm, ...ownerParam, items: validItems, month, year })).unwrap()
            }
            setExpenseForm(emptyExpense)
            setExpenseItems([{ ...emptyItem }])
            setEditingExpense(null)
            setShowExpenseForm(false)
            setAttachmentPreview(null)
            dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        } catch (err) {
            setNotification({ message: err?.message || 'Failed to save transaction. Please try again.', variant: 'danger' })
            setShowNotif(true)
        }
    }, [editingExpense, expenseForm, expenseItems, emptyExpense, emptyItem, month, year, dispatch, ownerParam])

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
            const put = await loadVercelBlob()
            const blob = await put(`receipts/${Date.now()}_${file.name}`, file, {
                access: 'public', token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN
            })
            setAttachmentPreview(blob.url)
            setExpenseForm(prev => ({ ...prev, attachments: [blob.url] }))
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
        setDeleteModal({ type: 'expense', id, title: 'Delete Expense', message: 'Are you sure you want to delete this expense? This cannot be undone.' })
    }, [])

    const confirmDeleteExpense = useCallback(async (id) => {
        await dispatch(deleteBudgetExpense({ id, month, year, ...ownerParam }))
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        setDeleteModal(null)
    }, [month, year, dispatch, ownerParam])

    const handleBulkDelete = () => {
        setDeleteModal({ type: 'bulk', title: 'Delete Expenses', message: `Are you sure you want to delete ${selectedExpenses.length} selected expense${selectedExpenses.length > 1 ? 's' : ''}? This cannot be undone.` })
    }

    const confirmBulkDelete = async () => {
        await dispatch(bulkDeleteBudgetExpenses({ ids: selectedExpenses, month, year, ...ownerParam }))
        setSelectedExpenses([])
        dispatch(getBudgetDashboard({ month, year, ...ownerParam }))
        setDeleteModal(null)
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

    const allTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: faChartPie },
        { id: 'daily', label: 'Daily Expenses', icon: faCalendarDay },
        { id: 'monthly', label: 'Monthly Budget', icon: faCalendarAlt },
        { id: 'categories', label: 'Categories', icon: faTags },
        { id: 'savings', label: 'Savings', icon: faPiggyBank },
        { id: 'debts', label: 'Debts', icon: faHandHoldingUsd },
        { id: 'lists', label: 'Lists', icon: faListAlt },
        { id: 'goals', label: 'Goals', icon: faCheckCircle },
        { id: 'summary', label: 'Summary', icon: faFilePdf },
        { id: 'settings', label: 'Settings', icon: faCogs },
    ]
    const hiddenTabs = budgetSettings?.hiddenTabs || []
    const tabs = (isViewer ? allTabs.filter(t => t.id !== 'settings') : allTabs).filter(t => !hiddenTabs.includes(t.id) || t.id === 'dashboard' || t.id === 'settings')

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
        const expenseCats = categories.filter(c => c.type === 'expense')
        const totalStaticBudget = expenseCats.reduce((s, c) => s + (c.budget || 0), 0)
        return expenseCats.map(cat => {
            const spent = expenses
                .filter(e => e.category?._id === cat._id && e.type === 'expense' && !e.listOnly)
                .reduce((s, e) => {
                    const converted = toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency)
                    return s + (converted ?? e.amount)
                }, 0)
            const baseBudget = toTargetCurrency(cat.budget || 0, 'PHP', activeViewCurrency) ?? (cat.budget || 0)
            const allocated = totalStaticBudget > 0 && allocatedPool > 0
                ? ((cat.budget || 0) / totalStaticBudget) * allocatedPool
                : baseBudget
            const budget = allocated
            const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0
            return { ...cat, spent, budget, baseBudget, remaining: budget - spent, percentage: pct }
        })
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
                alerts.push({ id: `warn-${cat._id}-${month}`, severity: 'warning', icon: faExclamationTriangle, message: `${cat.name} is at ${Math.round(cat.percentage)}% — ${formatCurrencyRaw(cat.budget - cat.spent, activeViewCurrency)} left` })
            } else if (cat.percentage > 100) {
                alerts.push({ id: `over-${cat._id}-${month}`, severity: 'danger', icon: faExclamationTriangle, message: `${cat.name} exceeded budget by ${formatCurrencyRaw(cat.spent - cat.budget, activeViewCurrency)}` })
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
    }, [dashboard, monthlyBudgetData, expenses, debts, month, year, formatCurrencyRaw, activeViewCurrency])

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
        formatCurrency, formatCurrencyRaw, activeViewCurrency, toTargetCurrency,
        dispatch, month, year, categories, expenses, isLoading,
        PAYMENT_METHODS, paymentIcon, statusColor,
        setReceiptViewer, setNotification, setShowNotif,
    }), [isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, templateStyles, formatCurrency, formatCurrencyRaw, activeViewCurrency, toTargetCurrency, dispatch, month, year, categories, expenses, isLoading, PAYMENT_METHODS, paymentIcon, statusColor])

    return (
        <BudgetContext.Provider value={budgetContextValue}>
        <div className={`relative overflow-hidden min-h-full w-full ${main.font} ${isLight ? light.body : dark.body}`}>
            <a href="#budget-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[10000] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">Skip to content</a>
            <style>{`
                @keyframes barGrow { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); transform-origin: left; } }
                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes countPulse { 0% { transform: scale(0.95); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
            `}</style>
            <div className={`${styles.paddingX} ${styles.flexCenter}`}>
                <div className={templateStyles.contentWidthCls}>
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

                            {/* Tabs */}
                            <div className={`flex flex-nowrap items-center ${templateStyles.tabGap} mt-4 overflow-x-auto overflow-y-hidden -mx-1 px-1 ${templateStyles.tabBarCls}`} role="tablist" aria-label="Budget sections"
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
                                                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(p.amount, p.currency)}</span>
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
                        {activeTab === 'dashboard' && <DashboardTab dashboard={dashboard} expenses={expenses} categories={categories} monthlyBudgetData={monthlyBudgetData} isLight={isLight} card={card} formatCurrency={formatCurrency} formatCurrencyRaw={formatCurrencyRaw} statusColor={statusColor} isLoading={isLoading} activeViewCurrency={activeViewCurrency} toTargetCurrency={toTargetCurrency} month={month} year={year} savingsAccounts={savingsAccounts} debts={debts} goals={goals} paymentIcon={paymentIcon} setReceiptViewer={setReceiptViewer} ytdData={ytdData} ytdLoading={ytdLoading} isViewer={isViewer} templateStyles={templateStyles} allocatedPool={allocatedPool} autoSavings={autoSavings} showBalances={showGlobalBalances} maskedBalance={maskedBalance} />}
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
                                formatCurrency={formatCurrency} paymentIcon={paymentIcon}
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
                                toTargetCurrency={toTargetCurrency} formatCurrencyRaw={formatCurrencyRaw}
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
                                isLight={isLight} card={card} formatCurrency={formatCurrency} statusColor={statusColor}
                                month={month} year={year} isLoading={isLoading}
                                expenses={expenses} formatCurrencyRaw={formatCurrencyRaw}
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
                                btnPrimary={btnPrimary} btnSecondary={btnSecondary} formatCurrency={formatCurrency}
                                emptyCategory={emptyCategory} isLoading={isLoading || isCategoriesLoading}
                                dispatch={dispatch} currentUserId={user?._id}
                                isViewer={isViewer} ownerParam={ownerParam}
                            />
                        )}
                        {activeTab === 'savings' && (
                            <SavingsTab isLight={isLight} card={card} inputCls={inputCls} formatCurrency={formatCurrency} dispatch={dispatch} savingsAccounts={savingsAccounts} savingsHistory={savingsHistory} isLoading={isSavingsLoading} isViewer={isViewer} globalShowBalances={showGlobalBalances} templateStyles={templateStyles} />
                        )}
                        {activeTab === 'debts' && (
                            <DebtTab
                                debts={debts} categories={categories} dispatch={dispatch} isLight={isLight} card={card}
                                inputCls={inputCls} selectCls={selectCls} btnPrimary={btnPrimary}
                                btnSecondary={btnSecondary} formatCurrency={formatCurrency} isLoading={isDebtsLoading}
                                PAYMENT_METHODS={PAYMENT_METHODS}
                                isViewer={isViewer} ownerParam={ownerParam}
                                showBalances={showGlobalBalances} maskedBalance={maskedBalance}
                            />
                        )}
                        {activeTab === 'lists' && (
                            <ListsTab
                                budgetLists={budgetLists} dispatch={dispatch} isLight={isLight} card={card}
                                inputCls={inputCls} btnPrimary={btnPrimary} btnSecondary={btnSecondary}
                                isLoading={isListsLoading}
                                isViewer={isViewer} ownerParam={ownerParam}
                            />
                        )}
                        {activeTab === 'goals' && (
                            <GoalsTab
                                goals={goals} categories={categories} savingsAccounts={savingsAccounts} dispatch={dispatch} isLight={isLight} card={card}
                                inputCls={inputCls} selectCls={selectCls} btnPrimary={btnPrimary}
                                btnSecondary={btnSecondary} formatCurrency={formatCurrency} isLoading={isGoalsLoading}
                                isViewer={isViewer} ownerParam={ownerParam}
                                showBalances={showGlobalBalances} maskedBalance={maskedBalance}
                            />
                        )}
                        {activeTab === 'summary' && (
                            <SummaryTab
                                dashboard={dashboard} expenses={expenses} categories={categories}
                                monthlyBudgetData={monthlyBudgetData} groupedByDate={groupedByDate}
                                month={month} year={year} isLight={isLight} card={card}
                                formatCurrency={formatCurrency} formatCurrencyRaw={formatCurrencyRaw}
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
                                activeViewCurrency={activeViewCurrency} formatCurrencyRaw={formatCurrencyRaw}
                                budgetSettings={budgetSettings} PAYMENT_METHODS={PAYMENT_METHODS}
                                month={month} year={year} templateStyles={templateStyles}
                                dashboard={dashboard} monthlyBudgetData={monthlyBudgetData}
                                allTabs={allTabs}
                                allocatedPool={allocatedPool} autoSavings={autoSavings} totalIncomeGlobal={totalIncomeGlobal}
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
                    onCancel={() => setDeleteModal(null)}
                    onConfirm={() => {
                        if (deleteModal.type === 'expense') confirmDeleteExpense(deleteModal.id)
                        else if (deleteModal.type === 'category') confirmDeleteCategory(deleteModal.id)
                        else if (deleteModal.type === 'bulk') confirmBulkDelete()
                        else setDeleteModal(null)
                    }}
                />
            )}
        </div>
        </BudgetContext.Provider>
    )
}

// ==================== DASHBOARD TAB ====================

const DashboardTab = React.memo(({ dashboard, expenses, categories, monthlyBudgetData, isLight, card, formatCurrency, formatCurrencyRaw, statusColor, isLoading, activeViewCurrency, toTargetCurrency, month, year, savingsAccounts, debts, goals, paymentIcon, setReceiptViewer, ytdData, ytdLoading, isViewer, templateStyles, allocatedPool, autoSavings, showBalances = true, maskedBalance = '₱ ----' }) => {
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    if (isLoading || !dashboard) {
        return (
            <div className="space-y-4">
                <div className={`${templateStyles?.statGridCls || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} ${templateStyles?.gridGap || 'gap-4'}`}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`h-3 w-20 ${pulse}`} />
                                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                            </div>
                            <div className={`h-6 w-28 ${pulse}`} />
                        </div>
                    ))}
                </div>
                <div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className={`h-4 w-40 mb-4 ${pulse}`} />
                            <div className="space-y-3">
                                {[...Array(4)].map((_, j) => (
                                    <div key={j}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className={`h-3 w-24 ${pulse}`} />
                                            <div className={`h-3 w-16 ${pulse}`} />
                                        </div>
                                        <div className={`h-1.5 rounded-full ${pulse}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-32 mb-4 ${pulse}`} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className={`h-7 w-20 mx-auto ${pulse}`} />
                                <div className={`h-3 w-16 mx-auto mt-2 ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const d = dashboard
    const active = expenses.filter(e => !e.listOnly)
    const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt

    const totalIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const totalExpenses = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const balance = totalIncome - totalExpenses
    const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
    const remainingBudget = totalBudget - totalExpenses
    const balancePositive = balance >= 0
    const transactionCount = active.length
    const listOnlyCount = expenses.length - active.length
    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyAvg = transactionCount > 0 ? totalExpenses / daysInMonth : 0

    const currencyBreakdown = useMemo(() => {
        const map = {}
        active.forEach(e => {
            const cur = e.currency || 'PHP'
            if (!map[cur]) map[cur] = { income: 0, expense: 0 }
            if (e.type === 'income') map[cur].income += e.amount
            else map[cur].expense += e.amount
        })
        return Object.entries(map).filter(([code]) => code !== activeViewCurrency)
    }, [active, activeViewCurrency])

    const topCategories = useMemo(() => {
        const catMap = {}
        active.filter(e => e.type === 'expense').forEach(e => {
            const catId = e.category?._id || 'uncategorized'
            const cat = categories.find(c => c._id === catId)
            if (!catMap[catId]) catMap[catId] = { id: catId, name: cat?.name || 'Uncategorized', color: cat?.color || '#94a3b8', icon: cat?.icon || '', amount: 0 }
            catMap[catId].amount += convert(e.amount, e.currency)
        })
        return Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 6)
    }, [active, categories, activeViewCurrency])

    const paymentMethods = useMemo(() => {
        const map = {}
        active.filter(e => e.type === 'expense').forEach(e => {
            const m = e.paymentMethod || 'Cash'
            if (!map[m]) map[m] = 0
            map[m] += convert(e.amount, e.currency)
        })
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [active, activeViewCurrency])

    const incomeSources = useMemo(() => {
        const catMap = {}
        active.filter(e => e.type === 'income').forEach(e => {
            const catId = e.category?._id || 'uncategorized'
            const cat = categories.find(c => c._id === catId)
            if (!catMap[catId]) catMap[catId] = { id: catId, name: cat?.name || 'Uncategorized', color: cat?.color || '#94a3b8', icon: cat?.icon || '', amount: 0 }
            catMap[catId].amount += convert(e.amount, e.currency)
        })
        return Object.values(catMap).sort((a, b) => b.amount - a.amount)
    }, [active, categories, activeViewCurrency])

    const [drilldown, setDrilldown] = useState(null)
    const [debtDrilldown, setDebtDrilldown] = useState(null)
    const [savingsDrilldown, setSavingsDrilldown] = useState(null)
    const [goalsDrilldown, setGoalsDrilldown] = useState(null)

    const drilldownItems = useMemo(() => {
        if (!drilldown) return []
        const src = drilldown.type === 'currency' ? expenses.filter(e => !e.listOnly) : active
        const items = src.filter(e => {
            if (drilldown.type === 'category') return e.type === 'expense' && (e.category?._id || 'uncategorized') === drilldown.id
            if (drilldown.type === 'payment') return e.type === 'expense' && (e.paymentMethod || 'Cash') === drilldown.id
            if (drilldown.type === 'income') return e.type === 'income' && (e.category?._id || 'uncategorized') === drilldown.id
            if (drilldown.type === 'budget') return e.type === 'expense' && (e.category?._id || 'uncategorized') === drilldown.id
            if (drilldown.type === 'currency') return (e.currency || 'PHP') === drilldown.id
            return false
        })
        return items.sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [drilldown, active, expenses])

    const budgetCategories = useMemo(() => monthlyBudgetData.filter(c => c.budget > 0), [monthlyBudgetData])

    const recentTransactions = useMemo(() =>
        [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    , [expenses])

    const topExpenses = useMemo(() =>
        active.filter(e => e.type === 'expense')
            .map(e => ({ ...e, converted: convert(e.amount, e.currency) }))
            .sort((a, b) => b.converted - a.converted)
            .slice(0, 5)
    , [active, activeViewCurrency])

    const savingsTotal = useMemo(() => calcAllSavingsTotal(savingsAccounts), [savingsAccounts])

    const activeDebts = debts?.filter(d => d.amount_paid < d.total_amount) || []

    const budgetAlerts = useMemo(() => {
        const alerts = []
        monthlyBudgetData.filter(c => c.budget > 0).forEach(cat => {
            const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0
            if (pct > 100) alerts.push({ type: 'exceeded', severity: 'danger', icon: faExclamationTriangle, name: cat.name, color: cat.color, pct: Math.round(pct), spent: cat.spent, budget: cat.budget, msg: `Over budget by ${formatCurrency(cat.spent - cat.budget)}` })
            else if (pct >= 80 && pct < 100) alerts.push({ type: 'warning', severity: 'warning', icon: faExclamationTriangle, name: cat.name, color: cat.color, pct: Math.round(pct), spent: cat.spent, budget: cat.budget, msg: `${formatCurrency(cat.budget - cat.spent)} remaining` })
        })
        if (activeDebts.some(d => d.due_date && new Date(d.due_date) < new Date())) {
            const overdueCount = activeDebts.filter(d => d.due_date && new Date(d.due_date) < new Date()).length
            alerts.push({ type: 'overdue', severity: 'danger', icon: faHandHoldingUsd, msg: `${overdueCount} overdue debt${overdueCount > 1 ? 's' : ''} need attention` })
        }
        if (goals?.some(g => g.deadline && new Date(g.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && g.currentAmount < g.targetAmount)) {
            const approachingGoals = goals.filter(g => g.deadline && new Date(g.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && g.currentAmount < g.targetAmount)
            alerts.push({ type: 'goal', severity: 'warning', icon: faCalendarCheck, msg: `${approachingGoals.length} goal${approachingGoals.length > 1 ? 's' : ''} deadline${approachingGoals.length > 1 ? 's' : ''} approaching` })
        }
        return alerts
    }, [monthlyBudgetData, activeDebts, goals])
    const totalOwed = activeDebts.filter(d => d.type === 'owe').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0)
    const totalOwedToYou = activeDebts.filter(d => d.type === 'owed').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0)
    const activeGoals = goals?.filter(g => g.currentAmount < g.targetAmount) || []
    const goalsTotalSaved = activeGoals.reduce((s, g) => s + (g.currentAmount || 0), 0)
    const goalsTotalTarget = activeGoals.reduce((s, g) => s + (g.targetAmount || 0), 0)
    const goalsOverallPct = goalsTotalTarget > 0 ? Math.round((goalsTotalSaved / goalsTotalTarget) * 100) : 0

    const netWorthData = useMemo(() => calcNetWorth({ savingsAccounts, debts }), [savingsAccounts, debts])

    const autoSavingsPct = totalIncome > 0 ? Math.round((autoSavings / totalIncome) * 100) : 0
    const summaryCards = [
        { label: 'Total Income', value: formatCurrencyRaw(totalIncome, activeViewCurrency), icon: faArrowUp, color: 'emerald' },
        { label: 'Total Expenses', value: formatCurrencyRaw(totalExpenses, activeViewCurrency), icon: faArrowDown, color: 'red' },
        { label: 'Balance', value: formatCurrencyRaw(balance, activeViewCurrency), icon: faWallet, color: balancePositive ? 'blue' : 'red' },
        { label: 'Remaining Budget', value: formatCurrencyRaw(remainingBudget, activeViewCurrency), icon: faChartPie, color: remainingBudget >= 0 ? 'emerald' : 'red' },
    ]

    const colorMap = {
        emerald: { icon: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20' },
        red: { icon: isLight ? 'text-red-600' : 'text-red-400', bg: isLight ? 'bg-red-50' : 'bg-red-900/20' },
        blue: { icon: templateStyles?.accentText || (isLight ? 'text-blue-600' : 'text-blue-400'), bg: templateStyles?.accentBg || (isLight ? 'bg-blue-50' : 'bg-blue-900/20') },
    }

    const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0

    const healthScore = useMemo(() => {
        let score = 100
        let factors = []

        if (totalBudget > 0) {
            if (budgetUsedPct > 100) { score -= 30; factors.push({ label: 'Over budget', impact: -30, color: 'red' }) }
            else if (budgetUsedPct > 90) { score -= 15; factors.push({ label: 'Near budget limit', impact: -15, color: 'amber' }) }
            else if (budgetUsedPct < 50 && transactionCount > 0) { factors.push({ label: 'Budget well managed', impact: 0, color: 'emerald' }) }
        }

        if (totalIncome > 0) {
            const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100
            if (savingsRate >= 20) { factors.push({ label: `${Math.round(savingsRate)}% savings rate`, impact: 0, color: 'emerald' }) }
            else if (savingsRate >= 0) { score -= 10; factors.push({ label: `Low savings rate (${Math.round(savingsRate)}%)`, impact: -10, color: 'amber' }) }
            else { score -= 25; factors.push({ label: 'Spending exceeds income', impact: -25, color: 'red' }) }
        }

        const overBudgetCats = monthlyBudgetData.filter(c => c.budget > 0 && c.percentage > 100).length
        if (overBudgetCats > 2) { score -= 15; factors.push({ label: `${overBudgetCats} categories over budget`, impact: -15, color: 'red' }) }
        else if (overBudgetCats > 0) { score -= 5; factors.push({ label: `${overBudgetCats} category over budget`, impact: -5, color: 'amber' }) }

        const overdueDebts = activeDebts.filter(d => d.due_date && new Date(d.due_date) < new Date()).length
        if (overdueDebts > 0) { score -= 10; factors.push({ label: `${overdueDebts} overdue debt${overdueDebts > 1 ? 's' : ''}`, impact: -10, color: 'red' }) }

        if (transactionCount === 0 && new Date().getMonth() + 1 === month) {
            score -= 5; factors.push({ label: 'No transactions logged', impact: -5, color: 'amber' })
        }

        return { score: Math.max(0, Math.min(100, score)), factors }
    }, [totalBudget, budgetUsedPct, totalIncome, totalExpenses, monthlyBudgetData, activeDebts, transactionCount, month])

    const spendingInsights = useMemo(() => {
        const insights = []
        if (!ytdData || !ytdData.monthlyBreakdown) return insights

        const prevMonthIdx = month - 2
        const currMonthIdx = month - 1
        const prevData = ytdData.monthlyBreakdown[prevMonthIdx]
        const currExpense = totalExpenses

        if (prevData && prevData.expense > 0) {
            const change = ((currExpense - prevData.expense) / prevData.expense) * 100
            if (Math.abs(change) >= 10) {
                insights.push({
                    type: change > 0 ? 'increase' : 'decrease',
                    label: `${Math.abs(Math.round(change))}% ${change > 0 ? 'more' : 'less'} spending vs last month`,
                    detail: `${formatCurrencyRaw(prevData.expense, activeViewCurrency)} → ${formatCurrencyRaw(currExpense, activeViewCurrency)}`,
                    color: change > 0 ? 'red' : 'emerald',
                })
            }
        }

        if (ytdData.monthlyAvg > 0 && currExpense > ytdData.monthlyAvg * 1.3) {
            insights.push({
                type: 'above_average',
                label: 'Spending above yearly average',
                detail: `Monthly avg: ${formatCurrencyRaw(ytdData.monthlyAvg, activeViewCurrency)}`,
                color: 'amber',
            })
        }

        if (topExpenses.length > 0 && totalExpenses > 0) {
            const topPct = (topExpenses[0].converted / totalExpenses) * 100
            if (topPct > 30) {
                insights.push({
                    type: 'concentration',
                    label: `Largest expense is ${Math.round(topPct)}% of total`,
                    detail: `"${topExpenses[0].description}" — ${formatCurrencyRaw(topExpenses[0].converted, activeViewCurrency)}`,
                    color: 'amber',
                })
            }
        }

        if (dailyAvg > 0 && totalBudget > 0) {
            const projectedMonthly = dailyAvg * daysInMonth
            if (projectedMonthly > totalBudget * 1.1) {
                insights.push({
                    type: 'projection',
                    label: 'On pace to exceed budget',
                    detail: `Projected: ${formatCurrencyRaw(projectedMonthly, activeViewCurrency)} vs Budget: ${formatCurrencyRaw(totalBudget, activeViewCurrency)}`,
                    color: 'red',
                })
            } else if (projectedMonthly < totalBudget * 0.7) {
                insights.push({
                    type: 'projection',
                    label: 'Well under budget pace',
                    detail: `Projected: ${formatCurrencyRaw(projectedMonthly, activeViewCurrency)}`,
                    color: 'emerald',
                })
            }
        }

        return insights
    }, [ytdData, month, totalExpenses, topExpenses, dailyAvg, daysInMonth, totalBudget, activeViewCurrency, formatCurrencyRaw])

    return (
        <div className={templateStyles?.sectionGap || 'space-y-4'}>
            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
                <AnimateIn>
                    <div className="flex flex-wrap gap-2">
                        {budgetAlerts.map((alert, i) => {
                            const isDanger = alert.severity === 'danger'
                            return (
                                <div key={i} className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-solid ${
                                    isDanger
                                        ? (isLight ? 'bg-red-50 border-red-200' : 'bg-[#111] border-[#1f1f1f]')
                                        : (isLight ? 'bg-amber-50 border-amber-200' : 'bg-[#111] border-[#1f1f1f]')
                                }`}>
                                    <div className={`ml-1.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                        isDanger
                                            ? (isLight ? 'bg-red-500' : 'bg-red-600')
                                            : (isLight ? 'bg-amber-500' : 'bg-amber-600')
                                    }`}>
                                        <FontAwesomeIcon icon={alert.icon} className="text-[10px] text-white" />
                                    </div>
                                    <span className={`text-[11px] font-semibold ${
                                        isDanger
                                            ? (isLight ? 'text-red-700' : 'text-red-300')
                                            : (isLight ? 'text-amber-700' : 'text-amber-300')
                                    }`}>
                                        {alert.name || (alert.type === 'overdue' ? 'Overdue Debts' : 'Goal Deadline')}
                                    </span>
                                    {alert.pct != null && (
                                        <span className={`text-[10px] font-extrabold ${isDanger ? 'text-red-500' : 'text-amber-500'}`}>{alert.pct}%</span>
                                    )}
                                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{alert.msg}</span>
                                </div>
                            )
                        })}
                    </div>
                </AnimateIn>
            )}

            {/* Budget Health Score + Spending Insights */}
            {(healthScore.factors.length > 0 || spendingInsights.length > 0) && (
                <AnimateIn delay={50}>
                    <div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                        {/* Health Score */}
                        <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`relative w-14 h-14 flex-shrink-0`}>
                                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                        <circle cx="28" cy="28" r="24" fill="none" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} strokeWidth="5" />
                                        <circle cx="28" cy="28" r="24" fill="none"
                                            stroke={healthScore.score >= 80 ? '#10b981' : healthScore.score >= 60 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="5" strokeLinecap="round"
                                            strokeDasharray={`${(healthScore.score / 100) * 150.8} 150.8`}
                                            style={{ transition: 'stroke-dasharray 1s ease-out' }}
                                        />
                                    </svg>
                                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
                                        healthScore.score >= 80 ? 'text-emerald-500' : healthScore.score >= 60 ? 'text-amber-500' : 'text-red-500'
                                    }`}>{healthScore.score}</span>
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Budget Health</h3>
                                    <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {healthScore.score >= 80 ? 'Excellent' : healthScore.score >= 60 ? 'Needs attention' : 'Critical'}
                                    </p>
                                </div>
                            </div>
                            {healthScore.factors.length > 0 && (
                                <div className="space-y-1.5">
                                    {healthScore.factors.slice(0, 4).map((f, i) => (
                                        <div key={i} className={`flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-md ${
                                            f.color === 'red' ? (isLight ? 'bg-red-50 text-red-600' : 'bg-red-900/10 text-red-400') :
                                            f.color === 'amber' ? (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/10 text-amber-400') :
                                            (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/10 text-emerald-400')
                                        }`}>
                                            <FontAwesomeIcon icon={f.color === 'emerald' ? faCheckCircle : faExclamationTriangle} className="text-[9px] flex-shrink-0" />
                                            <span className="font-medium">{f.label}</span>
                                            {f.impact < 0 && <span className="ml-auto opacity-60">{f.impact}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Spending Insights */}
                        <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                                    <FontAwesomeIcon icon={faChartPie} className={`text-sm ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                                </div>
                                <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Spending Insights</h3>
                            </div>
                            {spendingInsights.length > 0 ? (
                                <div className="space-y-2">
                                    {spendingInsights.map((insight, i) => (
                                        <div key={i} className={`px-3 py-2.5 rounded-lg border border-solid ${
                                            insight.color === 'red' ? (isLight ? 'bg-red-50/50 border-red-100' : 'bg-red-900/5 border-red-900/20') :
                                            insight.color === 'amber' ? (isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-900/5 border-amber-900/20') :
                                            (isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-900/5 border-emerald-900/20')
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={
                                                    insight.type === 'increase' ? faArrowUp :
                                                    insight.type === 'decrease' ? faArrowDown :
                                                    insight.type === 'projection' ? faCalendarAlt :
                                                    faExclamationTriangle
                                                } className={`text-[10px] flex-shrink-0 ${
                                                    insight.color === 'red' ? 'text-red-500' :
                                                    insight.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'
                                                }`} />
                                                <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{insight.label}</span>
                                            </div>
                                            <p className={`text-[10px] mt-1 ml-5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{insight.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`flex flex-col items-center justify-center py-6 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-lg mb-2 text-emerald-500" />
                                    <p className="text-xs">Everything looks good this month!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </AnimateIn>
            )}

            {/* Summary Cards */}
            <div className={`${templateStyles?.statGridCls || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {summaryCards.map((s, i) => {
                    const cm = colorMap[s.color]
                    return (
                        <AnimateIn key={i} delay={i * 80}>
                            <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`${templateStyles?.bodyTextCls || 'text-xs'} font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cm.bg}`}>
                                        <FontAwesomeIcon icon={s.icon} className={`text-sm ${cm.icon}`} />
                                    </div>
                                </div>
                                <p className={`${templateStyles?.valueTextCls || 'text-lg sm:text-xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{s.value}</BalanceAmount>
                                </p>
                            </div>
                        </AnimateIn>
                    )
                })}
            </div>

            {/* Net Worth */}
            <AnimateIn delay={320}>
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Net Worth</span>
                        <FontAwesomeIcon icon={faChartPie} className={`text-sm ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                    </div>
                    <p className={`text-2xl font-bold ${netWorthData.netWorth >= 0 ? (isLight ? 'text-slate-800' : 'text-white') : 'text-red-500'}`}>
                        <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.netWorth)}</BalanceAmount>
                    </p>
                    <p className={`text-[10px] mt-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                        Savings <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.savingsTotal)}</BalanceAmount>
                        {' · '}Owed to you <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.totalOwedToYou)}</BalanceAmount>
                        {' · '}You owe <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(netWorthData.totalOwed)}</BalanceAmount>
                    </p>
                </div>
            </AnimateIn>

            {/* Auto Savings Banner */}
            {autoSavings > 0 && (
                <AnimateIn delay={350}>
                    <div className={`${card} ${templateStyles?.cardPadding || 'px-5 py-4'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                                <FontAwesomeIcon icon={faPiggyBank} className={`text-sm ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                            </div>
                            <div>
                                <p className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Auto Savings</p>
                                <p className={`text-lg font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrencyRaw(autoSavings, activeViewCurrency)}</p>
                            </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>{autoSavingsPct}% of income</span>
                    </div>
                </AnimateIn>
            )}

            {/* Currency Breakdown */}
            {currencyBreakdown.length > 0 && (
                <AnimateIn delay={350}><div className={`${card} px-4 py-3`}>
                    <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faExchangeAlt} className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                        <span className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Raw Currency Totals</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {currencyBreakdown.map(([code, v]) => (
                            <div key={code} className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md cursor-pointer transition-colors ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`} onClick={() => setDrilldown({ type: 'currency', id: code, title: code, total: v.expense, income: v.income })}>
                                <span className={`font-bold ${isLight ? 'text-slate-500' : 'text-gray-300'}`}>{code}</span>
                                {v.income > 0 && <span className="text-emerald-500">+{formatCurrencyRaw(v.income, code)}</span>}
                                {v.expense > 0 && <span className="text-red-500">-{formatCurrencyRaw(v.expense, code)}</span>}
                            </div>
                        ))}
                    </div>
                </div></AnimateIn>
            )}

            {/* Charts */}
            {(topCategories.length > 0 || active.length > 0) && (
                <AnimateIn delay={380}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                    {/* Spending by Category Pie */}
                    <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                        <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Spending by Category</h3>
                        {topCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={topCategories} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                                        {topCategories.map((c, i) => <Cell key={i} fill={c.color} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => formatCurrencyRaw(val, activeViewCurrency)}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className={`text-xs text-center py-8 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No spending data</p>
                        )}
                    </div>

                    {/* Daily Spending Bar Chart */}
                    <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                        <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Daily Spending</h3>
                        {(() => {
                            const dailyData = {}
                            active.filter(e => e.type === 'expense').forEach(e => {
                                const day = new Date(e.date).getDate()
                                dailyData[day] = (dailyData[day] || 0) + convert(e.amount, e.currency)
                            })
                            const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
                                day: i + 1,
                                amount: dailyData[i + 1] || 0,
                            }))
                            const hasData = chartData.some(d => d.amount > 0)
                            return hasData ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} />
                                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} interval={Math.ceil(daysInMonth / 10) - 1} />
                                        <YAxis tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={40} />
                                        <Tooltip
                                            contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                                            labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                            itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                            formatter={(val) => [formatCurrencyRaw(val, activeViewCurrency), 'Spent']}
                                            labelFormatter={(label) => `Day ${label}`}
                                        />
                                        <Bar dataKey="amount" fill={isLight ? '#6366f1' : '#818cf8'} radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className={`text-xs text-center py-8 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No spending data</p>
                            )
                        })()}
                    </div>
                </div></AnimateIn>
            )}

            <AnimateIn delay={400}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {/* Top Categories */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Top Spending Categories</h3>
                    {topCategories.length > 0 ? (
                        <div className="space-y-3">
                            {topCategories.map((cat, i) => {
                                const pct = totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0
                                return (
                                    <div key={i} className={`cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDrilldown({ type: 'category', id: cat.id, title: cat.name, color: cat.color, icon: cat.icon, total: cat.amount })}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                    {cat.icon ? <SafeIcon name={cat.icon} cls="text-[10px]" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                </div>
                                                <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                            </div>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: cat.color, animation: `barGrow 0.8s ease-out ${0.4 + i * 0.1}s both` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No spending data this month.</p>
                    )}
                </div>

                {/* Payment Methods */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Payment Methods</h3>
                    {paymentMethods.length > 0 ? (
                        <div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={paymentMethods.map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2} strokeWidth={0}>
                                        {paymentMethods.map((_, i) => <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'][i % 8]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => formatCurrencyRaw(val, activeViewCurrency)}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-3">
                            {paymentMethods.map(([method, amount]) => (
                                <div key={method} className={`flex items-center justify-between cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDrilldown({ type: 'payment', id: method, title: method, total: amount })}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                            <FontAwesomeIcon icon={
                                                method === 'GCash' ? faMobileAlt : 
                                                method === 'Bank' ? faUniversity : 
                                                ['Credit Card', 'Debit Card'].includes(method) ? faCreditCard : 
                                                faMoneyBillWave
                                            } className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                                        </div>
                                        <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{method}</span>
                                    </div>
                                    <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(amount, activeViewCurrency)}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No payments recorded this month.</p>
                    )}
                </div>
            </div></AnimateIn>

            {/* Income Sources + Budget Status */}
            <AnimateIn delay={500}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {/* Income Sources */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Income Sources</h3>
                    {incomeSources.length > 0 ? (
                        <div className="space-y-3">
                            {incomeSources.map((cat, i) => {
                                const pct = totalIncome > 0 ? Math.round((cat.amount / totalIncome) * 100) : 0
                                return (
                                    <div key={i} className={`cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDrilldown({ type: 'income', id: cat.id, title: cat.name, color: cat.color, icon: cat.icon, total: cat.amount })}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                    {cat.icon ? <SafeIcon name={cat.icon} cls="text-[10px]" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                </div>
                                                <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                            </div>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color, animation: `barGrow 0.8s ease-out ${0.5 + i * 0.1}s both` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income recorded this month.</p>
                    )}
                </div>

                {/* Budget Status per Category */}
                <div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Budget vs Spending</h3>
                    {budgetCategories.length > 0 ? (
                        <div>
                            <ResponsiveContainer width="100%" height={Math.max(budgetCategories.length * 36, 120)}>
                                <BarChart data={budgetCategories.map(c => ({ name: c.name, spent: c.spent, budget: c.budget }))} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} width={70} />
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => formatCurrencyRaw(val, activeViewCurrency)}
                                    />
                                    <Bar dataKey="budget" fill={isLight ? '#e2e8f0' : '#2a2a2a'} radius={[0, 3, 3, 0]} name="Budget" />
                                    <Bar dataKey="spent" fill={isLight ? '#6366f1' : '#818cf8'} radius={[0, 3, 3, 0]} name="Spent" />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No budgets set up.</p>
                    )}
                </div>
            </div></AnimateIn>

            {/* Recent Transactions + Top Expenses */}
            <AnimateIn delay={700}><div className={`${templateStyles?.chartGridCls || 'grid grid-cols-1 lg:grid-cols-2'} ${templateStyles?.gridGap || 'gap-4'}`}>
                {/* Recent Transactions */}
                <div className={`${card} overflow-hidden`}>
                    <div className={`px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Recent Transactions</h3>
                    </div>
                    {recentTransactions.length > 0 ? (
                        <div className={`divide-y divide-solid ${isLight ? 'divide-[#f1f5f9]' : 'divide-[#1a1a1a]'}`}>
                            {recentTransactions.map(e => {
                                const converted = (e.currency || 'PHP') !== activeViewCurrency ? toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency) : null
                                return (
                                    <div key={e._id} className={`flex items-center gap-3 px-4 py-2.5 ${e.listOnly ? 'opacity-40' : ''}`}>
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                            {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-[10px]" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium truncate ${e.listOnly ? 'line-through' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                {e.description}
                                                {e.listOnly && <span className={`ml-1 text-[8px] font-bold px-1 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#1a1a1a] text-gray-500'}`}>LIST</span>}
                                            </p>
                                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {e.category?.name || 'Uncategorized'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-xs font-semibold ${e.listOnly ? 'line-through' : ''} ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {e.type === 'income' ? '+' : '-'}{converted !== null ? formatCurrencyRaw(converted, activeViewCurrency) : formatCurrencyRaw(e.amount, e.currency || 'PHP')}
                                            </p>
                                            {converted !== null && (
                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency)}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-5 text-center">
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No transactions yet.</p>
                        </div>
                    )}
                </div>

                {/* Top Expenses */}
                <div className={`${card} overflow-hidden`}>
                    <div className={`px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Largest Expenses</h3>
                    </div>
                    {topExpenses.length > 0 ? (
                        <div className={`divide-y divide-solid ${isLight ? 'divide-[#f1f5f9]' : 'divide-[#1a1a1a]'}`}>
                            {topExpenses.map((e, i) => {
                                const pct = totalExpenses > 0 ? Math.round((e.converted / totalExpenses) * 100) : 0
                                return (
                                    <div key={e._id} className="flex items-center gap-3 px-4 py-2.5">
                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#1a1a1a] text-gray-500'}`}>{i + 1}</span>
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                            {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-[10px]" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</p>
                                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {e.category?.name || 'Uncategorized'} · {pct}%
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-semibold text-red-500">{formatCurrencyRaw(e.converted, activeViewCurrency)}</p>
                                            {(e.currency || 'PHP') !== activeViewCurrency && (
                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency)}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-5 text-center">
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expenses recorded.</p>
                        </div>
                    )}
                </div>
            </div></AnimateIn>

            {/* Savings / Debts / Goals Summary */}
            <AnimateIn delay={800}><div className={`grid grid-cols-1 sm:grid-cols-3 ${templateStyles?.gridGap || 'gap-4'}`}>
                <div className={`${card} p-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setSavingsDrilldown(true)}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${templateStyles?.accentBg || (isLight ? 'bg-blue-50' : 'bg-blue-900/20')}`}>
                            <FontAwesomeIcon icon={faPiggyBank} className={`text-sm ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                        </div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Savings</span>
                    </div>
                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(savingsTotal)}</BalanceAmount>
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Current balance</p>
                </div>

                <div className={`${card} p-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setDebtDrilldown(true)}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-red-50' : 'bg-red-900/20'}`}>
                            <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`} />
                        </div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Debts</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <div>
                            <p className="text-lg font-bold text-red-500"><BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(totalOwed)}</BalanceAmount></p>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>You owe</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-500"><BalanceAmount visible={showBalances} maskedText={maskedBalance}>{formatCurrency(totalOwedToYou)}</BalanceAmount></p>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Owed to you</p>
                        </div>
                    </div>
                    <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{activeDebts.length} active</p>
                </div>

                <div className={`${card} p-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} onClick={() => setGoalsDrilldown(true)}>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                            <FontAwesomeIcon icon={faCheckCircle} className={`text-sm ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                        </div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Goals</span>
                    </div>
                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{activeGoals.length} active</p>
                    {activeGoals.length > 0 && (
                        <>
                            <div className={`h-1.5 rounded-full overflow-hidden mt-2 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(goalsOverallPct, 100)}%`, animation: 'barGrow 0.8s ease-out 0.8s both' }} />
                            </div>
                            <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{goalsOverallPct}% overall · {formatCurrency(goalsTotalSaved)} / {formatCurrency(goalsTotalTarget)}</p>
                        </>
                    )}
                </div>
            </div></AnimateIn>

            {/* Monthly Overview */}
            <AnimateIn delay={900}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Monthly Overview</h3>
                <div className={`grid grid-cols-2 sm:grid-cols-4 ${templateStyles?.gridGap || 'gap-3 sm:gap-4'}`}>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>{transactionCount}</p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-[11px] sm:text-xs'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                    </div>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatCurrencyRaw(totalBudget, activeViewCurrency)}</p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-[11px] sm:text-xs'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Budget</p>
                    </div>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${totalBudget > 0 ? (budgetUsedPct > 100 ? 'text-red-500' : budgetUsedPct > 80 ? 'text-amber-500' : 'text-emerald-500') : (isLight ? 'text-slate-800' : 'text-white')}`}>
                            {totalBudget > 0 ? `${budgetUsedPct}%` : '—'}
                        </p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-[11px] sm:text-xs'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget Used</p>
                    </div>
                    <div className="text-center">
                        <p className={`${templateStyles?.valueTextCls || 'text-xl sm:text-2xl font-bold'} ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {transactionCount > 0 ? formatCurrencyRaw(dailyAvg, activeViewCurrency) : '—'}
                        </p>
                        <p className={`${templateStyles?.bodyTextCls || 'text-[11px] sm:text-xs'} mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Daily Average</p>
                    </div>
                </div>

                {/* Additional details */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <div className="text-center">
                        <p className={`text-lg font-bold text-emerald-500`}>{formatCurrencyRaw(totalIncome, activeViewCurrency)}</p>
                        <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Income</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-lg font-bold text-red-500`}>{formatCurrencyRaw(totalExpenses, activeViewCurrency)}</p>
                        <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Spent</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(remainingBudget, activeViewCurrency)}</p>
                        <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget Left</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{listOnlyCount > 0 ? listOnlyCount : '—'}</p>
                        <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>List Only</p>
                    </div>
                </div>

                {d.rolloverAmount > 0 && (
                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex items-center gap-2`}>
                        <FontAwesomeIcon icon={faSyncAlt} className={`text-[10px] ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                        <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Budget rollover from last month: <span className="font-semibold">{formatCurrency(d.rolloverAmount)}</span></span>
                    </div>
                )}
            </div></AnimateIn>

            {/* Year-to-Date Overview */}
            <AnimateIn delay={1000}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                            <FontAwesomeIcon icon={faCalendarCheck} className={`text-sm ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                        </div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Year-to-Date ({year})</h3>
                    </div>
                </div>
                {ytdLoading || !ytdData ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className={`h-7 w-20 mx-auto animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`} />
                                <div className={`h-3 w-16 mx-auto mt-2 animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold text-emerald-500`}>{formatCurrencyRaw(ytdData.ytdIncome, activeViewCurrency)}</p>
                                <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>YTD Income</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold text-red-500`}>{formatCurrencyRaw(ytdData.ytdExpense, activeViewCurrency)}</p>
                                <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>YTD Expenses</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold ${ytdData.ytdBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(ytdData.ytdBalance, activeViewCurrency)}</p>
                                <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Net Balance</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{ytdData.ytdTxCount}</p>
                                <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                            </div>
                        </div>

                        {/* Monthly Avg + Monthly Bar Chart */}
                        <div className={`mt-4 pt-4 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Monthly Spending ({MONTHS[0].slice(0, 3)} – {MONTHS[month - 1].slice(0, 3)})</span>
                                <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Avg: {formatCurrencyRaw(ytdData.monthlyAvg, activeViewCurrency)}/mo</span>
                            </div>
                            <ResponsiveContainer width="100%" height={100}>
                                <BarChart data={Array.from({ length: month }, (_, i) => ({
                                    name: MONTHS[i].slice(0, 3),
                                    expense: ytdData.monthlyBreakdown[i]?.expense || 0,
                                }))} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                                        labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                        itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                        formatter={(val) => [formatCurrencyRaw(val, activeViewCurrency), 'Spent']}
                                    />
                                    <Bar dataKey="expense" radius={[3, 3, 0, 0]}>
                                        {Array.from({ length: month }, (_, i) => (
                                            <Cell key={i} fill={i === month - 1 ? (isLight ? '#6366f1' : '#818cf8') : (isLight ? '#e2e8f0' : '#2a2a2a')} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* YTD Top Categories */}
                        {ytdData.topCategories.length > 0 && (
                            <div className={`mt-4 pt-4 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Top YTD Categories</span>
                                <div className="space-y-2 mt-2">
                                    {ytdData.topCategories.map((cat, i) => {
                                        const pct = ytdData.ytdExpense > 0 ? Math.round((cat.amount / ytdData.ytdExpense) * 100) : 0
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                            {cat.icon ? <SafeIcon name={cat.icon} cls="text-[10px]" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                        </div>
                                                        <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className={`h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color, animation: `barGrow 0.8s ease-out ${0.5 + i * 0.1}s both` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div></AnimateIn>

            {/* Budget Forecasting / Projection */}
            <AnimateIn delay={1100}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-50' : 'bg-violet-900/20'}`}>
                        <FontAwesomeIcon icon={faCalendarAlt} className={`text-sm ${isLight ? 'text-violet-500' : 'text-violet-400'}`} />
                    </div>
                    <div>
                        <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>End-of-Month Forecast</h3>
                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Projected based on current spending pace</p>
                    </div>
                </div>
                {(() => {
                    const today = new Date()
                    const currentDay = (today.getMonth() + 1 === month && today.getFullYear() === year) ? today.getDate() : daysInMonth
                    const daysElapsed = Math.max(currentDay, 1)
                    const dailyRate = totalExpenses / daysElapsed
                    const projectedExpenses = dailyRate * daysInMonth
                    const projectedBalance = totalIncome - projectedExpenses
                    const projectedBudgetRemain = totalBudget - projectedExpenses
                    const daysLeft = daysInMonth - daysElapsed
                    const safeDaily = totalBudget > 0 ? Math.max((totalBudget - totalExpenses) / Math.max(daysLeft, 1), 0) : 0

                    return (
                        <div className="space-y-3">
                            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${projectedExpenses > totalBudget && totalBudget > 0 ? 'text-red-500' : (isLight ? 'text-slate-800' : 'text-white')}`}>{formatCurrencyRaw(projectedExpenses, activeViewCurrency)}</p>
                                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Projected Spend</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${projectedBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(projectedBalance, activeViewCurrency)}</p>
                                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Projected Balance</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{daysLeft}</p>
                                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Days Left</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-lg font-bold ${safeDaily > dailyRate ? 'text-emerald-500' : 'text-amber-500'}`}>{totalBudget > 0 ? formatCurrencyRaw(safeDaily, activeViewCurrency) : '—'}</p>
                                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Safe Daily Budget</p>
                                </div>
                            </div>
                            {totalBudget > 0 && (
                                <div className={`px-3 py-2.5 rounded-lg border border-solid ${
                                    projectedExpenses > totalBudget
                                        ? (isLight ? 'bg-red-50/50 border-red-100' : 'bg-red-900/5 border-red-900/20')
                                        : projectedExpenses > totalBudget * 0.9
                                            ? (isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-900/5 border-amber-900/20')
                                            : (isLight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-emerald-900/5 border-emerald-900/20')
                                }`}>
                                    <p className={`text-xs font-medium ${
                                        projectedExpenses > totalBudget ? 'text-red-600' : projectedExpenses > totalBudget * 0.9 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                        <FontAwesomeIcon icon={projectedExpenses > totalBudget ? faExclamationTriangle : faCheckCircle} className="mr-1.5 text-[10px]" />
                                        {projectedExpenses > totalBudget
                                            ? `At this rate, you'll exceed budget by ${formatCurrencyRaw(projectedExpenses - totalBudget, activeViewCurrency)}`
                                            : projectedExpenses > totalBudget * 0.9
                                                ? `Close to budget — spending ${formatCurrencyRaw(dailyRate, activeViewCurrency)}/day`
                                                : `On track! You'll save ~${formatCurrencyRaw(totalBudget - projectedExpenses, activeViewCurrency)} this month`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                })()}
            </div></AnimateIn>

            {/* Spending Streaks & Challenges */}
            <AnimateIn delay={1200}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                        <FontAwesomeIcon icon={faHistory} className={`text-sm ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                    </div>
                    <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Spending Streaks</h3>
                </div>
                {(() => {
                    const expenseDates = new Set(active.filter(e => e.type === 'expense').map(e => new Date(e.date).toDateString()))
                    const today = new Date()
                    let noSpendStreak = 0
                    let checkDate = new Date(today)
                    if (today.getMonth() + 1 === month && today.getFullYear() === year) {
                        for (let i = 0; i < 60; i++) {
                            checkDate.setDate(checkDate.getDate() - (i === 0 ? 0 : 1))
                            if (!expenseDates.has(checkDate.toDateString())) noSpendStreak++
                            else break
                        }
                    }

                    const underBudgetDays = (() => {
                        if (totalBudget <= 0) return 0
                        const dailyBudget = totalBudget / daysInMonth
                        let streak = 0
                        for (let day = daysInMonth; day >= 1; day--) {
                            const dayDate = new Date(year, month - 1, day)
                            const dayExpenses = active.filter(e => e.type === 'expense' && new Date(e.date).toDateString() === dayDate.toDateString())
                                .reduce((s, e) => s + convert(e.amount, e.currency), 0)
                            if (dayExpenses <= dailyBudget) streak++
                            else break
                        }
                        return streak
                    })()

                    const weeklyBudget = totalBudget > 0 ? totalBudget / 4 : 0
                    const currentWeek = Math.ceil((new Date().getDate()) / 7)
                    const weekStart = new Date(year, month - 1, (currentWeek - 1) * 7 + 1)
                    const weekExpenses = active.filter(e => e.type === 'expense' && new Date(e.date) >= weekStart)
                        .reduce((s, e) => s + convert(e.amount, e.currency), 0)
                    const weeklyChallenge = weeklyBudget > 0 ? Math.round((weekExpenses / weeklyBudget) * 100) : 0

                    const streaks = [
                        { label: 'No-Spend Streak', value: `${noSpendStreak} day${noSpendStreak !== 1 ? 's' : ''}`, icon: '🔥', active: noSpendStreak > 0 },
                        { label: 'Under Daily Budget', value: `${underBudgetDays} day${underBudgetDays !== 1 ? 's' : ''}`, icon: '✅', active: underBudgetDays > 0 },
                        { label: 'Weekly Challenge', value: weeklyBudget > 0 ? `${weeklyChallenge}% of weekly limit` : 'Set budget first', icon: '🎯', active: weeklyChallenge <= 100 && weeklyBudget > 0 },
                    ]

                    return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {streaks.map((s, i) => (
                                <div key={i} className={`px-3 py-3 rounded-lg border border-solid text-center ${
                                    s.active
                                        ? (isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-900/10 border-emerald-800/30')
                                        : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111] border-[#1f1f1f]')
                                }`}>
                                    <span className="text-xl">{s.icon}</span>
                                    <p className={`text-sm font-bold mt-1 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{s.value}</p>
                                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )
                })()}
            </div></AnimateIn>

            {/* Recurring Expense Calendar */}
            {expenses.filter(e => e.isRecurring).length > 0 && (
                <AnimateIn delay={1300}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-cyan-50' : 'bg-cyan-900/20'}`}>
                            <FontAwesomeIcon icon={faCalendarCheck} className={`text-sm ${isLight ? 'text-cyan-500' : 'text-cyan-400'}`} />
                        </div>
                        <div>
                            <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Upcoming Recurring</h3>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Bills & subscriptions this month</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {expenses.filter(e => e.isRecurring).slice(0, 6).map(e => {
                            const nextDate = new Date(e.date)
                            nextDate.setMonth(nextDate.getMonth() + 1)
                            const isPast = new Date(e.date) < new Date()
                            return (
                                <div key={e._id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isPast ? (isLight ? 'bg-emerald-100' : 'bg-emerald-900/20') : (isLight ? 'bg-amber-100' : 'bg-amber-900/20')}`}>
                                        <FontAwesomeIcon icon={isPast ? faCheckCircle : faSyncAlt} className={`text-[10px] ${isPast ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</p>
                                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {e.recurrenceRule} · {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-semibold ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, e.currency || 'PHP')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                Total recurring: {expenses.filter(e => e.isRecurring).length} items
                            </span>
                            <span className={`text-xs font-semibold text-red-500`}>
                                {formatCurrencyRaw(expenses.filter(e => e.isRecurring && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0), activeViewCurrency)}/mo
                            </span>
                        </div>
                    </div>
                </div></AnimateIn>
            )}

            {/* Category Comparison (Month over Month) */}
            {ytdData && ytdData.monthlyBreakdown && month > 1 && (
                <AnimateIn delay={1400}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-pink-50' : 'bg-pink-900/20'}`}>
                            <FontAwesomeIcon icon={faChartPie} className={`text-sm ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                        </div>
                        <div>
                            <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Category Trends</h3>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>This month vs last month</p>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {topCategories.slice(0, 5).map((cat, i) => {
                            const prevMonthExpenses = ytdData.categoryBreakdown?.[cat.id]?.[month - 2] || 0
                            const change = prevMonthExpenses > 0 ? ((cat.amount - prevMonthExpenses) / prevMonthExpenses) * 100 : (cat.amount > 0 ? 100 : 0)
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                        {cat.icon ? <SafeIcon name={cat.icon} cls="text-[10px]" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                    </div>
                                    <span className={`text-xs flex-1 min-w-0 truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                        {prevMonthExpenses > 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                change > 10 ? (isLight ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400') :
                                                change < -10 ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400') :
                                                (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400')
                                            }`}>
                                                <FontAwesomeIcon icon={change > 0 ? faArrowUp : change < 0 ? faArrowDown : faCheck} className="mr-0.5 text-[8px]" />
                                                {Math.abs(Math.round(change))}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div></AnimateIn>
            )}

            {/* Income Tracking Summary */}
            {totalIncome > 0 && (
                <AnimateIn delay={1500}><div className={`${card} ${templateStyles?.cardPadding || 'p-5'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                            <FontAwesomeIcon icon={faArrowUp} className={`text-sm ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                            <h3 className={`${templateStyles?.sectionTitleCls || 'text-sm font-semibold'} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Income Overview</h3>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Earnings & savings rate</p>
                        </div>
                    </div>
                    {(() => {
                        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
                        const incomeVsExpenseRatio = totalExpenses > 0 ? totalIncome / totalExpenses : 0
                        return (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-emerald-500">{formatCurrencyRaw(totalIncome, activeViewCurrency)}</p>
                                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Income</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${savingsRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{Math.round(savingsRate)}%</p>
                                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Savings Rate</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{incomeVsExpenseRatio.toFixed(1)}x</p>
                                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income/Expense</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(Math.abs(balance), activeViewCurrency)}</p>
                                        <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{balance >= 0 ? 'Net Saved' : 'Net Loss'}</p>
                                    </div>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                    <div className="h-full flex">
                                        <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0}%` }} />
                                        <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.max(100 - (totalExpenses / totalIncome) * 100, 0) : 0}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Expenses ({totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%)
                                    </span>
                                    <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Savings ({Math.round(Math.max(savingsRate, 0))}%)
                                    </span>
                                </div>
                            </div>
                        )
                    })()}
                </div></AnimateIn>
            )}

            {/* Drilldown Modal */}
            {drilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${isLight ? 'bg-white' : 'bg-[#141414]'} border border-solid ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex-shrink-0`}>
                            <div className="flex items-center gap-3">
                                {drilldown.color && (
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: drilldown.color + '20' }}>
                                        {drilldown.icon ? <SafeIcon name={drilldown.icon} cls="text-sm" style={{ color: drilldown.color }} /> : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: drilldown.color }} />}
                                    </div>
                                )}
                                {drilldown.type === 'payment' && (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <FontAwesomeIcon icon={
                                            drilldown.id === 'GCash' ? faMobileAlt :
                                            drilldown.id === 'Bank' ? faUniversity :
                                            ['Credit Card', 'Debit Card'].includes(drilldown.id) ? faCreditCard :
                                            faMoneyBillWave
                                        } className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                                    </div>
                                )}
                                {drilldown.type === 'currency' && (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                                        <FontAwesomeIcon icon={faExchangeAlt} className={`text-sm ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                                    </div>
                                )}
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldown.title}</h3>
                                    <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {drilldown.type === 'category' && 'Expense Breakdown'}
                                        {drilldown.type === 'payment' && 'Payment Method Breakdown'}
                                        {drilldown.type === 'income' && 'Income Breakdown'}
                                        {drilldown.type === 'budget' && 'Budget Breakdown'}
                                        {drilldown.type === 'currency' && 'Currency Breakdown'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        {/* Summary */}
                        <div className={`px-5 py-3 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'} flex-shrink-0`}>
                            {drilldown.type === 'currency' ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {drilldown.income > 0 && (
                                            <div>
                                                <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income</p>
                                                <p className="text-lg font-bold text-emerald-500">+{formatCurrencyRaw(drilldown.income, drilldown.id)}</p>
                                            </div>
                                        )}
                                        {drilldown.total > 0 && (
                                            <div>
                                                <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Expense</p>
                                                <p className="text-lg font-bold text-red-500">-{formatCurrencyRaw(drilldown.total, drilldown.id)}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                                        <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldownItems.length}</p>
                                    </div>
                                </div>
                            ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {drilldown.type === 'budget' ? 'Spent / Budget' : 'Total'}
                                    </p>
                                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                        {formatCurrencyRaw(drilldown.total, activeViewCurrency)}
                                        {drilldown.type === 'budget' && <span className={`text-sm font-normal ${isLight ? 'text-slate-400' : 'text-gray-500'}`}> / {formatCurrencyRaw(drilldown.budget, activeViewCurrency)}</span>}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldownItems.length}</p>
                                </div>
                            </div>
                            )}
                            {drilldown.type === 'budget' && drilldown.percentage != null && (
                                <div className="mt-2">
                                    <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#1a1a1a]'}`}>
                                        <div className={`h-full rounded-full transition-all duration-500 ${drilldown.percentage > 100 ? 'bg-red-500' : drilldown.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(drilldown.percentage, 100)}%` }} />
                                    </div>
                                    <p className={`text-[11px] mt-1 ${drilldown.percentage > 100 ? 'text-red-500' : drilldown.percentage > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {drilldown.percentage}% used
                                        {drilldown.percentage > 100 && ` (${formatCurrencyRaw(drilldown.total - drilldown.budget, activeViewCurrency)} over)`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Items list */}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {drilldownItems.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {drilldownItems.map(e => {
                                        const converted = (e.currency || 'PHP') !== activeViewCurrency ? toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency) : null
                                        const cat = categories.find(c => c._id === e.category?._id)
                                        return (
                                            <div key={e._id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}>
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (cat?.color || '#94a3b8') + '20' }}>
                                                    {cat?.icon ? <SafeIcon name={cat.icon} cls="text-[11px]" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description || 'No description'}</p>
                                                        {e.notes && (
                                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-500' : 'bg-amber-900/20 text-amber-400'}`} title={e.notes}>NOTE</span>
                                                        )}
                                                        {e.attachments?.length > 0 && (
                                                            <button onClick={() => setReceiptViewer(e.attachments[0])} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${isLight ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'}`} title="View receipt">
                                                                <FontAwesomeIcon icon={faFileExport} className="text-[7px] mr-0.5" />RECEIPT
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {drilldown.type !== 'payment' && e.paymentMethod && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#222] text-gray-400'}`}>{e.paymentMethod}</span>
                                                        )}
                                                        {drilldown.type === 'payment' && cat && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full`} style={{ backgroundColor: cat.color + '15', color: cat.color }}>{cat.name}</span>
                                                        )}
                                                        {drilldown.type === 'currency' && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${e.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{e.type === 'income' ? 'Income' : 'Expense'}</span>
                                                        )}
                                                        {drilldown.type === 'currency' && cat && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full`} style={{ backgroundColor: cat.color + '15', color: cat.color }}>{cat.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {drilldown.type === 'currency' ? (
                                                        <>
                                                            <p className={`text-sm font-semibold ${e.type === 'income' ? 'text-emerald-500' : (isLight ? 'text-slate-700' : 'text-gray-200')}`}>
                                                                {e.type === 'income' ? '+' : ''}{formatCurrencyRaw(e.amount, e.currency)}
                                                            </p>
                                                            {converted !== null && (
                                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(converted, activeViewCurrency)}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                                {converted !== null ? formatCurrencyRaw(converted, activeViewCurrency) : formatCurrencyRaw(e.amount, activeViewCurrency)}
                                                            </p>
                                                            {converted !== null && (
                                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency)}</p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No transactions found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Debt Drilldown Modal */}
            {debtDrilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setDebtDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${isLight ? 'bg-white' : 'bg-[#141414]'} border border-solid ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex-shrink-0`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-red-50' : 'bg-red-900/20'}`}>
                                    <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-sm ${isLight ? 'text-red-500' : 'text-red-400'}`} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>Debts Breakdown</h3>
                                    <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{activeDebts.length} active debt{activeDebts.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => setDebtDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        {/* Summary */}
                        <div className={`px-5 py-3 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'} flex-shrink-0`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>You Owe</p>
                                    <p className="text-lg font-bold text-red-500">{formatCurrency(totalOwed)}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Owed to You</p>
                                    <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalOwedToYou)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Debts list */}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {activeDebts.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {activeDebts.map(debt => {
                                        const remaining = debt.total_amount - debt.amount_paid
                                        const pct = debt.total_amount > 0 ? Math.round((debt.amount_paid / debt.total_amount) * 100) : 0
                                        const isOwe = debt.type === 'owe'
                                        const isOverdue = debt.due_date && new Date(debt.due_date) < new Date()
                                        return (
                                            <div key={debt._id} className={`px-5 py-3.5 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{debt.name}</p>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isOwe ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                {isOwe ? 'YOU OWE' : 'OWES YOU'}
                                                            </span>
                                                            {isOverdue && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0">OVERDUE</span>
                                                            )}
                                                        </div>
                                                        {debt.person && <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{debt.person}</p>}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className={`text-sm font-bold ${isOwe ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(remaining)}</p>
                                                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>of {formatCurrency(debt.total_amount)}</p>
                                                    </div>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                    <div className={`h-full rounded-full transition-all duration-500 ${isOwe ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        {pct}% paid · {formatCurrency(debt.amount_paid)} paid
                                                    </span>
                                                    {debt.due_date && (
                                                        <span className={`text-[10px] ${isOverdue ? 'text-amber-500' : (isLight ? 'text-slate-400' : 'text-gray-500')}`}>
                                                            Due {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                {debt.payments?.length > 0 && (
                                                    <div className={`mt-2 pt-2 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                        <p className={`text-[10px] font-medium uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payments ({debt.payments.length})</p>
                                                        <div className="space-y-1">
                                                            {debt.payments.slice(-3).map((p, i) => (
                                                                <div key={i} className="flex items-center justify-between">
                                                                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        {p.notes && ` · ${p.notes}`}
                                                                    </span>
                                                                    <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{formatCurrency(p.amount)}</span>
                                                                </div>
                                                            ))}
                                                            {debt.payments.length > 3 && (
                                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>+{debt.payments.length - 3} more</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active debts.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Savings Drilldown Modal */}
            {savingsDrilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setSavingsDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${isLight ? 'bg-white' : 'bg-[#141414]'} border border-solid ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center justify-between px-5 py-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex-shrink-0`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                                    <FontAwesomeIcon icon={faPiggyBank} className={`text-sm ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>Savings Breakdown</h3>
                                    <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{savingsAccounts?.length || 0} account{(savingsAccounts?.length || 0) !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => setSavingsDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>
                        <div className={`px-5 py-3 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'} flex-shrink-0`}>
                            <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Balance</p>
                            <p className={`text-xl font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(savingsTotal)}</p>
                        </div>
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {savingsAccounts?.length > 0 ? (
                                <div className="divide-y divide-solid" style={{ borderColor: isLight ? '#f1f5f9' : '#1f1f1f' }}>
                                    {savingsAccounts.map(account => {
                                        const accountTotal = calcAccountTotal(account)
                                        const isCash = account.category === 'cash'
                                        const denoms = account.denominations || {}
                                        const bills = DENOMINATIONS_CONST.filter(d => d.type === 'bill')
                                        const coins = DENOMINATIONS_CONST.filter(d => d.type === 'coin')
                                        const renderDenomGroup = (label, denomList) => (
                                            <div className="mt-2 space-y-1">
                                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
                                                {denomList.map(d => {
                                                    const count = parseInt(denoms[d.value], 10) || 0
                                                    if (count === 0) return null
                                                    return (
                                                        <div key={d.value} className="flex items-center justify-between py-0.5">
                                                            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{d.label} × {count}</span>
                                                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(count * d.value)}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                        return (
                                            <div key={account._id} className="px-5 py-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCash ? (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400') : (isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400')}`}>
                                                            <FontAwesomeIcon icon={isCash ? faWallet : faUniversity} className="text-xs" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{account.name}</p>
                                                            <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{isCash ? 'Cash' : 'Bank'}{account.isDefault ? ' · Default' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm font-bold flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrency(accountTotal)}</p>
                                                </div>
                                                {isCash && accountTotal > 0 && (
                                                    <div className={`mt-3 pl-10 rounded-lg px-3 py-2 ${isLight ? 'bg-slate-50' : 'bg-white/[0.02]'}`}>
                                                        {renderDenomGroup('Bills', bills)}
                                                        {renderDenomGroup('Coins', coins)}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No savings recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Goals Drilldown Modal */}
            {goalsDrilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setGoalsDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${isLight ? 'bg-white' : 'bg-[#141414]'} border border-solid ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center justify-between px-5 py-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex-shrink-0`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                                    <FontAwesomeIcon icon={faCheckCircle} className={`text-sm ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>Goals Breakdown</h3>
                                    <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => setGoalsDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>
                        {activeGoals.length > 0 && (
                            <div className={`px-5 py-3 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'} flex-shrink-0`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Overall Progress</p>
                                        <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatCurrency(goalsTotalSaved)} <span className={`text-sm font-normal ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>/ {formatCurrency(goalsTotalTarget)}</span></p>
                                    </div>
                                    <span className={`text-lg font-bold ${goalsOverallPct >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{goalsOverallPct}%</span>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#1a1a1a]'}`}>
                                    <div className={`h-full rounded-full transition-all duration-500 ${goalsOverallPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(goalsOverallPct, 100)}%` }} />
                                </div>
                            </div>
                        )}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {activeGoals.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {activeGoals.map(goal => {
                                        const pct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
                                        const remaining = goal.targetAmount - goal.currentAmount
                                        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date()
                                        return (
                                            <div key={goal._id} className={`px-5 py-3.5 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: goal.color + '20' }}>
                                                            {goal.icon ? <SafeIcon name={goal.icon} cls="text-xs" style={{ color: goal.color }} /> : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.color }} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{goal.name}</p>
                                                                {isOverdue && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0">OVERDUE</span>}
                                                            </div>
                                                            {goal.notes && <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{goal.notes}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className={`text-sm font-bold`} style={{ color: goal.color }}>{pct}%</p>
                                                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(remaining)} left</p>
                                                    </div>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }} />
                                                </div>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                                                    {goal.deadline && (
                                                        <span className={`text-[10px] ${isOverdue ? 'text-amber-500' : (isLight ? 'text-slate-400' : 'text-gray-500')}`}>
                                                            {isOverdue ? 'Was due' : 'Due'} {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                {goal.contributions?.length > 0 && (
                                                    <div className={`mt-2 pt-2 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                        <p className={`text-[10px] font-medium uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Contributions ({goal.contributions.length})</p>
                                                        <div className="space-y-1">
                                                            {goal.contributions.slice(-3).map((c, i) => (
                                                                <div key={i} className="flex items-center justify-between">
                                                                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        {c.notes && ` · ${c.notes}`}
                                                                    </span>
                                                                    <span className={`text-[11px] font-semibold text-emerald-500`}>+{formatCurrency(c.amount)}</span>
                                                                </div>
                                                            ))}
                                                            {goal.contributions.length > 3 && (
                                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>+{goal.contributions.length - 3} more</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active goals.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    )
})

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
            <div className="space-y-4">
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
        <div className="space-y-4">
            {/* Summary Strip */}
            <AnimateIn delay={0}><div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className={`${card} px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                        <FontAwesomeIcon icon={faCalendarDay} className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 flex items-center justify-between sm:block">
                        <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Entries</p>
                        <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{filtered.length}{hasFilters ? ` / ${expenses.length}` : ''}</p>
                    </div>
                </div>
                <div className={`${card} px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                        <FontAwesomeIcon icon={faArrowUp} className="text-xs text-emerald-500" />
                    </div>
                    <div className="flex-1 sm:block">
                        <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income</p>
                        <p className="text-sm font-bold text-emerald-500">{convertedTotals ? formatCurrencyRaw(convertedTotals.income, activeViewCurrency) : formatCurrencyRaw(totalIncome, activeViewCurrency)}</p>
                        {overallBreakdown.filter(([, v]) => v.income > 0).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {overallBreakdown.filter(([, v]) => v.income > 0).map(([code, v]) => (
                                    <span key={code} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>
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
                        <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Expenses</p>
                        <p className="text-sm font-bold text-red-500">{convertedTotals ? formatCurrencyRaw(convertedTotals.expense, activeViewCurrency) : formatCurrencyRaw(totalExpense, activeViewCurrency)}</p>
                        {overallBreakdown.filter(([, v]) => v.expense > 0).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {overallBreakdown.filter(([, v]) => v.expense > 0).map(([code, v]) => (
                                    <span key={code} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400'}`}>
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
                        <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>View in:</span>
                        <select
                            value={viewCurrency}
                            onChange={e => setViewCurrency(e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
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
                                className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}
                            >
                                Set as default
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeViewCurrency !== 'PHP' && exchangeRates[activeViewCurrency] && (
                            <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                1 PHP = {exchangeRates[activeViewCurrency]} {activeViewCurrency}
                            </span>
                        )}
                        <button onClick={openRateEditor} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`}>
                            <FontAwesomeIcon icon={faCogs} className="text-[10px]" />
                            Rates
                        </button>
                    </div>
                </div>
                {convertedTotals && (
                    <div className={`mt-2.5 pt-2.5 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Income</p>
                                <p className="text-xs font-bold text-emerald-500">{formatCurrencyRaw(convertedTotals.income, activeViewCurrency)}</p>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Expenses</p>
                                <p className="text-xs font-bold text-red-500">{formatCurrencyRaw(convertedTotals.expense, activeViewCurrency)}</p>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Balance</p>
                                <p className={`text-xs font-bold ${convertedTotals.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(Math.abs(convertedTotals.balance), activeViewCurrency)}</p>
                            </div>
                        </div>
                        {overallBreakdown.length > 0 && (
                            <div className={`flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-dashed ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                {overallBreakdown.map(([code, v]) => (
                                    <div key={code} className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1a1a1a] text-gray-400'}`}>
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
                    <p className={`text-[11px] mt-2 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                        No exchange rate set for {activeViewCurrency}. Click "Rates" to configure.
                    </p>
                )}
            </div>

            {/* Rate Editor Modal */}
            {showRateEditor && (
                <ModalOverlay isLight={isLight} onClose={() => setShowRateEditor(false)}>
                    <div className={`relative w-full max-w-md rounded-2xl border border-solid shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        <div className={`flex items-center justify-between px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Exchange Rates (1 PHP = ?)</h3>
                            <button onClick={() => setShowRateEditor(false)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
                            {CURRENCIES.filter(c => c.code !== 'PHP').map(c => {
                                const liveVal = liveRates?.[c.code]
                                const currentVal = parseFloat(rateEditorValues[c.code])
                                const isCustom = liveVal && currentVal && Math.abs(currentVal - liveVal) > 0.000001
                                return (
                                    <div key={c.code} className="flex items-center gap-3">
                                        <div className={`flex items-center gap-1.5 w-28 flex-shrink-0`}>
                                            <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{c.symbol}</span>
                                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{c.code}</span>
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
                                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400'}`}>
                                                    custom
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className={`flex items-center justify-between gap-2 px-5 py-3.5 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <button
                                onClick={handleResetRates}
                                disabled={resetting}
                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'} disabled:opacity-50`}
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className={`text-[10px] ${resetting ? 'animate-spin' : ''}`} />
                                {resetting ? 'Resetting...' : 'Reset to current rates'}
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowRateEditor(false)} className={btnSecondary}>Cancel</button>
                                <button onClick={saveRateEditor} className={btnPrimary}>Save Rates</button>
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
                    <button onClick={downloadCSVTemplate} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300'}`}>
                        <FontAwesomeIcon icon={faFileExport} className="text-[10px]" />
                        Template
                    </button>
                    <label className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg cursor-pointer transition-all ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
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
                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Searching...</span>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <h4 className={`text-xs font-semibold mb-3 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Search Results ({searchResults.length})</h4>
                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                {searchResults.slice(0, 20).map(e => (
                                    <div key={e._id} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className={`font-medium whitespace-pre-wrap break-words ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</span>
                                            {e.notes && <span className={`whitespace-pre-wrap break-words ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{e.notes}</span>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className={`font-semibold whitespace-nowrap ${e.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount, e.currency || 'PHP')}</span>
                                            {(e.currency || 'PHP') !== activeViewCurrency && (
                                                <span className={`block text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrencyRaw(e.amount, e.currency || 'PHP')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-1">
                            <FontAwesomeIcon icon={faSearch} className={`text-lg ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No results found for "{searchQuery}"</span>
                        </div>
                    )}
                </div>
            )}

            {/* CSV Import Preview */}
            {showCSVImport && csvData.length > 0 && (
                <div className={`${card} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>CSV Preview ({csvData.length} rows)</h4>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowCSVImport(false); setCsvData([]) }} className={btnSecondary + ' !text-xs !px-3 !py-1.5'}>Cancel</button>
                            <button onClick={handleCSVImport} className={btnPrimary + ' !text-xs !px-3 !py-1.5'}>Import {csvData.length} rows</button>
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
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
                        <span className={`text-xs font-medium ${hasFilters ? (isLight ? 'text-blue-600' : 'text-blue-400') : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>
                            {hasFilters ? 'Filters active' : 'Filter'}
                        </span>
                        {hasFilters && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                                {[filterDateFrom, filterDateTo, filterMethod, filterCategory].filter(Boolean).length}
                            </span>
                        )}
                    </div>
                    {hasFilters && (
                        <span
                            onClick={e => { e.stopPropagation(); clearFilters() }}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md cursor-pointer transition-all ${isLight ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'}`}
                        >
                            Clear all
                        </span>
                    )}
                </button>
                {showFilters && (
                    <div className={`px-4 py-3 border-t border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#0a0a0a]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>From</label>
                                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>To</label>
                                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payment Method</label>
                                <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={`${selectCls} w-full`}>
                                    <option value="">All Methods</option>
                                    {usedMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
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
                                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Date:</span>
                                <input
                                    type="date"
                                    onChange={e => { if (e.target.value) handleBulkDateUpdate(e.target.value) }}
                                    className={`px-2 py-1.5 rounded-lg text-xs border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                    title="Set date for selected transactions"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Move to:</span>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value !== '') handleBulkCategoryUpdate(e.target.value === 'none' ? '' : e.target.value); e.target.value = '' }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                >
                                    <option value="" disabled>Select category</option>
                                    <option value="none">Uncategorized</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payment:</span>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value) handleBulkPaymentMethodUpdate(e.target.value); e.target.value = '' }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                >
                                    <option value="" disabled>Select method</option>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Currency:</span>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value) handleBulkCurrencyUpdate(e.target.value); e.target.value = '' }}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs border border-solid outline-none cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a1a] border-[#333] text-gray-300'}`}
                                >
                                    <option value="" disabled>Select currency</option>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                                </select>
                            </div>
                            <div className={`w-px h-5 ${isLight ? 'bg-slate-200' : 'bg-[#333]'}`} />
                            <button onClick={() => { setSelectedExpenses([]); setBulkDeleteConfirm(false) }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isLight ? 'bg-white hover:bg-slate-100 text-slate-600 border border-solid border-slate-200' : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300 border border-solid border-[#333]'}`}>Cancel</button>
                            <button onClick={handleBulkDelete} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isLight ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
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
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
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
                    <div className={`px-4 sm:px-5 py-4 border-b border-solid ${isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#111] border-[#1f1f1f]'}`}>
                        {/* Shared fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Date</label>
                                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Type</label>
                                <select value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value, category: ''})} className={`${selectCls} w-full`}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Category</label>
                                <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className={`${selectCls} w-full`}>
                                    <option value="">None</option>
                                    {categories.filter(c => c.type === expenseForm.type).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Payment Method</label>
                                <select value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})} className={`${selectCls} w-full`}>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Items list */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                    Items ({expenseItems.length})
                                </label>
                                {!editingExpense && (
                                    <button
                                        onClick={() => setExpenseItems([...expenseItems, { ...emptyItem }])}
                                        className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-all ${isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'}`}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-[8px]" />
                                        Add Item
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {expenseItems.map((item, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-lg border border-solid ${isLight ? 'bg-white border-slate-200/80' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}>
                                        <span className={`text-[10px] font-bold w-5 text-center flex-shrink-0 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{idx + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={e => {
                                                    const updated = [...expenseItems]
                                                    updated[idx] = { ...updated[idx], description: e.target.value }
                                                    setExpenseItems(updated)
                                                }}
                                                className={inputCls}
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
                                                className={`${inputCls} [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        {expenseItems.length > 1 && (
                                            <button
                                                onClick={() => setExpenseItems(expenseItems.filter((_, i) => i !== idx))}
                                                className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-red-50 text-red-400' : 'hover:bg-red-900/20 text-red-500'}`}
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {expenseItems.length > 1 && (
                                <div className={`flex items-center justify-end mt-2 pt-2 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                    <span className={`text-xs font-medium mr-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total:</span>
                                    <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                        {formatCurrency(expenseItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0))}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Notes (optional)</label>
                                <textarea rows={3} placeholder="Additional notes..." value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} className={`${inputCls} resize-y min-h-[72px]`} />
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Currency</label>
                                <select value={expenseForm.currency || 'PHP'} onChange={e => setExpenseForm({...expenseForm, currency: e.target.value})} className={`${selectCls} w-full`}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className="flex items-center gap-4 mb-3">
                                <label className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${uploadingReceipt ? 'opacity-50 pointer-events-none' : 'cursor-pointer'} ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'}`}>
                                    <FontAwesomeIcon icon={uploadingReceipt ? faSyncAlt : faFileExport} className={`text-[10px] ${uploadingReceipt ? 'animate-spin' : ''}`} />
                                    {uploadingReceipt ? 'Uploading...' : attachmentPreview ? 'Change Receipt' : 'Attach Receipt'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={uploadingReceipt} />
                                </label>
                                {attachmentPreview && (
                                    <div className="flex items-center gap-2">
                                        <img src={attachmentPreview} alt="receipt" className="w-10 h-10 rounded-md object-cover border border-solid border-slate-200/50 cursor-pointer" onClick={() => setReceiptViewer(attachmentPreview)} />
                                        <button onClick={removeReceipt} className={`text-[10px] ${isLight ? 'text-red-500' : 'text-red-400'}`}>
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-6 flex-wrap">
                                <label className={`flex items-center gap-2 cursor-pointer select-none`}>
                                    <input type="checkbox" checked={!!expenseForm.isRecurring} onChange={e => setExpenseForm({...expenseForm, isRecurring: e.target.checked})} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                                    <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Recurring transaction</span>
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer select-none`}>
                                    <input type="checkbox" checked={!!expenseForm.listOnly} onChange={e => setExpenseForm({...expenseForm, listOnly: e.target.checked})} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                                    <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>List only (exclude from totals)</span>
                                </label>
                            </div>
                            {expenseForm.isRecurring && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <div>
                                        <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Frequency</label>
                                        <select value={expenseForm.recurrenceRule || ''} onChange={e => setExpenseForm({...expenseForm, recurrenceRule: e.target.value})} className={`${selectCls} w-full`}>
                                            <option value="">Select frequency</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>End date (optional)</label>
                                        <input type="date" value={expenseForm.recurrenceEnd || ''} onChange={e => setExpenseForm({...expenseForm, recurrenceEnd: e.target.value})} className={inputCls} />
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            <div className="mt-3">
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Tags (optional)</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(expenseForm.tags || []).map((tag, ti) => (
                                        <span key={ti} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>
                                            {tag}
                                            <button type="button" onClick={() => setExpenseForm(f => ({ ...f, tags: f.tags.filter((_, i) => i !== ti) }))} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <input type="text" placeholder="Type tag & press Enter" className={`${inputCls} !py-1.5 !text-xs`}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            e.preventDefault()
                                            const tag = e.target.value.trim().toLowerCase()
                                            if (!(expenseForm.tags || []).includes(tag)) {
                                                setExpenseForm(f => ({ ...f, tags: [...(f.tags || []), tag] }))
                                            }
                                            e.target.value = ''
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => { setShowExpenseForm(false); setEditingExpense(null); setExpenseForm(emptyExpense); setExpenseItems([{ ...emptyItem }]) }} className={btnSecondary}>Cancel</button>
                            <button onClick={handleExpenseSubmit} className={btnPrimary} disabled={!expenseItems.some(i => i.description && i.amount)}>
                                <FontAwesomeIcon icon={editingExpense ? faCheck : faPlus} className="mr-1.5 text-xs" />
                                {editingExpense ? 'Update' : `Add ${expenseItems.filter(i => i.description && i.amount).length > 1 ? `(${expenseItems.filter(i => i.description && i.amount).length} items)` : ''}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {filtered.length > 0 ? (
                <>
                    <div className="overflow-x-auto -mx-px">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400 bg-slate-50/80' : 'text-gray-500 bg-[#111]'}`}>
                                    <th className="w-10 px-4 py-2.5 text-center">
                                        <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAll(filteredIds)} className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500" />
                                    </th>
                                    <th className="px-3 py-2.5 text-left font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('date')}>Date{sortIcon('date')}</th>
                                    <th className="px-3 py-2.5 text-left font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('description')}>Description{sortIcon('description')}</th>
                                    <th className="px-3 py-2.5 text-left font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('category')}>Category{sortIcon('category')}</th>
                                    <th className="px-3 py-2.5 text-left font-semibold">Method</th>
                                    <th className="px-3 py-2.5 text-right font-semibold cursor-pointer select-none hover:text-blue-400 transition-colors" onClick={() => handleSort('amount')}>Amount{sortIcon('amount')}</th>
                                    <th className="w-20 px-3 py-2.5 text-right font-semibold">Actions</th>
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
                                                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{date}</span>
                                                                {gb.map(([code, v]) => {
                                                                    const net = v.income - v.expense
                                                                    if (v.income === 0 && v.expense === 0) return null
                                                                    return (
                                                                        <span key={code} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
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
                                                                    <span className="text-[11px] font-semibold text-emerald-500">+{formatCurrencyRaw(cg ? cg.income : group.totalIncome, activeViewCurrency)}</span>
                                                                )}
                                                                {(cg ? cg.expense : group.totalExpense) > 0 && (
                                                                    <span className="text-[11px] font-semibold text-red-500">-{formatCurrencyRaw(cg ? cg.expense : group.totalExpense, activeViewCurrency)}</span>
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
                                                        <td className="px-4 py-2.5 text-center align-top">
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectExpense(e._id)} className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500" />
                                                        </td>
                                                        <td className={`px-3 py-2.5 text-xs whitespace-nowrap align-top ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top">
                                                            <div className="flex items-start gap-1.5 flex-wrap">
                                                                <p className={`text-sm font-medium whitespace-pre-wrap break-words max-w-[220px] ${e.listOnly ? 'line-through' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description}</p>
                                                                {e.listOnly && (
                                                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400'}`}>
                                                                        <FontAwesomeIcon icon={faEye} className="text-[7px]" />
                                                                        LIST
                                                                    </span>
                                                                )}
                                                                {e.attachments?.length > 0 && (
                                                                    <button onClick={() => setReceiptViewer(e.attachments[0])} className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${isLight ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'}`} title="View receipt">
                                                                        <FontAwesomeIcon icon={faFileExport} className="text-[7px]" />
                                                                        RECEIPT
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {e.notes && <p className={`text-[11px] whitespace-pre-wrap break-words max-w-[220px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>{e.notes}</p>}
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                                                    {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-[10px]" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                                                </div>
                                                                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{e.category?.name || 'Uncategorized'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 align-top">
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                                                <FontAwesomeIcon icon={paymentIcon(e.paymentMethod)} className="text-[10px]" />
                                                                {e.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right align-top">
                                                            {converted !== null ? (
                                                                <>
                                                                    <span className={`text-sm font-semibold whitespace-nowrap ${e.listOnly ? (isLight ? 'text-slate-400 line-through' : 'text-gray-500 line-through') : (e.type === 'income' ? 'text-emerald-500' : 'text-red-500')}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(converted, activeViewCurrency)}
                                                                    </span>
                                                                    <span className={`block text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, e.currency)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className={`text-sm font-semibold whitespace-nowrap ${e.listOnly ? (isLight ? 'text-slate-400 line-through' : 'text-gray-500 line-through') : (e.type === 'income' ? 'text-emerald-500' : 'text-red-500')}`}>
                                                                    {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, e.currency)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right align-top">
                                                            <div className="flex items-center justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                                                {!isViewer && <>
                                                                <button
                                                                    onClick={async () => {
                                                                        await dispatch(updateBudgetExpense({ id: e._id, date: e.date, description: e.description, category: e.category?._id || '', amount: e.amount, type: e.type, paymentMethod: e.paymentMethod, notes: e.notes || '', currency: e.currency || 'PHP', listOnly: !e.listOnly, attachments: e.attachments || [], isRecurring: !!e.isRecurring, recurrenceRule: e.recurrenceRule || '', recurrenceEnd: e.recurrenceEnd || '', month, year, ...ownerParam }))
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

                        const btnBase = `w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed`
                        const btnIdle = isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#1f1f1f]'
                        const btnActive = isLight ? 'bg-blue-500 text-white shadow-sm' : 'bg-blue-600 text-white'

                        return (
                        <div className={`flex items-center justify-between px-4 py-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1a1a1a]'}`}>
                            <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
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
                            <button onClick={clearFilters} className={`mt-3 text-xs font-medium px-4 py-2 rounded-lg transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}>
                                <FontAwesomeIcon icon={faFilter} className="mr-1.5 text-[10px]" />Clear Filters
                            </button>
                        ) : (
                            <button onClick={() => setShowExpenseForm(true)} className={`mt-3 text-xs font-medium px-4 py-2 rounded-lg transition-all ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400'}`}>
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
                            <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Recurring Templates ({recurringTemplates.length})</span>
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
                                                {cat?.icon ? <SafeIcon name={cat.icon} cls="text-[11px]" style={{ color: cat.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium whitespace-pre-wrap break-words ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{t.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>
                                                        {t.recurrenceRule}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#222] text-gray-400'}`}>
                                                        {t.paymentMethod || 'Cash'}
                                                    </span>
                                                    {t.recurrenceEnd && (
                                                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
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

// ==================== MONTHLY BUDGET TAB ====================

const MonthlyBudgetTab = React.memo(({ monthlyBudgetData, dashboard, isLight, card, formatCurrency, statusColor, month, year, isLoading, expenses, formatCurrencyRaw, activeViewCurrency, toTargetCurrency, categories, paymentIcon, setReceiptViewer }) => {
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`
    const [drilldown, setDrilldown] = useState(null)

    const drilldownItems = useMemo(() => {
        if (!drilldown) return []
        const active = expenses.filter(e => !e.listOnly && e.type === 'expense')
        return active
            .filter(e => (e.category?._id || 'uncategorized') === drilldown._id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [drilldown, expenses])

    if (isLoading || !dashboard) {
        return (
            <div className="space-y-4">
                <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`h-4 w-32 ${pulse}`} />
                        <div className={`h-4 w-24 ${pulse}`} />
                    </div>
                    <div className={`h-3 rounded-full w-full ${pulse}`} />
                    <div className="flex justify-between mt-2">
                        <div className={`h-3 w-20 ${pulse}`} />
                        <div className={`h-3 w-20 ${pulse}`} />
                    </div>
                </div>
                <div className={`${card} overflow-hidden`}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex items-center gap-3 px-5 py-4 ${i > 0 ? `border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}` : ''}`}>
                            <div className={`w-3 h-3 rounded-full ${pulse}`} />
                            <div className="flex-1 space-y-1.5">
                                <div className={`h-3.5 w-28 ${pulse}`} />
                                <div className={`h-2 rounded-full w-full ${pulse}`} />
                            </div>
                            <div className={`h-4 w-20 ${pulse}`} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
    const totalSpent = monthlyBudgetData.reduce((s, c) => s + (c.spent || 0), 0)
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    const overallStatus = statusColor(overallPct)

    return (
        <div className="space-y-4">
            {/* Overall Budget Bar */}
            <AnimateIn delay={0}><div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {MONTHS[month - 1]} {year} — Overall Budget
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${overallStatus.text} ${overallStatus.bg}`}>
                        {overallPct}%
                    </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`} role="progressbar" aria-valuenow={Math.min(overallPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Overall budget ${overallPct}% used`}>
                    <div className={`h-full rounded-full ${overallStatus.bar}`} style={{ width: `${Math.min(overallPct, 100)}%`, animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Spent: {formatCurrency(totalSpent)}</span>
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget: {formatCurrency(totalBudget)}</span>
                </div>
            </div></AnimateIn>

            {/* Per Category */}
            {monthlyBudgetData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {monthlyBudgetData.map((cat, catIdx) => {
                        const sc = statusColor(cat.percentage)
                        return (
                            <AnimateIn key={cat._id} delay={catIdx * 80}>
                            <div className={`${card} p-4 border-l-4 cursor-pointer transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`} style={{ borderLeftColor: cat.color }} onClick={() => setDrilldown(cat)}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                            {cat.icon ? <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} /> : <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                        </div>
                                        <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.text} ${sc.bg}`}>
                                        {cat.budget > 0 ? `${cat.percentage}%` : 'No budget'}
                                    </span>
                                </div>
                                {cat.budget > 0 && (
                                    <div className={`h-2 rounded-full overflow-hidden mb-2 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${Math.min(cat.percentage, 100)}%`, animation: `barGrow 0.8s ease-out ${0.2 + catIdx * 0.08}s both` }} />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Spent: {formatCurrency(cat.spent)}</span>
                                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {cat.budget > 0 ? `Remaining: ${formatCurrency(cat.remaining)}` : `Budget: ${formatCurrency(0)}`}
                                    </span>
                                </div>
                                {cat.percentage > 100 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium text-red-500`}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                                        Over budget by {formatCurrency(Math.abs(cat.remaining))}
                                    </div>
                                )}
                                {cat.percentage === 100 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-500`}>
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                                        Exactly on budget
                                    </div>
                                )}
                                {cat.percentage >= 80 && cat.percentage < 100 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-500`}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                                        Approaching budget limit
                                    </div>
                                )}
                            </div>
                            </AnimateIn>
                        )
                    })}
                </div>
            ) : (
                <div className={`${card} p-8 text-center`}>
                    <FontAwesomeIcon icon={faCalendarAlt} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No budget categories set up.</p>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>Go to Categories tab to create expense categories with budgets.</p>
                </div>
            )}

            {/* Monthly Budget Drilldown Modal */}
            {drilldown && (
                <ModalOverlay isLight={isLight} onClose={() => setDrilldown(null)}>
                    <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${isLight ? 'bg-white' : 'bg-[#141414]'} border border-solid ${isLight ? 'border-slate-200' : 'border-[#2B2B2B]'}`} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'} flex-shrink-0`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: drilldown.color + '20' }}>
                                    {drilldown.icon ? <SafeIcon name={drilldown.icon} cls="text-sm" style={{ color: drilldown.color }} /> : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: drilldown.color }} />}
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldown.name}</h3>
                                    <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget Breakdown · {MONTHS[month - 1]} {year}</p>
                                </div>
                            </div>
                            <button onClick={() => setDrilldown(null)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        {/* Budget summary */}
                        <div className={`px-5 py-3 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'} flex-shrink-0`}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Spent / Budget</p>
                                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                        {formatCurrency(drilldown.spent)}
                                        <span className={`text-sm font-normal ${isLight ? 'text-slate-400' : 'text-gray-500'}`}> / {formatCurrency(drilldown.budget)}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[11px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</p>
                                    <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{drilldownItems.length}</p>
                                </div>
                            </div>
                            {drilldown.budget > 0 && (
                                <>
                                    <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#1a1a1a]'}`}>
                                        <div className={`h-full rounded-full transition-all duration-500 ${statusColor(drilldown.percentage).bar}`} style={{ width: `${Math.min(drilldown.percentage, 100)}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className={`text-[11px] ${statusColor(drilldown.percentage).text}`}>
                                            {drilldown.percentage}% used
                                            {drilldown.percentage > 100 && ` · ${formatCurrency(Math.abs(drilldown.remaining))} over`}
                                        </span>
                                        <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {drilldown.remaining >= 0 ? `${formatCurrency(drilldown.remaining)} left` : ''}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Expense list */}
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {drilldownItems.length > 0 ? (
                                <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                                    {drilldownItems.map(e => {
                                        const converted = (e.currency || 'PHP') !== activeViewCurrency ? toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency) : null
                                        return (
                                            <div key={e._id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}>
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: drilldown.color + '20' }}>
                                                    {drilldown.icon ? <SafeIcon name={drilldown.icon} cls="text-[11px]" style={{ color: drilldown.color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: drilldown.color }} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{e.description || 'No description'}</p>
                                                        {e.notes && (
                                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-500' : 'bg-amber-900/20 text-amber-400'}`} title={e.notes}>NOTE</span>
                                                        )}
                                                        {e.attachments?.length > 0 && (
                                                            <button onClick={() => setReceiptViewer(e.attachments[0])} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${isLight ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'}`} title="View receipt">
                                                                <FontAwesomeIcon icon={faFileExport} className="text-[7px] mr-0.5" />RECEIPT
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {e.paymentMethod && (
                                                            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#222] text-gray-400'}`}>
                                                                <FontAwesomeIcon icon={paymentIcon(e.paymentMethod)} className="text-[8px]" />
                                                                {e.paymentMethod}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-sm font-semibold text-red-500`}>
                                                        -{converted !== null ? formatCurrencyRaw(converted, activeViewCurrency) : formatCurrencyRaw(e.amount, activeViewCurrency)}
                                                    </p>
                                                    {converted !== null && (
                                                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>-{formatCurrencyRaw(e.amount, e.currency)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expenses in this category.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    )
})

// ==================== CATEGORIES TAB ====================

const CategoriesTab = React.memo(({
    categories, categoryForm, setCategoryForm, editingCategory, showCategoryForm,
    setShowCategoryForm, handleCategorySubmit, handleEditCategory, handleDeleteCategory,
    setEditingCategory, deleteConfirm, isLight, card, inputCls, selectCls, btnPrimary,
    btnSecondary, formatCurrency, emptyCategory, isLoading, dispatch, currentUserId,
    isViewer, ownerParam = {}
}) => {
    const [showIconPicker, setShowIconPicker] = useState(false)
    const [iconSearch, setIconSearch] = useState('')
    const [shareTargetId, setShareTargetId] = useState(null)
    const shareCategory = shareTargetId ? categories.find(c => c._id === shareTargetId) : null
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const handleShareCategory = async (username) => {
        if (!shareCategory) return
        await dispatch(shareBudgetCategory({ id: shareCategory._id, username })).unwrap()
    }

    const handleUnshareCategory = async (targetUserId) => {
        if (!shareCategory) return
        await dispatch(unshareBudgetCategory({ id: shareCategory._id, targetUserId })).unwrap()
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, g) => (
                    <div key={g} className={`${card} overflow-hidden`}>
                        <div className={`px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className={`h-4 w-32 ${pulse}`} />
                        </div>
                        <div className="p-4 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${pulse}`} />
                                    <div className="flex-1">
                                        <div className={`h-3.5 w-24 ${pulse}`} />
                                    </div>
                                    <div className={`h-3 w-16 ${pulse}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const expenseCats = categories.filter(c => c.type === 'expense')
    const incomeCats = categories.filter(c => c.type === 'income')

    return (
        <div className="space-y-4">
            <AnimateIn delay={0}><div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {editingCategory ? 'Edit Category' : 'Manage Categories'}
                    </h3>
                    {!isViewer && <button
                        onClick={() => { setShowCategoryForm(!showCategoryForm); setEditingCategory(null); setCategoryForm(emptyCategory) }}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                            showCategoryForm
                                ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                : (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                        }`}
                    >
                        <FontAwesomeIcon icon={showCategoryForm ? faTimes : faPlus} className="text-[10px]" />
                        {showCategoryForm ? 'Cancel' : 'New Category'}
                    </button>}
                </div>

                {showCategoryForm && !isViewer && (
                    <div className={`p-4 rounded-lg mb-4 border border-solid ${isLight ? 'bg-slate-50/50 border-slate-200/60' : 'bg-[#141414] border-[#2B2B2B]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Name</label>
                                <input type="text" placeholder="Category name" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Type</label>
                                <select value={categoryForm.type} onChange={e => setCategoryForm({...categoryForm, type: e.target.value})} className={`${selectCls} w-full`}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Monthly Budget</label>
                                <input type="number" placeholder="0.00" value={categoryForm.budget} onChange={e => setCategoryForm({...categoryForm, budget: e.target.value})} className={inputCls} min="0" step="0.01" />
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Icon</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowIconPicker(!showIconPicker)} className={`w-9 h-9 rounded-lg flex items-center justify-center border border-solid transition-all ${isLight ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-[#1a1a1a] border-[#333] hover:border-blue-500'}`}>
                                        {categoryForm.icon ? <SafeIcon name={categoryForm.icon} cls={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`} /> : <FontAwesomeIcon icon={faCircle} className={`text-xs ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />}
                                    </button>
                                    {categoryForm.icon && <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{categoryForm.icon}</span>}
                                </div>
                                {showIconPicker && (
                                    <div className={`mt-2 rounded-lg border border-solid overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#111] border-[#333]'}`}>
                                        <div className={`px-2 pt-2 pb-1.5`}>
                                            <input
                                                type="text"
                                                value={iconSearch}
                                                onChange={e => setIconSearch(e.target.value)}
                                                placeholder="Search icons..."
                                                className={`w-full px-2.5 py-1.5 rounded-md text-xs border border-solid outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-300 focus:border-blue-300' : 'bg-[#1a1a1a] border-[#333] text-gray-200 placeholder:text-gray-600 focus:border-blue-500'}`}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="px-2 pb-2 max-h-36 overflow-y-auto grid grid-cols-8 gap-1">
                                            {!iconSearch && (
                                                <button onClick={() => { setCategoryForm({...categoryForm, icon: ''}); setShowIconPicker(false); setIconSearch('') }} className={`w-7 h-7 rounded flex items-center justify-center text-xs ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#222] text-gray-500'}`} title="None"><FontAwesomeIcon icon={faTimes} /></button>
                                            )}
                                            {ICON_GRID.filter(ic => !iconSearch || ic.includes(iconSearch.toLowerCase())).map(ic => (
                                                <button key={ic} onClick={() => { setCategoryForm({...categoryForm, icon: ic}); setShowIconPicker(false); setIconSearch('') }} className={`w-7 h-7 rounded flex items-center justify-center transition-all ${categoryForm.icon === ic ? (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400') : (isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#222] text-gray-400')}`} title={ic}>
                                                    <SafeIcon name={ic} cls="text-xs" />
                                                </button>
                                            ))}
                                            {ICON_GRID.filter(ic => !iconSearch || ic.includes(iconSearch.toLowerCase())).length === 0 && (
                                                <p className={`col-span-8 text-center text-[11px] py-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No icons found</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Color</label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {CATEGORY_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCategoryForm({...categoryForm, color: c})}
                                            aria-label={`Select color ${c}`}
                                            aria-pressed={categoryForm.color === c}
                                            className={`w-7 h-7 rounded-full transition-all ${categoryForm.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: c, ringColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <label className={`flex items-center gap-2 cursor-pointer select-none`}>
                                    <input type="checkbox" checked={!!categoryForm.rollover} onChange={e => setCategoryForm({...categoryForm, rollover: e.target.checked, rolloverRule: e.target.checked ? 'carry' : 'none'})} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                                    <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Enable budget rollover</span>
                                </label>
                                {categoryForm.rollover && (
                                    <div className="ml-6">
                                        <select value={categoryForm.rolloverRule || 'carry'} onChange={e => setCategoryForm({...categoryForm, rolloverRule: e.target.value})} className={`${selectCls} text-xs`}>
                                            <option value="carry">Carry unused budget forward</option>
                                            <option value="savings">Move unused to savings</option>
                                            <option value="reset">Reset monthly (warn if over)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            {categoryForm.type === 'income' && (
                                <div>
                                    <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Allocation %</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="0" max="100" step="5" placeholder="100" value={categoryForm.allocationPercent ?? 100} onChange={e => setCategoryForm({...categoryForm, allocationPercent: e.target.value})} className={`${inputCls} w-20`} />
                                        <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>% goes to budget</span>
                                    </div>
                                    <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Remainder is saved automatically</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); setCategoryForm(emptyCategory); setShowIconPicker(false); setIconSearch('') }} className={btnSecondary}>Cancel</button>
                            <button onClick={handleCategorySubmit} className={btnPrimary} disabled={!categoryForm.name}>
                                <FontAwesomeIcon icon={editingCategory ? faCheck : faPlus} className="mr-1.5 text-xs" />
                                {editingCategory ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                )}
            </div></AnimateIn>

            {/* Expense Categories */}
            <AnimateIn delay={100}><div className={`${card} p-5`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                    Expense Categories ({expenseCats.length})
                </h4>
                {expenseCats.length > 0 ? (
                    <div className="space-y-2">
                        {expenseCats.map(cat => {
                            const isOwner = cat.user === currentUserId || cat.user?._id === currentUserId
                            return (
                            <div key={cat._id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    {cat.icon ? (
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                            <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} />
                                        </div>
                                    ) : (
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-medium block truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                            {!isOwner && (
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isLight ? 'bg-violet-50 text-violet-500' : 'bg-violet-900/20 text-violet-400'}`}>
                                                    <FontAwesomeIcon icon={faUserFriends} className="mr-0.5 text-[7px]" />Shared
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {cat.budget > 0 && (
                                                <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget: {formatCurrency(cat.budget)}/mo</span>
                                            )}
                                            {cat.rollover && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400'}`}><FontAwesomeIcon icon={faSyncAlt} className="mr-0.5 text-[8px]" />Rollover</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isOwner && !isViewer ? (
                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                    <button onClick={() => setShareTargetId(cat._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-emerald-100 text-emerald-500' : 'hover:bg-emerald-900/30 text-emerald-400'}`} title="Share">
                                        <FontAwesomeIcon icon={faUserFriends} className="text-[10px]" />
                                    </button>
                                    <button onClick={() => handleEditCategory(cat)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`} title="Edit">
                                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-900/30 text-red-400'}`} title="Delete">
                                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                    </button>
                                </div>
                                ) : null}
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expense categories yet.</p>
                )}
            </div></AnimateIn>

            {/* Income Categories */}
            <AnimateIn delay={200}><div className={`${card} p-5`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                    Income Categories ({incomeCats.length})
                </h4>
                {incomeCats.length > 0 ? (
                    <div className="space-y-2">
                        {incomeCats.map(cat => {
                            const isOwner = cat.user === currentUserId || cat.user?._id === currentUserId
                            return (
                            <div key={cat._id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    {cat.icon ? (
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                            <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} />
                                        </div>
                                    ) : (
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                        {!isOwner && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isLight ? 'bg-violet-50 text-violet-500' : 'bg-violet-900/20 text-violet-400'}`}>
                                                <FontAwesomeIcon icon={faUserFriends} className="mr-0.5 text-[7px]" />Shared
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isOwner && !isViewer ? (
                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditCategory(cat)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-900/30 text-red-400'}`}>
                                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                    </button>
                                </div>
                                ) : null}
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income categories yet.</p>
                )}
            </div></AnimateIn>

            {shareCategory && (
                <ShareCategoryModal
                    category={shareCategory}
                    isLight={isLight}
                    onClose={() => setShareTargetId(null)}
                    onShare={handleShareCategory}
                    onUnshare={handleUnshareCategory}
                />
            )}
        </div>
    )
})

// ==================== DEBT TAB ====================

const DebtTab = React.memo(({ debts, categories, dispatch, isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, formatCurrency, isLoading, PAYMENT_METHODS, isViewer, ownerParam = {}, showBalances = true, maskedBalance = '₱ ----' }) => {
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', type: 'owe', person: '', total_amount: '', due_date: '', notes: '' })
    const [paymentForm, setPaymentForm] = useState({ debtId: null, amount: '', notes: '', category: '', paymentMethod: 'Cash' })
    const [expandedId, setExpandedId] = useState(null)
    const [filterStatus, setFilterStatus] = useState('all')

    const resetForm = () => {
        setForm({ name: '', type: 'owe', person: '', total_amount: '', due_date: '', notes: '' })
        setEditing(null)
        setShowForm(false)
    }

    const handleSubmit = async () => {
        if (!form.name || !form.total_amount) return
        const data = { ...form, ...ownerParam, total_amount: parseFloat(form.total_amount) }
        try {
            if (editing) await dispatch(updateDebt({ ...data, id: editing })).unwrap()
            else await dispatch(createDebt(data)).unwrap()
            resetForm()
        } catch (err) { /* form kept open */ }
    }

    const handleEdit = (d) => {
        setForm({
            name: d.name, type: d.type, person: d.person || '',
            total_amount: d.total_amount.toString(),
            due_date: d.due_date ? new Date(d.due_date).toISOString().split('T')[0] : '',
            notes: d.notes || ''
        })
        setEditing(d._id)
        setShowForm(true)
    }

    const [deleteModal, setDeleteModal] = useState(null)

    const handleDelete = (id) => {
        setDeleteModal({ id, title: 'Delete Debt', message: 'Are you sure you want to delete this debt? All payment history will be lost.' })
    }

    const confirmDelete = async (id) => {
        await dispatch(deleteDebt({ id, ...ownerParam }))
        setDeleteModal(null)
    }

    const handlePayment = async () => {
        if (!paymentForm.amount || !paymentForm.debtId) return
        await dispatch(addDebtPayment({ id: paymentForm.debtId, amount: parseFloat(paymentForm.amount), notes: paymentForm.notes, category: paymentForm.category || null, paymentMethod: paymentForm.paymentMethod, ...ownerParam }))
        setPaymentForm({ debtId: null, amount: '', notes: '', category: '', paymentMethod: 'Cash' })
    }

    const handleRemovePayment = (debtId, paymentId) => {
        setDeleteModal({ type: 'payment', debtId, paymentId, title: 'Remove Payment', message: 'Are you sure you want to remove this payment record?' })
    }

    const confirmRemovePayment = async (debtId, paymentId) => {
        await dispatch(removeDebtPayment({ id: debtId, paymentId, ...ownerParam }))
        setDeleteModal(null)
    }

    const handleToggle = async (id) => {
        await dispatch(toggleDebtStatus({ id, ...ownerParam }))
    }

    const filtered = useMemo(() => {
        if (!debts) return []
        if (filterStatus === 'all') return debts
        return debts.filter(d => d.status === filterStatus)
    }, [debts, filterStatus])

    const totalOwed = debts?.filter(d => d.type === 'owe' && d.status === 'active').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0) || 0
    const totalOwedToYou = debts?.filter(d => d.type === 'owed' && d.status === 'active').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0) || 0
    const totalPaid = debts?.reduce((s, d) => s + (d.amount_paid || 0), 0) || 0
    const activeCount = debts?.filter(d => d.status === 'active').length || 0
    const paidCount = debts?.filter(d => d.status === 'paid').length || 0

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className="flex items-center justify-between mb-3"><div className={`h-3 w-20 ${pulse}`} /><div className={`w-8 h-8 rounded-lg ${pulse}`} /></div>
                            <div className={`h-6 w-28 ${pulse}`} />
                        </div>
                    ))}
                </div>
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-32 mb-4 ${pulse}`} />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1.5"><div className={`h-3 w-24 ${pulse}`} /><div className={`h-3 w-16 ${pulse}`} /></div>
                                <div className={`h-1.5 rounded-full ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const labelCls = `block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'You Owe', value: formatCurrency(totalOwed), icon: faArrowUp, color: 'red', isMoney: true },
                    { label: 'Owed to You', value: formatCurrency(totalOwedToYou), icon: faArrowDown, color: 'emerald', isMoney: true },
                    { label: 'Total Paid', value: formatCurrency(totalPaid), icon: faCheckCircle, color: 'blue', isMoney: true },
                    { label: 'Active / Paid', value: `${activeCount} / ${paidCount}`, icon: faHandHoldingUsd, color: 'violet' },
                ].map((s, i) => {
                    const colorMap = {
                        red: { icon: isLight ? 'text-red-600' : 'text-red-400', bg: isLight ? 'bg-red-50' : 'bg-red-900/20' },
                        emerald: { icon: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20' },
                        blue: { icon: isLight ? 'text-blue-600' : 'text-blue-400', bg: isLight ? 'bg-blue-50' : 'bg-blue-900/20' },
                        violet: { icon: isLight ? 'text-violet-600' : 'text-violet-400', bg: isLight ? 'bg-violet-50' : 'bg-violet-900/20' },
                    }
                    const cm = colorMap[s.color]
                    return (
                        <AnimateIn key={i} delay={i * 80}>
                            <div className={`${card} p-5`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cm.bg}`}>
                                        <FontAwesomeIcon icon={s.icon} className={`text-sm ${cm.icon}`} />
                                    </div>
                                </div>
                                <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    {s.isMoney ? <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{s.value}</BalanceAmount> : s.value}
                                </p>
                            </div>
                        </AnimateIn>
                    )
                })}
            </div>

            {/* Form */}
            {showForm && (
                <AnimateIn delay={0}><div className={`${card} p-5`}>
                    <h3 className={`text-sm font-semibold mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{editing ? 'Edit Debt' : 'New Debt'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Name *</label>
                            <input type="text" className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Car loan, Rent" />
                        </div>
                        <div>
                            <label className={labelCls}>Type</label>
                            <select className={`${selectCls} w-full`} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="owe">I Owe (Payable)</option>
                                <option value="owed">Owed to Me (Receivable)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Person / Entity</label>
                            <input type="text" className={inputCls} value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} placeholder="Who?" />
                        </div>
                        <div>
                            <label className={labelCls}>Total Amount *</label>
                            <input type="number" className={inputCls} value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
                        </div>
                        <div>
                            <label className={labelCls}>Due Date</label>
                            <input type="date" className={inputCls} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelCls}>Notes</label>
                            <input type="text" className={inputCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-solid" style={{ borderColor: isLight ? '#f1f5f9' : '#1f1f1f' }}>
                        <button onClick={resetForm} className={`${btnSecondary} text-xs px-3 py-1.5`}>Cancel</button>
                        <button onClick={handleSubmit} disabled={!form.name || !form.total_amount}
                            className={`${btnPrimary} text-xs px-3 py-1.5 disabled:opacity-50`}>
                            <FontAwesomeIcon icon={faCheck} className="text-[10px] mr-1.5" />
                            {editing ? 'Save Changes' : 'Add Debt'}
                        </button>
                    </div>
                </div></AnimateIn>
            )}

            {/* Debt List */}
            <AnimateIn delay={350}><div className={`${card} overflow-hidden`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-violet-100' : 'bg-violet-900/30'}`}>
                            <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-sm ${isLight ? 'text-violet-600' : 'text-violet-400'}`} />
                        </div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                            Debts
                            <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-gray-500'}`}>{debts?.length || 0}</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className={`${selectCls} text-xs py-1.5`}>
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="paid">Paid</option>
                        </select>
                        {!isViewer && <button onClick={() => { resetForm(); setShowForm(true) }}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                            <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Add Debt
                        </button>}
                    </div>
                </div>

                {filtered.length > 0 ? (
                    <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                        {filtered.map(debt => {
                            const remaining = debt.total_amount - debt.amount_paid
                            const pct = debt.total_amount > 0 ? Math.round((debt.amount_paid / debt.total_amount) * 100) : 0
                            const isPaid = debt.status === 'paid'
                            const isOverdue = debt.due_date && !isPaid && new Date(debt.due_date) < new Date()
                            const lastPaymentDate = debt.payments?.length > 0 ? new Date(debt.payments[debt.payments.length - 1].date) : null
                            const isPaidLate = isPaid && debt.due_date && lastPaymentDate && lastPaymentDate > new Date(debt.due_date)
                            const isExpanded = expandedId === debt._id
                            const isPaymentOpen = paymentForm.debtId === debt._id

                            return (
                                <div key={debt._id}>
                                    <div className={`px-5 py-3.5 transition-colors ${isLight ? 'hover:bg-slate-50/50' : 'hover:bg-[#111]'}`}>
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => handleToggle(debt._id)}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isPaid
                                                    ? (isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400')
                                                    : debt.type === 'owe'
                                                        ? (isLight ? 'bg-red-50 text-red-500' : 'bg-red-900/20 text-red-400')
                                                        : (isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400')
                                                }`} title={isPaid ? 'Mark as active' : 'Mark as paid'}>
                                                <FontAwesomeIcon icon={isPaid ? faCheckCircle : (debt.type === 'owe' ? faArrowUp : faArrowDown)} className="text-xs" />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                    <h4 className={`text-sm font-semibold ${isPaid ? 'line-through opacity-50' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{debt.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${debt.type === 'owe'
                                                            ? (isLight ? 'bg-red-50 text-red-500' : 'bg-red-900/20 text-red-400')
                                                            : (isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400')
                                                        }`}>{debt.type === 'owe' ? 'Payable' : 'Receivable'}</span>
                                                        {isPaid && !isPaidLate && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>Paid</span>}
                                                        {isPaidLate && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>Paid Late</span>}
                                                        {isOverdue && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>Overdue</span>}
                                                    </div>
                                                </div>
                                                <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {debt.person && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faUserFriends} className="text-[10px]" /> {debt.person}</span>}
                                                    {debt.due_date && <span className={`flex items-center gap-1 ${isOverdue ? 'text-amber-500' : ''}`}><FontAwesomeIcon icon={faCalendarCheck} className="text-[10px]" /> {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                                    {debt.notes && <span className="truncate max-w-[200px]">{debt.notes}</span>}
                                                </div>

                                                <div className="mt-2">
                                                    <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${Math.min(pct, 100)}%`, animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(debt.amount_paid)} / {formatCurrency(debt.total_amount)}</span>
                                                        <span className={`text-[10px] font-semibold ${pct >= 100 ? 'text-emerald-500' : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!isPaid && !isViewer && (
                                                    <button onClick={() => setPaymentForm(prev => prev.debtId === debt._id ? { debtId: null, amount: '', notes: '', category: '', paymentMethod: 'Cash' } : { debtId: debt._id, amount: '', notes: '', category: '', paymentMethod: 'Cash' })}
                                                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isPaymentOpen
                                                            ? (isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400')
                                                            : (isLight ? 'text-emerald-500 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-900/20')
                                                        }`} title="Add payment">
                                                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                                    </button>
                                                )}
                                                <button onClick={() => setExpandedId(isExpanded ? null : debt._id)}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-50' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'}`}
                                                    title="Payment history">
                                                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[10px]" />
                                                </button>
                                                {!isViewer && <>
                                                <button onClick={() => handleEdit(debt)}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-blue-500 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'}`}
                                                    title="Edit">
                                                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                </button>
                                                <button onClick={() => handleDelete(debt._id)}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`} title="Delete">
                                                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                </button>
                                                </>}
                                            </div>
                                        </div>

                                        {/* Payment form inline */}
                                        {isPaymentOpen && (
                                            <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Amount *</label>
                                                        <input type="number" className={`${inputCls} text-xs`} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                            placeholder={`Remaining: ${formatCurrency(remaining)}`} min="0" step="0.01" />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payment Method</label>
                                                        <select className={`${selectCls} w-full text-xs`} value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
                                                        <select className={`${selectCls} w-full text-xs`} value={paymentForm.category} onChange={e => setPaymentForm({ ...paymentForm, category: e.target.value })}>
                                                            <option value="">Uncategorized</option>
                                                            {categories.filter(c => c.type === (debt.type === 'owe' ? 'expense' : 'income')).map(c => (
                                                                <option key={c._id} value={c._id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Notes</label>
                                                        <input type="text" className={`${inputCls} text-xs`} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Optional" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button onClick={handlePayment} disabled={!paymentForm.amount}
                                                        className={`${btnPrimary} text-xs px-3 py-2 disabled:opacity-50 whitespace-nowrap`}>
                                                        <FontAwesomeIcon icon={faCheck} className="text-[10px] mr-1" /> Record Payment
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment history (expanded) */}
                                    {isExpanded && (
                                        <div className={`px-5 pb-3 ${isLight ? 'bg-slate-50/50' : 'bg-[#0a0a0a]'}`}>
                                            {debt.payments?.length > 0 ? (
                                                <div className={`rounded-lg overflow-hidden border border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#111] text-gray-500'}`}>
                                                        Payment History ({debt.payments.length})
                                                    </div>
                                                    {debt.payments.slice().reverse().map((p, pi) => (
                                                        <div key={p._id || pi} className={`flex items-center justify-between px-3 py-2 text-xs ${pi > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : `border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`} ${isLight ? 'bg-white' : 'bg-[#0e0e0e]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>
                                                                    {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                {p.notes && <span className={`${isLight ? 'text-slate-300' : 'text-gray-600'}`}>· {p.notes}</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-emerald-500">{formatCurrency(p.amount)}</span>
                                                                {!isViewer && <button onClick={() => handleRemovePayment(debt._id, p._id)}
                                                                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isLight ? 'text-red-400 hover:text-red-500 hover:bg-red-50' : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'}`}>
                                                                    <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
                                                                </button>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={`text-xs text-center py-4 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No payments recorded yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-5">
                        <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                            {filterStatus !== 'all' ? 'No debts match this filter.' : 'No debts tracked yet.'}
                        </p>
                        <p className={`text-xs mt-1 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>
                            {filterStatus !== 'all' ? 'Try a different filter.' : 'Click "Add Debt" to start tracking.'}
                        </p>
                    </div>
                )}
            </div></AnimateIn>

            {deleteModal && (
                <DeleteConfirmModal isLight={isLight} title={deleteModal.title} message={deleteModal.message} onCancel={() => setDeleteModal(null)} onConfirm={() => {
                    if (deleteModal.type === 'payment') confirmRemovePayment(deleteModal.debtId, deleteModal.paymentId)
                    else confirmDelete(deleteModal.id)
                }} />
            )}
        </div>
    )
})

// ==================== LISTS TAB ====================

const LIST_COLORS = [...CATEGORY_COLORS, '#84cc16', '#f43f5e']

const LIST_CURRENCIES = [
    ...CURRENCIES.map(c => ({ symbol: c.symbol, label: `${c.code} (${c.symbol})` })),
    { symbol: 'Fr', label: 'CHF (Fr)' },
    { symbol: 'R$', label: 'BRL (R$)' },
]

const formatListAmount = (v, list) => {
    const num = v || 0
    const show = list?.showCurrency !== false
    const sym = list?.currency || '₱'
    if (show) return `${sym}${num.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return Math.round(num).toLocaleString('en')
}

const LIST_ICONS = [
    'peso-sign','dollar-sign','money-bill-wave','coins','piggy-bank','wallet','credit-card','chart-line','chart-bar','calculator',
    'arrow-up','arrow-down','plus','minus','exchange-alt','hand-holding-usd','money-check-alt','receipt','file-invoice-dollar','cash-register',
    'shopping-cart','shopping-bag','store','tags','tag','box','gift','truck','home','building',
    'utensils','coffee','pizza-slice','hamburger','apple-alt','wine-glass','beer','ice-cream','cookie','bread-slice',
    'car','bus','plane','gas-pump','taxi','motorcycle','bicycle','subway','ship','helicopter',
    'tshirt','shoe-prints','glasses','hat-cowboy','gem','crown','ring','vest','mitten','socks',
    'laptop','desktop','mobile-alt','tablet-alt','keyboard','mouse','headphones','tv','gamepad','wifi',
    'book','graduation-cap','school','pencil-alt','pen','ruler','chalkboard','globe','microscope','flask',
    'heartbeat','medkit','pills','stethoscope','tooth','eye','brain','lungs','dumbbell','running',
    'bolt','lightbulb','fire','water','leaf','seedling','tree','sun','moon','cloud',
    'wrench','tools','hammer','screwdriver','paint-roller','paint-brush','broom','key','lock','shield-alt',
    'music','guitar','drum','microphone','film','camera','palette','theater-masks','puzzle-piece','dice',
    'baby','dog','cat','horse','fish','dove','paw','bone','star','heart',
    'bell','flag','bookmark','trophy','medal','award','phone','envelope','paper-plane','comments',
]

const SafeIcon = SafeIconShared

const ListIconPicker = ({ value, onChange, isLight }) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = useMemo(() => {
        if (!search) return LIST_ICONS
        const q = search.toLowerCase()
        return LIST_ICONS.filter(n => n.includes(q))
    }, [search])

    return (
        <div className="relative" ref={ref}>
            <button type="button" onClick={() => { setOpen(!open); setSearch('') }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-solid transition-all ${
                    open
                        ? (isLight ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-100' : 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-900/30')
                        : (isLight ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-[#333] bg-[#1a1a1a] hover:border-[#444]')
                }`}
            >
                <SafeIcon name={value} cls={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-300'}`} />
            </button>

            {open && (
                <div className={`absolute z-50 mt-1.5 left-0 rounded-xl border border-solid shadow-xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}
                    style={{ width: 'min(300px, calc(100vw - 3rem))' }}>
                    <div className={`px-3 py-2 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'}`}>
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} autoFocus
                                placeholder="Search icons..."
                                className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-xs border border-solid outline-none ${isLight ? 'bg-white border-slate-200 focus:border-blue-400 text-slate-700' : 'bg-[#1a1a1a] border-[#333] focus:border-blue-500 text-gray-200'}`}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-44 p-2">
                        {filtered.length > 0 ? (
                            <div className="grid grid-cols-8 gap-0.5">
                                {filtered.map(name => (
                                    <button key={name} type="button" title={name}
                                        onClick={() => { onChange(name); setOpen(false) }}
                                        className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                                            value === name
                                                ? (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                                                : (isLight ? 'text-slate-500 hover:bg-blue-50 hover:text-blue-600' : 'text-gray-400 hover:bg-blue-900/20 hover:text-blue-400')
                                        }`}>
                                        <SafeIcon name={name} cls="text-xs" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-center py-4 text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No icons found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const ListsTab = React.memo(({ budgetLists, dispatch, isLight, card, inputCls, btnPrimary, btnSecondary, isLoading, isViewer, ownerParam = {} }) => {
    const [showForm, setShowForm] = useState(false)
    const [editingList, setEditingList] = useState(null)
    const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6', icon: 'peso-sign', currency: '₱', showCurrency: true, items: [] })
    const [newItemName, setNewItemName] = useState('')
    const [newItemAmount, setNewItemAmount] = useState('')
    const [newItemType, setNewItemType] = useState('subtract')
    const [deleteModal, setDeleteModal] = useState(null)
    const [expandedList, setExpandedList] = useState(null)
    const [editingItem, setEditingItem] = useState(null)
    const [editItemForm, setEditItemForm] = useState({ name: '', amount: '', type: 'subtract', notes: '' })

    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const resetForm = () => {
        setForm({ name: '', description: '', color: '#3b82f6', icon: 'peso-sign', currency: '₱', showCurrency: true, items: [] })
        setEditingList(null)
        setShowForm(false)
        setNewItemName('')
        setNewItemAmount('')
        setNewItemType('subtract')
    }

    const openEdit = (list) => {
        setForm({
            name: list.name,
            description: list.description || '',
            color: list.color || '#3b82f6',
            icon: list.icon || 'peso-sign',
            currency: list.currency || '₱',
            showCurrency: list.showCurrency !== false,
            items: list.items?.map(i => ({ ...i })) || []
        })
        setEditingList(list._id)
        setShowForm(true)
    }

    const addItem = () => {
        if (!newItemName.trim()) return
        setForm(f => ({
            ...f,
            items: [...f.items, { name: newItemName.trim(), amount: parseFloat(newItemAmount) || 0, type: newItemType, checked: false, notes: '' }]
        }))
        setNewItemName('')
        setNewItemAmount('')
    }

    const removeItem = (idx) => {
        setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
    }

    const handleSubmit = async () => {
        if (!form.name.trim()) return
        try {
            if (editingList) await dispatch(updateBudgetList({ id: editingList, ...form, ...ownerParam })).unwrap()
            else await dispatch(createBudgetList({ ...form, ...ownerParam })).unwrap()
            resetForm()
        } catch (err) { /* form kept open */ }
    }

    const handleDelete = (id) => {
        setDeleteModal({ id, title: 'Delete List', message: 'Are you sure you want to delete this list? All items will be permanently removed.' })
    }

    const confirmDelete = async (id) => {
        await dispatch(deleteBudgetList({ id, ...ownerParam }))
        setDeleteModal(null)
        if (expandedList === id) setExpandedList(null)
    }

    const listPayload = (list, items) => ({ id: list._id, name: list.name, description: list.description, color: list.color, icon: list.icon, currency: list.currency, showCurrency: list.showCurrency, items, ...ownerParam })

    const toggleItemCheck = async (list, itemIdx) => {
        const updatedItems = list.items.map((it, i) => i === itemIdx ? { ...it, checked: !it.checked } : { ...it })
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
    }

    const startEditItem = (listId, itemIdx, item) => {
        setEditingItem({ listId, itemIdx })
        setEditItemForm({ name: item.name, amount: item.amount?.toString() || '0', type: item.type || 'subtract', notes: item.notes || '' })
    }

    const saveEditItem = async (list) => {
        if (!editingItem) return
        const updatedItems = list.items.map((it, i) =>
            i === editingItem.itemIdx
                ? { ...it, name: editItemForm.name, amount: parseFloat(editItemForm.amount) || 0, type: editItemForm.type, notes: editItemForm.notes }
                : { ...it }
        )
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
        setEditingItem(null)
    }

    const deleteItemFromList = async (list, itemIdx) => {
        const updatedItems = list.items.filter((_, i) => i !== itemIdx)
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
    }

    const quickAddItem = async (list, name, amount, type) => {
        if (!name.trim()) return
        const updatedItems = [...list.items.map(i => ({ ...i })), { name: name.trim(), amount: parseFloat(amount) || 0, type: type || 'subtract', checked: false, notes: '' }]
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
    }

    const getListStats = (list) => {
        const items = list.items || []
        const total = items.length
        const checked = items.filter(i => i.checked).length
        const addTotal = items.filter(i => (i.type || 'subtract') === 'add').reduce((s, i) => s + (i.amount || 0), 0)
        const subtractTotal = items.filter(i => (i.type || 'subtract') === 'subtract').reduce((s, i) => s + (i.amount || 0), 0)
        const net = addTotal - subtractTotal
        return { total, checked, addTotal, subtractTotal, net, pct: total > 0 ? Math.round((checked / total) * 100) : 0 }
    }

    if (isLoading && budgetLists.length === 0) {
        return (
            <div className="space-y-4">
                <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`h-5 w-32 ${pulse}`} />
                        <div className={`h-8 w-24 rounded-lg ${pulse}`} />
                    </div>
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`${card} overflow-hidden`}>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                                <div className="flex-1 space-y-1.5">
                                    <div className={`h-4 w-36 ${pulse}`} />
                                    <div className={`h-2.5 w-48 ${pulse}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[...Array(3)].map((_, j) => <div key={j} className={`h-14 rounded-lg ${pulse}`} />)}
                            </div>
                        </div>
                        <div className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className={`flex items-center gap-3 px-5 py-3 ${j > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : ''}`}>
                                    <div className={`w-5 h-5 rounded ${pulse}`} />
                                    <div className={`h-3 flex-1 ${pulse}`} />
                                    <div className={`h-3 w-16 ${pulse}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <AnimateIn delay={0}><div className={`${card} p-4 sm:p-5`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Budget Lists</h2>
                        <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                            {budgetLists.length} list{budgetLists.length !== 1 ? 's' : ''}
                            {budgetLists.length > 0 && (() => {
                                const allNet = budgetLists.reduce((s, l) => s + getListStats(l).net, 0)
                                return <> · Net: <span className={allNet >= 0 ? 'text-emerald-500' : 'text-red-500'}>{allNet >= 0 ? '+' : ''}{Math.round(allNet).toLocaleString('en')}</span></>
                            })()}
                        </p>
                    </div>
                    {!isViewer && <button
                        onClick={() => { resetForm(); setShowForm(true) }}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                        New List
                    </button>}
                </div>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className={`${card} p-4 sm:p-5`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {editingList ? 'Edit List' : 'New List'}
                    </h3>
                    <div className="space-y-3">
                        <input type="text" placeholder="List name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                        <input type="text" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />

                        {/* Icon & Color */}
                        <div className="flex gap-4">
                            <div>
                                <label className={`text-[11px] font-medium mb-1.5 block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Icon</label>
                                <ListIconPicker value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} isLight={isLight} />
                            </div>
                            <div className="flex-1">
                                <label className={`text-[11px] font-medium mb-1.5 block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Color</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {LIST_COLORS.map(c => (
                                        <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                                            className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: c, ringColor: c, '--tw-ring-offset-color': isLight ? '#fff' : '#0e0e0e' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className={`text-[11px] font-medium mb-1.5 block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Currency</label>
                                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                                    className={`w-full px-3 py-2 rounded-lg text-xs border border-solid outline-none transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 focus:border-blue-400 text-slate-800' : 'bg-[#1a1a1a] border-[#333] focus:border-blue-500 text-gray-200'}`}>
                                    {LIST_CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                                </select>
                            </div>
                            <button type="button" onClick={() => setForm(f => ({ ...f, showCurrency: !f.showCurrency }))}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-solid transition-all ${
                                    form.showCurrency
                                        ? (isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-900/20 border-blue-800/40 text-blue-400')
                                        : (isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#1a1a1a] border-[#333] text-gray-400')
                                }`}
                                title={form.showCurrency ? 'Currency visible — amounts show symbol and decimals' : 'Currency hidden — amounts show integers only'}
                            >
                                <FontAwesomeIcon icon={form.showCurrency ? faEye : faEyeSlash} className="text-[10px]" />
                                {form.showCurrency ? 'Shown' : 'Hidden'}
                            </button>
                        </div>

                        {/* Items */}
                        <div>
                            <label className={`text-[11px] font-medium mb-1.5 block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Items ({form.items.length})</label>
                            {form.items.length > 0 && (
                                <div className={`rounded-lg border border-solid mb-2 divide-y ${isLight ? 'border-slate-200 divide-slate-100' : 'border-[#2B2B2B] divide-[#1f1f1f]'}`}>
                                    {form.items.map((item, idx) => {
                                        const t = item.type || 'subtract'
                                        return (
                                            <div key={idx} className="flex items-center gap-2.5 px-3 py-2">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${t === 'add' ? (isLight ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-900/20 text-emerald-400') : (isLight ? 'bg-red-50 text-red-500' : 'bg-red-900/20 text-red-400')}`}>
                                                    <SafeIcon name={form.icon || 'peso-sign'} cls="text-[10px] font-bold" />
                                                </div>
                                                <span className={`text-xs flex-1 min-w-0 truncate ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{item.name}</span>
                                                <span className={`text-xs font-medium tabular-nums w-28 text-right flex-shrink-0 ${t === 'add' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {t === 'add' ? '+' : '-'}{formatListAmount(item.amount || 0, form)}
                                                </span>
                                                <button onClick={() => removeItem(idx)} className={`p-0.5 transition-colors flex-shrink-0 ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
                                                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="text" placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addItem()} className={`${inputCls} !w-auto flex-1 min-w-0 !py-1.5 !text-xs`} />
                                <input type="number" placeholder="Amount" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addItem()} className={`${inputCls} !w-28 !py-1.5 !text-xs`} />
                                <button
                                    onClick={() => setNewItemType(t => t === 'subtract' ? 'add' : 'subtract')}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border border-solid ${
                                        newItemType === 'add'
                                            ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400')
                                            : (isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-900/20 border-red-800/40 text-red-400')
                                    }`}
                                    title={newItemType === 'add' ? 'Income (+)' : 'Expense (-)'}
                                >
                                    <FontAwesomeIcon icon={newItemType === 'add' ? faPlus : faMinus} className="text-[10px]" />
                                </button>
                                <button onClick={addItem} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-400'}`}>
                                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={handleSubmit} className={btnPrimary}>
                                <FontAwesomeIcon icon={faCheck} className="text-xs mr-1.5" />
                                {editingList ? 'Update' : 'Create'}
                            </button>
                            <button onClick={resetForm} className={btnSecondary}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}</AnimateIn>

            {/* Lists */}
            {budgetLists.length === 0 && !showForm ? (
                <div className={`${card} p-8 text-center`}>
                    <FontAwesomeIcon icon={faListAlt} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                    <p className={`text-sm font-medium mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No lists yet</p>
                    <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Create a budget list to plan and track purchases, goals, or wishlists.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {budgetLists.map((list, listIdx) => {
                        const stats = getListStats(list)
                        const isExpanded = expandedList === list._id
                        return (
                            <AnimateIn key={list._id} delay={listIdx * 100}>
                            <div className={`${card} overflow-hidden`}>
                                <div className="relative">
                                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: list.color || '#3b82f6' }} />
                                    <div className="p-4 sm:p-5 pt-5 sm:pt-6">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${list.color || '#3b82f6'}20` }}>
                                                    <SafeIcon name={list.icon || 'peso-sign'} cls="text-sm" style={{ color: list.color || '#3b82f6' }} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{list.name}</h3>
                                                    {list.description && <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{list.description}</p>}
                                                </div>
                                            </div>
                                            {!isViewer && <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => openEdit(list)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                </button>
                                                <button onClick={() => handleDelete(list._id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-900/20 text-red-400'}`}>
                                                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                </button>
                                            </div>}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <div className={`rounded-lg p-2.5 sm:p-3 ${isLight ? 'bg-emerald-50/70' : 'bg-emerald-900/10'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FontAwesomeIcon icon={faArrowUp} className="text-[10px] text-emerald-500" />
                                                    <span className={`text-[10px] font-medium ${isLight ? 'text-emerald-600/70' : 'text-emerald-400/70'}`}>Income</span>
                                                </div>
                                                <p className="text-xs sm:text-sm font-bold text-emerald-500">{formatListAmount(stats.addTotal, list)}</p>
                                            </div>
                                            <div className={`rounded-lg p-2.5 sm:p-3 ${isLight ? 'bg-red-50/70' : 'bg-red-900/10'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FontAwesomeIcon icon={faArrowDown} className="text-[10px] text-red-500" />
                                                    <span className={`text-[10px] font-medium ${isLight ? 'text-red-600/70' : 'text-red-400/70'}`}>Expense</span>
                                                </div>
                                                <p className="text-xs sm:text-sm font-bold text-red-500">{formatListAmount(stats.subtractTotal, list)}</p>
                                            </div>
                                            <div className={`rounded-lg p-2.5 sm:p-3 ${isLight ? 'bg-slate-50' : 'bg-[#151515]'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FontAwesomeIcon icon={faWallet} className={`text-[10px] ${stats.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                                                    <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500/70' : 'text-gray-400/70'}`}>Net</span>
                                                </div>
                                                <p className={`text-xs sm:text-sm font-bold ${stats.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {stats.net >= 0 ? '+' : ''}{formatListAmount(stats.net, list)}
                                                </p>
                                            </div>
                                        </div>

                                        {stats.total > 0 && (
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1f1f1f]'}`}>
                                                    <div className="h-full rounded-full" style={{ width: `${stats.pct}%`, backgroundColor: list.color || '#3b82f6', animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                                                </div>
                                                <span className={`text-[10px] font-medium flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{stats.checked}/{stats.total} done</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Items table */}
                                <div className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                    {list.items?.length > 0 ? (
                                        <>
                                            <div className={`divide-y ${isLight ? 'divide-slate-50' : 'divide-[#1a1a1a]'}`}>
                                                {(isExpanded ? list.items : list.items.slice(0, 5)).map((item, idx) => {
                                                    const itemType = item.type || 'subtract'
                                                    const isItemEditing = editingItem?.listId === list._id && editingItem?.itemIdx === idx
                                                    return (
                                                        <div key={idx} className={`flex items-center gap-2.5 mx-4 sm:mx-5 mb-1.5 px-3 py-2.5 rounded-lg group transition-colors ${
                                                            item.checked
                                                                ? (isLight ? 'bg-slate-50 border border-solid border-slate-100 opacity-60' : 'bg-[#0a0a0a] border border-solid border-[#1a1a1a] opacity-60')
                                                                : itemType === 'add'
                                                                    ? (isLight ? 'bg-emerald-50/80 border border-solid border-emerald-100 hover:border-emerald-200' : 'bg-emerald-900/10 border border-solid border-emerald-900/30 hover:border-emerald-800/50')
                                                                    : (isLight ? 'bg-red-50/80 border border-solid border-red-100 hover:border-red-200' : 'bg-red-900/10 border border-solid border-red-900/30 hover:border-red-800/50')
                                                        }`}>
                                                            <button onClick={() => toggleItemCheck(list, idx)}
                                                                className={`w-[18px] h-[18px] rounded flex items-center justify-center border border-solid transition-all flex-shrink-0 ${
                                                                    item.checked ? 'border-transparent text-white' : (isLight ? 'border-slate-300 hover:border-blue-400' : 'border-[#444] hover:border-blue-500')
                                                                }`}
                                                                style={item.checked ? { backgroundColor: list.color || '#3b82f6' } : {}}
                                                            >
                                                                {item.checked && <FontAwesomeIcon icon={faCheck} className="text-[8px]" />}
                                                            </button>

                                                            {isItemEditing ? (
                                                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                    <input type="text" value={editItemForm.name} onChange={e => setEditItemForm(f => ({ ...f, name: e.target.value }))}
                                                                        onKeyDown={e => e.key === 'Enter' && saveEditItem(list)} className={`${inputCls} !w-auto flex-1 min-w-0 !py-1.5 !text-xs`} autoFocus />
                                                                    <input type="number" value={editItemForm.amount} onChange={e => setEditItemForm(f => ({ ...f, amount: e.target.value }))}
                                                                        onKeyDown={e => e.key === 'Enter' && saveEditItem(list)} className={`${inputCls} !w-28 !py-1.5 !text-xs`} />
                                                                    <button
                                                                        onClick={() => setEditItemForm(f => ({ ...f, type: f.type === 'add' ? 'subtract' : 'add' }))}
                                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border border-solid ${
                                                                            editItemForm.type === 'add'
                                                                                ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400')
                                                                                : (isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-900/20 border-red-800/40 text-red-400')
                                                                        }`}
                                                                    >
                                                                        <FontAwesomeIcon icon={editItemForm.type === 'add' ? faPlus : faMinus} className="text-[10px]" />
                                                                    </button>
                                                                    <button onClick={() => saveEditItem(list)} className="text-emerald-500 hover:text-emerald-600 p-0.5 flex-shrink-0">
                                                                        <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                                                                    </button>
                                                                    <button onClick={() => setEditingItem(null)} className="text-red-400 hover:text-red-500 p-0.5 flex-shrink-0">
                                                                        <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                                                        itemType === 'add'
                                                                            ? (isLight ? 'bg-emerald-100 text-emerald-500' : 'bg-emerald-900/30 text-emerald-400')
                                                                            : (isLight ? 'bg-red-100 text-red-500' : 'bg-red-900/30 text-red-400')
                                                                    }`}>
                                                                        <SafeIcon name={list.icon || 'peso-sign'} cls="text-xs font-bold" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className={`text-xs font-medium block truncate transition-all ${item.checked ? 'line-through' : ''} ${
                                                                            item.checked
                                                                                ? (isLight ? 'text-slate-400' : 'text-gray-500')
                                                                                : itemType === 'add'
                                                                                    ? (isLight ? 'text-emerald-700' : 'text-emerald-300')
                                                                                    : (isLight ? 'text-red-700' : 'text-red-300')
                                                                        }`}>
                                                                            {item.name}
                                                                        </span>
                                                                        {item.notes && <p className={`text-xs truncate ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>{item.notes}</p>}
                                                                    </div>
                                                                    <span className={`text-xs font-bold tabular-nums w-28 text-right flex-shrink-0 ${item.checked ? 'opacity-40 line-through' : ''} ${itemType === 'add' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                        {itemType === 'add' ? '+' : '-'}{formatListAmount(item.amount || 0, list)}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex-shrink-0">
                                                                        <button onClick={() => startEditItem(list._id, idx, item)} className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                                            <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                                        </button>
                                                                        <button onClick={() => deleteItemFromList(list, idx)} className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-900/20 text-red-400'}`}>
                                                                            <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {list.items.length > 5 && (
                                                <button onClick={() => setExpandedList(isExpanded ? null : list._id)}
                                                    className={`w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition-all border-t border-solid ${isLight ? 'border-slate-50 text-slate-400 hover:bg-slate-50 hover:text-slate-600' : 'border-[#1a1a1a] text-gray-500 hover:bg-[#111] hover:text-gray-300'}`}>
                                                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[10px]" />
                                                    {isExpanded ? 'Show less' : `Show ${list.items.length - 5} more`}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className={`px-5 py-4 text-center text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No items — add one below</div>
                                    )}
                                    <QuickAddItem list={list} quickAddItem={quickAddItem} isLight={isLight} inputCls={inputCls} />
                                </div>
                            </div>
                            </AnimateIn>
                        )
                    })}
                </div>
            )}
        </div>
    )
})

const QuickAddItem = ({ list, quickAddItem, isLight, inputCls }) => {
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState('subtract')

    const handleAdd = async () => {
        if (!name.trim()) return
        await quickAddItem(list, name, amount, type)
        setName('')
        setAmount('')
    }

    return (
        <div className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 border-t border-solid ${isLight ? 'border-slate-100 bg-slate-50/30' : 'border-[#1f1f1f] bg-[#090909]'}`}>
            <input type="text" placeholder="Add item..." value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} className={`${inputCls} !w-auto flex-1 min-w-0 !py-1.5 !text-xs`} />
            <input type="number" placeholder="₱" value={amount} onChange={e => setAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} className={`${inputCls} !w-28 !py-1.5 !text-xs`} />
            <button onClick={() => setType(t => t === 'subtract' ? 'add' : 'subtract')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border border-solid ${
                    type === 'add'
                        ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400')
                        : (isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-900/20 border-red-800/40 text-red-400')
                }`}
                title={type === 'add' ? 'Income (+)' : 'Expense (-)'}
            >
                <FontAwesomeIcon icon={type === 'add' ? faPlus : faMinus} className="text-[10px]" />
            </button>
            <button onClick={handleAdd} className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
            </button>
        </div>
    )
}

// ==================== SUMMARY TAB ====================

const SummaryTab = React.memo(({ dashboard, expenses, categories, monthlyBudgetData, groupedByDate, month, year, isLight, card, formatCurrency, formatCurrencyRaw, statusColor, paymentIcon, isLoading, activeViewCurrency, toTargetCurrency, ytdData, ytdLoading, debts, showBalances = true, maskedBalance = '₱ ----' }) => {
    const [downloading, setDownloading] = useState(false)
    const [pdfError, setPdfError] = useState('')
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const handleDownloadPDF = async () => {
        if (downloading) return
        setDownloading(true)
        setPdfError('')

        try {
            const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
            const pdfCurrency = (v, code = activeViewCurrency) => formatPdfAmount(v, code)
            const active = expenses.filter(e => !e.listOnly)
            const totalIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
            const totalExpenses = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
            const balance = totalIncome - totalExpenses
            const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
            const remainingBudget = totalBudget - totalExpenses
            const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0
            const daysInMonth = new Date(year, month, 0).getDate()
            const dailyAvg = active.length > 0 ? totalExpenses / daysInMonth : 0

            const expenseCats = categories.filter(c => c.type === 'expense')
            const incomeCats = categories.filter(c => c.type === 'income')

            const catSpending = expenseCats.map(cat => {
                const spent = active.filter(e => e.category?._id === cat._id && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                return { ...cat, spent }
            }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent)

            const catIncome = incomeCats.map(cat => {
                const earned = active.filter(e => e.category?._id === cat._id && e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                return { ...cat, earned }
            }).filter(c => c.earned > 0).sort((a, b) => b.earned - a.earned)

            const paymentMap = {}
            active.filter(e => e.type === 'expense').forEach(e => {
                const m = e.paymentMethod || 'Cash'
                if (!paymentMap[m]) paymentMap[m] = 0
                paymentMap[m] += convert(e.amount, e.currency)
            })
            const sortedPayments = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])

            const expenseRows = catSpending.map(cat => ({
                label: sanitizePdfText(cat.name),
                value: pdfCurrency(cat.spent),
                sub: totalExpenses > 0 ? `${Math.round((cat.spent / totalExpenses) * 100)}% of expenses` : undefined,
            }))

            const incomeRows = catIncome.map(cat => ({
                label: sanitizePdfText(cat.name),
                value: pdfCurrency(cat.earned),
                sub: totalIncome > 0 ? `${Math.round((cat.earned / totalIncome) * 100)}% of income` : undefined,
            }))

            const budgetTable = monthlyBudgetData.length > 0 ? {
                rows: monthlyBudgetData.map(cat => [
                    sanitizePdfText(cat.name),
                    pdfCurrency(cat.budget),
                    pdfCurrency(cat.spent),
                    pdfCurrency(cat.remaining),
                    cat.budget > 0 ? `${cat.percentage}%` : '—',
                ]),
                rowMeta: monthlyBudgetData.map(cat => ({
                    remaining: cat.remaining,
                    percentage: cat.percentage,
                    budget: cat.budget,
                })),
                foot: [
                    'Total',
                    pdfCurrency(totalBudget),
                    pdfCurrency(totalExpenses),
                    pdfCurrency(remainingBudget),
                    `${budgetUsedPct}%`,
                ],
            } : null

            const paymentRows = sortedPayments.map(([method, amount]) => [
                sanitizePdfText(method),
                pdfCurrency(amount),
                totalExpenses > 0 ? `${Math.round((amount / totalExpenses) * 100)}%` : '—',
            ])

            const ytdCards = ytdData && !ytdLoading ? [
                { label: 'YTD Income', value: pdfCurrency(ytdData.ytdIncome), tone: 'emerald' },
                { label: 'YTD Expenses', value: pdfCurrency(ytdData.ytdExpense), tone: 'red' },
                { label: 'Net Balance', value: pdfCurrency(ytdData.ytdBalance), tone: ytdData.ytdBalance >= 0 ? 'blue' : 'red' },
                { label: 'Monthly Avg', value: pdfCurrency(ytdData.monthlyAvg), tone: 'amber' },
            ] : null

            const ytdMonthlyRows = ytdData?.monthlyBreakdown
                ? Array.from({ length: month }, (_, i) => {
                    const data = ytdData.monthlyBreakdown[i] || { income: 0, expense: 0, count: 0 }
                    const net = data.income - data.expense
                    return [
                        MONTHS[i].slice(0, 3),
                        data.income > 0 ? pdfCurrency(data.income) : '—',
                        data.expense > 0 ? pdfCurrency(data.expense) : '—',
                        data.count > 0 ? pdfCurrency(net) : '—',
                        data.count || '—',
                    ]
                })
                : null

            const ytdMonthlyFoot = ytdData ? [
                'Total',
                pdfCurrency(ytdData.ytdIncome),
                pdfCurrency(ytdData.ytdExpense),
                pdfCurrency(ytdData.ytdBalance),
                String(ytdData.ytdTxCount ?? '—'),
            ] : null

            const ytdTopCategories = ytdData?.topCategories?.length
                ? ytdData.topCategories.map(cat => ({
                    label: sanitizePdfText(cat.name),
                    value: pdfCurrency(cat.amount),
                    sub: ytdData.ytdExpense > 0 ? `${Math.round((cat.amount / ytdData.ytdExpense) * 100)}%` : undefined,
                }))
                : null

            const activeDebts = (debts || []).filter(d => d.status === 'active' && d.amount_paid < d.total_amount)

            const dailyData = {}
            active.filter(e => e.type === 'expense').forEach(e => {
                const day = new Date(e.date).getDate()
                dailyData[day] = (dailyData[day] || 0) + convert(e.amount, e.currency)
            })
            const dailySpendingChart = Array.from({ length: daysInMonth }, (_, i) => ({
                label: String(i + 1),
                value: dailyData[i + 1] || 0,
            }))

            const transactionRows = []
            const transactionRowMeta = []
            const txnGroupFill = isLight ? [241, 245, 249] : [10, 10, 10]
            groupedByDate.forEach(([date, group]) => {
                transactionRows.push([{
                    content: sanitizePdfText(date),
                    colSpan: 5,
                    styles: { fillColor: txnGroupFill, fontStyle: 'bold', fontSize: 7 },
                }])
                transactionRowMeta.push({ isGroup: true })
                group.items.forEach(e => {
                    const fromCur = e.currency || 'PHP'
                    const converted = fromCur !== activeViewCurrency ? toTargetCurrency(e.amount, fromCur, activeViewCurrency) : null
                    const prefix = e.type === 'income' ? '+' : '-'
                    const amount = converted !== null
                        ? `${prefix}${pdfCurrency(converted)} (${prefix}${pdfCurrency(e.amount, fromCur)})`
                        : `${prefix}${pdfCurrency(e.amount, fromCur)}`
                    const rawDesc = e.description || '—'
                    const desc = sanitizePdfText(rawDesc)
                    const isDebt = /^debt\s*:/i.test(rawDesc)
                    transactionRows.push([
                        sanitizePdfText(new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                        e.listOnly ? `${desc} [LIST]` : desc,
                        sanitizePdfText(e.category?.name || 'Uncategorized'),
                        sanitizePdfText(e.paymentMethod || 'Cash'),
                        amount,
                    ])
                    transactionRowMeta.push({
                        type: e.type,
                        isDebt,
                        listOnly: !!e.listOnly,
                    })
                })
            })

            await generateBudgetSummaryPdf({
                theme: isLight ? 'light' : 'dark',
                filename: `Budget_Summary_${MONTHS[month - 1]}_${year}.pdf`,
                monthLabel: MONTHS[month - 1],
                year,
                currency: activeViewCurrency,
                overviewCards: [
                    { label: 'Total Income', value: pdfCurrency(totalIncome), tone: 'emerald' },
                    { label: 'Total Expenses', value: pdfCurrency(totalExpenses), tone: 'red' },
                    { label: 'Net Balance', value: pdfCurrency(balance), tone: balance >= 0 ? 'blue' : 'red' },
                    { label: 'Budget Used', value: totalBudget > 0 ? `${budgetUsedPct}%` : '—', tone: budgetUsedPct >= 100 ? 'red' : budgetUsedPct >= 80 ? 'amber' : 'emerald' },
                ],
                quickStats: [
                    { label: 'Transactions', value: String(active.length) },
                    { label: 'Total Budget', value: pdfCurrency(totalBudget) },
                    { label: 'Daily Average', value: pdfCurrency(dailyAvg) },
                    { label: 'Remaining', value: pdfCurrency(remainingBudget), tone: remainingBudget >= 0 ? 'emerald' : 'red' },
                ],
                expenseChart: catSpending.slice(0, 8).map(c => ({
                    label: c.name,
                    value: c.spent,
                    color: c.color,
                })),
                incomeChart: catIncome.slice(0, 8).map(c => ({
                    label: c.name,
                    value: c.earned,
                    color: c.color,
                })),
                paymentChart: sortedPayments.map(([method, amount]) => ({
                    label: method,
                    value: amount,
                })),
                dailySpendingChart,
                budgetChart: monthlyBudgetData.length > 0
                    ? monthlyBudgetData.map(cat => ({
                        label: cat.name,
                        budget: cat.budget,
                        spent: cat.spent,
                        color: cat.color,
                    }))
                    : null,
                ytdMonthlyChart: ytdData?.monthlyBreakdown
                    ? Array.from({ length: month }, (_, i) => ({
                        label: MONTHS[i].slice(0, 3),
                        income: ytdData.monthlyBreakdown[i]?.income || 0,
                        expense: ytdData.monthlyBreakdown[i]?.expense || 0,
                    }))
                    : null,
                expenseRows,
                incomeRows,
                totalExpenses: pdfCurrency(totalExpenses),
                totalIncome: pdfCurrency(totalIncome),
                budgetTable,
                paymentRows,
                ytdCards,
                ytdMonthlyRows,
                ytdMonthlyFoot,
                ytdTopCategories,
                debtRows: activeDebts.length ? activeDebts : null,
                transactionRows: transactionRows.length ? transactionRows : null,
                transactionRowMeta,
                transactionFoot: transactionRows.length ? [[
                    { content: `Net Total (${active.length} transactions)`, colSpan: 4, styles: { fontStyle: 'bold' } },
                    `${balance >= 0 ? '+' : ''}${pdfCurrency(balance)}`,
                ]] : null,
            })
        } catch (err) {
            console.error('PDF generation failed:', err)
            setPdfError('PDF generation failed. Please try again.')
            setTimeout(() => setPdfError(''), 5000)
        } finally {
            setDownloading(false)
        }
    }

    const handleDownloadCSV = () => {
        const escapeCSV = (val) => {
            const str = String(val ?? '')
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
        }
        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Currency', 'Converted Amount', 'View Currency', 'Payment Method', 'Notes']
        const rows = expenses.map(e => {
            const cat = categories.find(c => c._id === e.category?._id)
            const converted = toTargetCurrency(e.amount, e.currency || 'PHP', activeViewCurrency)
            return [
                new Date(e.date).toLocaleDateString('en-US'),
                e.description,
                e.type,
                cat?.name || 'Uncategorized',
                e.amount,
                e.currency || 'PHP',
                converted ?? e.amount,
                activeViewCurrency,
                e.paymentMethod || 'Cash',
                e.notes || '',
            ].map(escapeCSV).join(',')
        })
        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Budget_${MONTHS[month - 1]}_${year}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }

    if (isLoading || !dashboard) {
        return (
            <div className="space-y-4">
                <div className={`${card} p-5`}>
                    <div className={`h-5 w-48 mb-4 ${pulse}`} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}>
                                <div className={`h-3 w-20 mb-2 ${pulse}`} />
                                <div className={`h-6 w-28 ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-40 mb-4 ${pulse}`} />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                            <div className={`h-3 w-32 ${pulse}`} />
                            <div className={`h-3 w-20 ${pulse}`} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const d = dashboard
    const convert = (amt, cur) => toTargetCurrency(amt, cur || 'PHP', activeViewCurrency) ?? amt
    const active = expenses.filter(e => !e.listOnly)
    const totalIncome = active.filter(e => e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const totalExpenses = active.filter(e => e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
    const balance = totalIncome - totalExpenses
    const totalBudget = monthlyBudgetData.reduce((s, c) => s + (c.budget || 0), 0)
    const remainingBudget = totalBudget - totalExpenses
    const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0
    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyAvg = active.length > 0 ? totalExpenses / daysInMonth : 0

    const expenseCats = categories.filter(c => c.type === 'expense')
    const incomeCats = categories.filter(c => c.type === 'income')

    const catSpending = expenseCats.map(cat => {
        const spent = active.filter(e => e.category?._id === cat._id && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
        return { ...cat, spent }
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent)

    const catIncome = incomeCats.map(cat => {
        const earned = active.filter(e => e.category?._id === cat._id && e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
        return { ...cat, earned }
    }).filter(c => c.earned > 0).sort((a, b) => b.earned - a.earned)

    const paymentMap = {}
    active.filter(e => e.type === 'expense').forEach(e => {
        const m = e.paymentMethod || 'Cash'
        if (!paymentMap[m]) paymentMap[m] = 0
        paymentMap[m] += convert(e.amount, e.currency)
    })
    const sortedPayments = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])

    const sectionTitle = `text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b border-solid ${isLight ? 'text-slate-400 border-slate-100' : 'text-gray-500 border-[#1f1f1f]'}`
    const rowCls = `flex items-center justify-between py-1.5 text-xs`
    const labelCls = isLight ? 'text-slate-600' : 'text-gray-300'
    const valueCls = `font-semibold ${isLight ? 'text-slate-800' : 'text-gray-100'}`
    const tableNumCls = `text-right align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`

    return (
        <div className="space-y-4">
            {/* Download Buttons */}
            <AnimateIn delay={0}><div className="flex justify-end gap-2">
                <button
                    onClick={handleDownloadCSV}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLight
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                >
                    <FontAwesomeIcon icon={faFileExport} className="text-xs" />
                    Download CSV
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${isLight
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                    {downloading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faFilePdf} className="text-xs" />
                            Download PDF
                        </>
                    )}
                </button>
            </div></AnimateIn>

            {pdfError && (
                <div className={`rounded-lg p-3 mb-2 text-sm font-medium flex items-center gap-2 ${isLight ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-900/20 text-red-400 border border-red-800/50'}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                    {pdfError}
                </div>
            )}

            {/* Printable Summary */}
            <AnimateIn delay={100}><div className={`${card} overflow-hidden`}>
                {/* Header */}
                <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-solid ${isLight ? 'border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50' : 'border-[#1f1f1f] bg-gradient-to-r from-blue-900/10 to-indigo-900/10'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                Monthly Budget Summary
                            </h2>
                            <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                {MONTHS[month - 1]} {year}
                            </p>
                        </div>
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-white shadow-sm' : 'bg-[#1a1a1a]'}`}>
                            <FontAwesomeIcon icon={faWallet} className={`text-base sm:text-lg ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[
                            { label: 'Total Income', value: formatCurrency(totalIncome), color: 'emerald', isMoney: true },
                            { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: 'red', isMoney: true },
                            { label: 'Net Balance', value: formatCurrency(balance), color: balance >= 0 ? 'blue' : 'red', isMoney: true },
                            { label: 'Budget Used', value: totalBudget > 0 ? `${budgetUsedPct}%` : '—', color: budgetUsedPct >= 100 ? 'red' : budgetUsedPct >= 80 ? 'amber' : 'emerald' },
                        ].map((item, i) => {
                            const colors = {
                                emerald: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-900/15 text-emerald-400 border-emerald-800/30',
                                red: isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-900/15 text-red-400 border-red-800/30',
                                blue: isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-900/15 text-blue-400 border-blue-800/30',
                                amber: isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-900/15 text-amber-400 border-amber-800/30',
                            }
                            return (
                                <div key={i} className={`rounded-lg p-3 border border-solid ${colors[item.color]}`}>
                                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{item.label}</p>
                                    <p className="text-base font-bold mt-1">
                                        {item.isMoney ? <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{item.value}</BalanceAmount> : item.value}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    <TrendsChart isLight={isLight} ytdData={ytdData} month={month} formatCurrency={formatCurrency} card={`${card} !shadow-none`} />

                    {/* Quick Stats Row */}
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 px-3 sm:px-4 py-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Transactions</span>
                            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{active.length}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Budget</span>
                            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(totalBudget)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Daily Avg</span>
                            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(dailyAvg)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Remaining</span>
                            <span className={`text-xs font-bold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencyRaw(remainingBudget, activeViewCurrency)}</span>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Expense Category Pie */}
                        {catSpending.length > 0 && (
                            <div>
                                <h4 className={sectionTitle}>
                                    <FontAwesomeIcon icon={faChartPie} className="mr-1.5 text-indigo-400 text-[10px]" />
                                    Expense Distribution
                                </h4>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={catSpending.slice(0, 8)} dataKey="spent" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2} strokeWidth={0}>
                                            {catSpending.slice(0, 8).map((c, i) => <Cell key={i} fill={c.color} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                                            labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                            itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Monthly Trend (YTD) */}
                        {ytdData && ytdData.monthlyBreakdown && (
                            <div>
                                <h4 className={sectionTitle}>
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5 text-blue-400 text-[10px]" />
                                    Monthly Trend (YTD)
                                </h4>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={Array.from({ length: month }, (_, i) => ({
                                        name: MONTHS[i].slice(0, 3),
                                        expense: ytdData.monthlyBreakdown[i]?.expense || 0,
                                        income: ytdData.monthlyBreakdown[i]?.income || 0,
                                    }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} />
                                        <YAxis tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={40} />
                                        <Tooltip
                                            contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                                            labelStyle={{ color: isLight ? '#334155' : '#e2e8f0' }}
                                            itemStyle={{ color: isLight ? '#475569' : '#cbd5e1' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                        <Legend wrapperStyle={{ fontSize: '10px', color: isLight ? '#64748b' : '#9ca3af' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Two Column: Expense Categories + Income Sources */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Expense Breakdown */}
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faArrowDown} className="mr-1.5 text-red-400 text-[10px]" />
                                Expense Breakdown
                            </h4>
                            {catSpending.length > 0 ? (
                                <div className="space-y-0.5">
                                    {catSpending.map((cat) => {
                                        const pct = totalExpenses > 0 ? Math.round((cat.spent / totalExpenses) * 100) : 0
                                        return (
                                            <div key={cat._id} className={rowCls}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                        {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                    </div>
                                                    <span className={labelCls}>{cat.name}</span>
                                                    <span className={`text-[10px] ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{pct}%</span>
                                                </div>
                                                <span className={valueCls}>{formatCurrency(cat.spent)}</span>
                                            </div>
                                        )
                                    })}
                                    <div className={`flex items-center justify-between pt-2 mt-1 border-t border-solid text-xs font-bold ${isLight ? 'border-slate-100 text-red-600' : 'border-[#1f1f1f] text-red-400'}`}>
                                        <span>Total Expenses</span>
                                        <span>{formatCurrency(totalExpenses)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expenses recorded.</p>
                            )}
                        </div>

                        {/* Income Breakdown */}
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faArrowUp} className="mr-1.5 text-emerald-400 text-[10px]" />
                                Income Sources
                            </h4>
                            {catIncome.length > 0 ? (
                                <div className="space-y-0.5">
                                    {catIncome.map((cat) => {
                                        const pct = totalIncome > 0 ? Math.round((cat.earned / totalIncome) * 100) : 0
                                        return (
                                            <div key={cat._id} className={rowCls}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                        {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                    </div>
                                                    <span className={labelCls}>{cat.name}</span>
                                                    <span className={`text-[10px] ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{pct}%</span>
                                                </div>
                                                <span className={valueCls}>{formatCurrency(cat.earned)}</span>
                                            </div>
                                        )
                                    })}
                                    <div className={`flex items-center justify-between pt-2 mt-1 border-t border-solid text-xs font-bold ${isLight ? 'border-slate-100 text-emerald-600' : 'border-[#1f1f1f] text-emerald-400'}`}>
                                        <span>Total Income</span>
                                        <span>{formatCurrency(totalIncome)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income recorded.</p>
                            )}
                        </div>
                    </div>

                    {/* Budget per Category */}
                    {monthlyBudgetData.length > 0 && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faChartPie} className="mr-1.5 text-blue-400 text-[10px]" />
                                Budget vs Actual
                            </h4>
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg border border-solid min-w-[500px]" style={{ borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
                                <table className="w-full text-xs align-top">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#111] text-gray-500'}>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Category</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Budget</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Spent</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Remaining</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyBudgetData.map((cat, i) => {
                                            const sc = statusColor(cat.percentage)
                                            return (
                                                <tr key={cat._id} className={`${i > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : ''}`}>
                                                    <td className={`px-3 py-2 align-top ${labelCls}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                                {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                            </div>
                                                            {cat.name}
                                                        </div>
                                                    </td>
                                                    <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(cat.budget)}</td>
                                                    <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(cat.spent)}</td>
                                                    <td className={`px-3 py-2 align-top ${tableNumCls}`}>
                                                        {formatCurrency(cat.remaining)}
                                                    </td>
                                                    <td className={`px-3 py-2 align-top text-right`}>
                                                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.text} ${sc.bg}`}>
                                                            {cat.budget > 0 ? `${cat.percentage}%` : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={`border-t-2 border-solid ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2B2B2B] bg-[#111]'}`}>
                                            <td className={`px-3 py-2 font-bold align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Total</td>
                                            <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(totalBudget)}</td>
                                            <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrency(totalExpenses)}</td>
                                            <td className={`px-3 py-2 align-top ${tableNumCls}`}>{formatCurrencyRaw(remainingBudget, activeViewCurrency)}</td>
                                            <td className="px-3 py-2 text-right align-top">
                                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(budgetUsedPct).text} ${statusColor(budgetUsedPct).bg}`}>
                                                    {budgetUsedPct}%
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Methods */}
                    {sortedPayments.length > 0 && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faCreditCard} className="mr-1.5 text-indigo-400 text-[10px]" />
                                Payment Methods
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {sortedPayments.map(([method, amount]) => {
                                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                                    return (
                                        <div key={method} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                                                <FontAwesomeIcon icon={paymentIcon(method)} className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-[11px] font-medium truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{method}</p>
                                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(amount)} · {pct}%</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Year-to-Date Summary */}
                    {ytdData && !ytdLoading && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faCalendarCheck} className="mr-1.5 text-indigo-400 text-[10px]" />
                                Year-to-Date ({year})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                                {[
                                    { label: 'YTD Income', value: formatCurrencyRaw(ytdData.ytdIncome, activeViewCurrency), color: 'emerald' },
                                    { label: 'YTD Expenses', value: formatCurrencyRaw(ytdData.ytdExpense, activeViewCurrency), color: 'red' },
                                    { label: 'Net Balance', value: formatCurrencyRaw(ytdData.ytdBalance, activeViewCurrency), color: ytdData.ytdBalance >= 0 ? 'blue' : 'red' },
                                    { label: 'Monthly Avg', value: formatCurrencyRaw(ytdData.monthlyAvg, activeViewCurrency), color: 'amber' },
                                ].map((item, i) => {
                                    const colors = {
                                        emerald: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-900/15 text-emerald-400 border-emerald-800/30',
                                        red: isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-900/15 text-red-400 border-red-800/30',
                                        blue: isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-900/15 text-blue-400 border-blue-800/30',
                                        amber: isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-900/15 text-amber-400 border-amber-800/30',
                                    }
                                    return (
                                        <div key={i} className={`rounded-lg p-3 border border-solid ${colors[item.color]}`}>
                                            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{item.label}</p>
                                            <p className="text-sm font-bold mt-1">{item.value}</p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Monthly Breakdown Table */}
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg border border-solid min-w-[400px]" style={{ borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
                                <table className="w-full text-xs align-top">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#111] text-gray-500'}>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Month</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Income</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Expenses</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Net</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Txns</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: month }, (_, i) => {
                                            const data = ytdData.monthlyBreakdown[i] || { income: 0, expense: 0, count: 0 }
                                            const net = data.income - data.expense
                                            return (
                                                <tr key={i} className={i > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : ''}>
                                                    <td className={`px-3 py-2 font-medium align-top ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{MONTHS[i].slice(0, 3)}</td>
                                                    <td className={`px-3 py-2 ${tableNumCls}`}>{data.income > 0 ? formatCurrencyRaw(data.income, activeViewCurrency) : '—'}</td>
                                                    <td className={`px-3 py-2 ${tableNumCls}`}>{data.expense > 0 ? formatCurrencyRaw(data.expense, activeViewCurrency) : '—'}</td>
                                                    <td className={`px-3 py-2 ${tableNumCls}`}>{data.count > 0 ? formatCurrencyRaw(net, activeViewCurrency) : '—'}</td>
                                                    <td className={`px-3 py-2 text-right align-top ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{data.count || '—'}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={`border-t-2 border-solid ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2B2B2B] bg-[#111]'}`}>
                                            <td className={`px-3 py-2 font-bold align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Total</td>
                                            <td className={`px-3 py-2 ${tableNumCls}`}>{formatCurrencyRaw(ytdData.ytdIncome, activeViewCurrency)}</td>
                                            <td className={`px-3 py-2 ${tableNumCls}`}>{formatCurrencyRaw(ytdData.ytdExpense, activeViewCurrency)}</td>
                                            <td className={`px-3 py-2 ${tableNumCls}`}>{formatCurrencyRaw(ytdData.ytdBalance, activeViewCurrency)}</td>
                                            <td className={`px-3 py-2 text-right align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{ytdData.ytdTxCount}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </div>

                            {/* YTD Top Categories */}
                            {ytdData.topCategories.length > 0 && (
                                <div className="mt-4">
                                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Top Spending Categories (YTD)</span>
                                    <div className="space-y-1.5 mt-2">
                                        {ytdData.topCategories.map((cat, i) => {
                                            const pct = ytdData.ytdExpense > 0 ? Math.round((cat.amount / ytdData.ytdExpense) * 100) : 0
                                            return (
                                                <div key={i} className={`flex items-center justify-between py-1 text-xs`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                                            {cat.icon ? <SafeIcon name={cat.icon} cls="text-[8px]" style={{ color: cat.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                                                        </div>
                                                        <span className={isLight ? 'text-slate-600' : 'text-gray-300'}>{cat.name}</span>
                                                        <span className={`text-[10px] ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>{pct}%</span>
                                                    </div>
                                                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-gray-100'}`}>{formatCurrencyRaw(cat.amount, activeViewCurrency)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Daily Transaction Log */}
                    {groupedByDate.length > 0 && (
                        <div>
                            <h4 className={sectionTitle}>
                                <FontAwesomeIcon icon={faCalendarDay} className="mr-1.5 text-amber-400 text-[10px]" />
                                Daily Transactions
                            </h4>
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg border border-solid min-w-[550px]" style={{ borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
                                <table className="w-full text-xs align-top">
                                    <thead>
                                        <tr className={isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#111] text-gray-500'}>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Date</th>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Description</th>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Category</th>
                                            <th className="px-3 py-2 text-left font-semibold align-top">Method</th>
                                            <th className="px-3 py-2 text-right font-semibold align-top">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedByDate.map(([date, group]) => {
                                            const grpIncome = group.items.filter(e => !e.listOnly && e.type === 'income').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                                            const grpExpense = group.items.filter(e => !e.listOnly && e.type === 'expense').reduce((s, e) => s + convert(e.amount, e.currency), 0)
                                            const grpCurrencies = {}
                                            group.items.filter(e => !e.listOnly).forEach(e => {
                                                const cur = e.currency || 'PHP'
                                                if (cur === activeViewCurrency) return
                                                if (!grpCurrencies[cur]) grpCurrencies[cur] = { income: 0, expense: 0 }
                                                if (e.type === 'income') grpCurrencies[cur].income += e.amount
                                                else grpCurrencies[cur].expense += e.amount
                                            })
                                            const grpCurrencyEntries = Object.entries(grpCurrencies)
                                            return (
                                            <React.Fragment key={date}>
                                                <tr className={isLight ? 'bg-slate-50/50' : 'bg-[#0a0a0a]'}>
                                                    <td colSpan={3} className="px-3 py-1.5 align-top">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{date}</span>
                                                            {grpCurrencyEntries.map(([code, v]) => (
                                                                <span key={code} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                                                    {v.expense > 0 && <span className="text-red-500">-{formatCurrencyRaw(v.expense, code)}</span>}
                                                                    {v.income > 0 && v.expense > 0 && ' '}
                                                                    {v.income > 0 && <span className="text-emerald-500">+{formatCurrencyRaw(v.income, code)}</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right align-top" colSpan={2}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {grpIncome > 0 && <span className="text-[10px] font-semibold text-emerald-500">+{formatCurrencyRaw(grpIncome, activeViewCurrency)}</span>}
                                                            {grpExpense > 0 && <span className="text-[10px] font-semibold text-red-500">-{formatCurrencyRaw(grpExpense, activeViewCurrency)}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {group.items.map(e => {
                                                    const fromCur = e.currency || 'PHP'
                                                    const converted = fromCur !== activeViewCurrency ? toTargetCurrency(e.amount, fromCur, activeViewCurrency) : null
                                                    return (
                                                    <tr key={e._id} className={`border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'} ${e.listOnly ? 'opacity-40' : ''}`}>
                                                        <td className={`px-3 py-1.5 whitespace-nowrap align-top ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className={`px-3 py-1.5 align-top ${e.listOnly ? 'line-through' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                            {e.description}
                                                            {e.listOnly && <span className={`ml-1 text-[10px] font-bold px-1 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-[#1a1a1a] text-gray-500'}`}>LIST</span>}
                                                        </td>
                                                        <td className={`px-3 py-1.5 align-top ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (e.category?.color || '#94a3b8') + '20' }}>
                                                                    {e.category?.icon ? <SafeIcon name={e.category.icon} cls="text-[8px]" style={{ color: e.category.color }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.category?.color || '#94a3b8' }} />}
                                                                </div>
                                                                {e.category?.name || 'Uncategorized'}
                                                            </div>
                                                        </td>
                                                        <td className={`px-3 py-1.5 align-top ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{e.paymentMethod}</td>
                                                        <td className={`px-3 py-1.5 text-right align-top whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                            {converted !== null ? (
                                                                <>
                                                                    <span className={`text-xs ${e.listOnly ? 'line-through' : ''}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(converted, activeViewCurrency)}
                                                                    </span>
                                                                    <span className={`block text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, fromCur)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className={`text-xs ${e.listOnly ? 'line-through' : ''}`}>
                                                                    {e.type === 'income' ? '+' : '-'}{formatCurrencyRaw(e.amount, fromCur)}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    )
                                                })}
                                            </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className={`border-t-2 border-solid ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2B2B2B] bg-[#111]'}`}>
                                            <td colSpan={4} className={`px-3 py-2 font-bold align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                Net Total ({active.length} transactions)
                                            </td>
                                            <td className={`px-3 py-2 text-right align-top ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                {balance >= 0 ? '+' : ''}{formatCurrencyRaw(balance, activeViewCurrency)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pt-4 mt-2 border-t border-solid text-[10px] ${isLight ? 'border-slate-100 text-slate-300' : 'border-[#1f1f1f] text-gray-600'}`}>
                        <span>Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span>Budget Manager · {MONTHS[month - 1]} {year}</span>
                    </div>
                </div>
            </div></AnimateIn>

        </div>
    )
})

// ==================== GOALS TAB ====================

const GoalsTab = React.memo(({ goals, categories, savingsAccounts = [], dispatch, isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, formatCurrency, isLoading, isViewer, ownerParam = {}, showBalances = true, maskedBalance = '₱ ----' }) => {
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '', category: '', color: '#3b82f6', icon: 'bullseye', notes: '', linkedSavingsAccountId: '' })
    const [contribForm, setContribForm] = useState({ goalId: null, amount: '', notes: '' })
    const [deleteModal, setDeleteModal] = useState(null)
    const [expandedGoal, setExpandedGoal] = useState(null)
    const [showCompleted, setShowCompleted] = useState(false)
    const [filterView, setFilterView] = useState('all')
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`
    const labelCls = `block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`

    const resetForm = () => { setForm({ name: '', targetAmount: '', deadline: '', category: '', color: '#3b82f6', icon: 'bullseye', notes: '', linkedSavingsAccountId: '' }); setEditing(null); setShowForm(false) }

    const handleSubmit = async () => {
        if (!form.name || !form.targetAmount) return
        const data = { ...form, ...ownerParam, targetAmount: parseFloat(form.targetAmount), linkedSavingsAccountId: form.linkedSavingsAccountId || null }
        try {
            if (editing) await dispatch(updateFinancialGoal({ ...data, id: editing })).unwrap()
            else await dispatch(createFinancialGoal(data)).unwrap()
            resetForm()
        } catch (err) { /* form kept open */ }
    }

    const handleEdit = (g) => {
        setForm({ name: g.name, targetAmount: g.targetAmount.toString(), deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : '', category: g.category?._id || '', color: g.color, icon: g.icon || 'bullseye', notes: g.notes || '', linkedSavingsAccountId: g.linkedSavingsAccountId || '' })
        setEditing(g._id)
        setShowForm(true)
    }

    const handleDelete = (id) => {
        setDeleteModal({ type: 'goal', id, title: 'Delete Goal', message: 'Are you sure you want to delete this goal? All contributions will be lost.' })
    }

    const confirmDelete = async (id) => {
        await dispatch(deleteFinancialGoal({ id, ...ownerParam }))
        setDeleteModal(null)
    }

    const handleContribute = async () => {
        if (!contribForm.goalId || !contribForm.amount) return
        const goal = goals.find(g => g._id === contribForm.goalId)
        const savingsAccountId = goal?.linkedSavingsAccountId || contribForm.savingsAccountId || null
        await dispatch(addGoalContribution({ id: contribForm.goalId, amount: parseFloat(contribForm.amount), notes: contribForm.notes, savingsAccountId, ...ownerParam }))
        if (savingsAccountId) dispatch(getBudgetSavings(ownerParam))
        setContribForm({ goalId: null, amount: '', notes: '', savingsAccountId: '' })
    }

    const handleRemoveContribution = (goalId, contributionId) => {
        setDeleteModal({ type: 'contribution', goalId, contributionId, title: 'Remove Contribution', message: 'Are you sure you want to remove this contribution?' })
    }

    const confirmRemoveContribution = async (goalId, contributionId) => {
        await dispatch(removeGoalContribution({ id: goalId, contributionId, ...ownerParam }))
        setDeleteModal(null)
    }

    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = goals.filter(g => g.status === 'completed')
    const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0)
    const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0)
    const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0
    const totalContributions = goals.reduce((s, g) => s + (g.contributions?.length || 0), 0)

    const filteredActive = useMemo(() => {
        if (filterView === 'all') return activeGoals
        if (filterView === 'urgent') return activeGoals.filter(g => { const d = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null; return d !== null && d <= 30 })
        if (filterView === 'ontrack') return activeGoals.filter(g => { const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0; return pct >= 50 })
        return activeGoals
    }, [activeGoals, filterView])

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className="flex items-center justify-between mb-3"><div className={`h-3 w-20 ${pulse}`} /><div className={`w-8 h-8 rounded-lg ${pulse}`} /></div>
                            <div className={`h-6 w-28 ${pulse}`} />
                        </div>
                    ))}
                </div>
                <div className={`${card} p-5`}><div className={`h-4 w-32 mb-4 ${pulse}`} /><div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i}><div className="flex items-center justify-between mb-1.5"><div className={`h-3 w-24 ${pulse}`} /><div className={`h-3 w-16 ${pulse}`} /></div><div className={`h-1.5 rounded-full ${pulse}`} /></div>))}</div></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Saved', value: formatCurrency(totalSaved), icon: faPiggyBank, color: 'emerald' },
                    { label: 'Target', value: formatCurrency(totalTarget), icon: faArrowUp, color: 'blue' },
                    { label: 'Remaining', value: formatCurrency(Math.max(totalTarget - totalSaved, 0)), icon: faWallet, color: 'amber' },
                    { label: 'Progress', value: `${overallPct}%`, icon: faChartPie, color: overallPct >= 100 ? 'emerald' : 'blue', hideMask: true },
                ].map((s, i) => {
                    const colorMap = {
                        emerald: { icon: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20' },
                        blue: { icon: isLight ? 'text-blue-600' : 'text-blue-400', bg: isLight ? 'bg-blue-50' : 'bg-blue-900/20' },
                        amber: { icon: isLight ? 'text-amber-600' : 'text-amber-400', bg: isLight ? 'bg-amber-50' : 'bg-amber-900/20' },
                    }
                    const cm = colorMap[s.color]
                    return (
                        <AnimateIn key={i} delay={i * 80}>
                            <div className={`${card} p-5`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cm.bg}`}>
                                        <FontAwesomeIcon icon={s.icon} className={`text-sm ${cm.icon}`} />
                                    </div>
                                </div>
                                <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    {s.hideMask ? s.value : <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{s.value}</BalanceAmount>}
                                </p>
                            </div>
                        </AnimateIn>
                    )
                })}
            </div>

            {/* Overall Progress + New Goal Button */}
            <AnimateIn delay={350}><div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Overall Progress</h3>
                    {!isViewer && <button onClick={() => { if (showForm) resetForm(); else setShowForm(true) }} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                        showForm
                            ? (isLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-[#1f1f1f] text-gray-400 hover:bg-[#252525]')
                            : (isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500')
                    }`}>
                        <FontAwesomeIcon icon={showForm ? faTimes : faPlus} className="text-[10px]" />
                        {showForm ? 'Cancel' : 'New Goal'}
                    </button>}
                </div>
                {totalTarget > 0 ? (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatCurrency(totalSaved)} of {formatCurrency(totalTarget)}</span>
                            <span className={`text-xs font-semibold ${overallPct >= 100 ? 'text-emerald-500' : (isLight ? 'text-slate-600' : 'text-gray-300')}`}>{overallPct}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                            <div className={`h-full rounded-full ${overallPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(overallPct, 100)}%`, animation: 'barGrow 1s ease-out 0.4s both' }} />
                        </div>
                        <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''} · {totalContributions} contribution{totalContributions !== 1 ? 's' : ''}</p>
                    </div>
                ) : (
                    <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active goals yet.</p>
                )}
            </div></AnimateIn>

            {/* Form */}
            {showForm && (
                <AnimateIn delay={0}><div className={`${card} p-5`}>
                    <h3 className={`text-sm font-semibold mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{editing ? 'Edit Goal' : 'New Goal'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Goal Name</label>
                            <input type="text" placeholder="e.g., Emergency Fund, Vacation..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Target Amount</label>
                            <input type="number" placeholder="0.00" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} className={inputCls} min="0" step="0.01" />
                        </div>
                        <div>
                            <label className={labelCls}>Deadline (optional)</label>
                            <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Category (optional)</label>
                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={`${selectCls} w-full`}>
                                <option value="">None</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Notes (optional)</label>
                            <input type="text" placeholder="Description" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Linked savings account (optional)</label>
                            <select value={form.linkedSavingsAccountId} onChange={e => setForm({...form, linkedSavingsAccountId: e.target.value})} className={`${selectCls} w-full`}>
                                <option value="">None — manual tracking only</option>
                                {(savingsAccounts || []).map(a => <option key={a._id} value={a._id}>{a.name} ({a.category})</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls}>Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {CATEGORY_COLORS.map(c => (
                                    <button key={c} onClick={() => setForm({...form, color: c})} className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-1 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-solid" style={{ borderColor: isLight ? '#f1f5f9' : '#1f1f1f' }}>
                        <button onClick={resetForm} className={btnSecondary}>Cancel</button>
                        <button onClick={handleSubmit} className={btnPrimary} disabled={!form.name || !form.targetAmount}>
                            <FontAwesomeIcon icon={editing ? faCheck : faPlus} className="mr-1.5 text-xs" />
                            {editing ? 'Save Changes' : 'Create Goal'}
                        </button>
                    </div>
                </div></AnimateIn>
            )}

            {/* Active Goals List */}
            <AnimateIn delay={400}><div className={`${card} p-5`}>
                <h3 className={`text-sm font-semibold mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Active Goals</h3>
                {filteredActive.length > 0 ? (
                    <div className="space-y-3">
                        {filteredActive.map((g, gIdx) => {
                            const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
                            const remaining = Math.max(g.targetAmount - g.currentAmount, 0)
                            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null
                            const isExpanded = expandedGoal === g._id
                            const isOverdue = daysLeft !== null && daysLeft < 0
                            const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

                            return (
                                <div key={g._id} className={`cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: g.color + '20' }}>
                                                <SafeIcon name={g.icon || 'bullseye'} cls="text-[10px]" style={{ color: g.color }} />
                                            </div>
                                            <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{g.name}</span>
                                            {daysLeft !== null && (
                                                <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : (isLight ? 'text-slate-400' : 'text-gray-500')}`}>
                                                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(g.currentAmount)}</span>
                                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                        </div>
                                    </div>
                                    <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: g.color, animation: `barGrow 0.8s ease-out ${0.4 + gIdx * 0.1}s both` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <div className="flex items-center gap-2">
                                            {!isViewer && contribForm.goalId === g._id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <input type="number" placeholder="Amount" value={contribForm.amount} onChange={e => setContribForm({...contribForm, amount: e.target.value})} className={`${inputCls} !py-1 !text-[11px] w-20`} min="0" autoFocus />
                                                    <input type="text" placeholder="Note" value={contribForm.notes} onChange={e => setContribForm({...contribForm, notes: e.target.value})} className={`${inputCls} !py-1 !text-[11px] w-20 hidden sm:block`} />
                                                    <button onClick={handleContribute} disabled={!contribForm.amount} className="px-2 py-1 rounded text-[10px] font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40"><FontAwesomeIcon icon={faCheck} /></button>
                                                    <button onClick={() => setContribForm({ goalId: null, amount: '', notes: '' })} className={`px-1.5 py-1 rounded text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}><FontAwesomeIcon icon={faTimes} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {!isViewer && <button onClick={() => setContribForm({ goalId: g._id, amount: '', notes: '' })} className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                                                        <FontAwesomeIcon icon={faPlus} className="mr-1 text-[8px]" />Add
                                                    </button>}
                                                    {!isViewer && <button onClick={() => handleEdit(g)} className={`text-[10px] px-1.5 py-0.5 rounded ${isLight ? 'text-blue-500 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'}`}><FontAwesomeIcon icon={faPen} /></button>}
                                                    {!isViewer && <button onClick={() => handleDelete(g._id)} className={`text-[10px] px-1.5 py-0.5 rounded ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`}><FontAwesomeIcon icon={faTrash} /></button>}
                                                </div>
                                            )}
                                            <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(remaining)} left</span>
                                        </div>
                                        <button onClick={() => setExpandedGoal(isExpanded ? null : g._id)} className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${isExpanded ? (isLight ? 'text-blue-500' : 'text-blue-400') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>
                                            {g.contributions?.length || 0} entries <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[8px] ml-0.5" />
                                        </button>
                                    </div>

                                    {/* Contributions */}
                                    {isExpanded && g.contributions?.length > 0 && (
                                        <div className={`mt-2 pt-2 border-t border-solid space-y-0.5 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                            {g.contributions.slice().reverse().slice(0, 8).map((c, i) => {
                                                return (
                                                <div key={c._id || i} className={`flex items-center justify-between py-1 group`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-[11px] font-semibold text-emerald-500">+{formatCurrency(c.amount)}</span>
                                                        {c.notes && <span className={`text-[10px] truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{c.notes}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {!isViewer && <button onClick={() => handleRemoveContribution(g._id, c._id)} className={`w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-red-400 hover:text-red-500' : 'text-red-400 hover:text-red-300'}`}><FontAwesomeIcon icon={faTimes} className="text-[7px]" /></button>}
                                                    </div>
                                                </div>
                                            )})}
                                            {g.contributions.length > 8 && <p className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>+{g.contributions.length - 8} more</p>}
                                        </div>
                                    )}
                                    {isExpanded && (!g.contributions || g.contributions.length === 0) && (
                                        <p className={`text-[10px] text-center mt-2 pt-2 border-t border-solid ${isLight ? 'border-slate-100 text-slate-400' : 'border-[#1f1f1f] text-gray-500'}`}>No contributions yet</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active goals.</p>
                )}
            </div></AnimateIn>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <AnimateIn delay={500}><div className={`${card} p-5`}>
                    <button onClick={() => setShowCompleted(!showCompleted)} className="w-full flex items-center justify-between">
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Completed ({completedGoals.length})</h3>
                        <FontAwesomeIcon icon={showCompleted ? faChevronUp : faChevronDown} className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                    </button>
                    {showCompleted && (
                        <div className="mt-3 space-y-2">
                            {completedGoals.map((g) => (
                                <div key={g._id} className={`flex items-center justify-between rounded-lg p-2 -mx-2 ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: g.color + '20' }}>
                                            <SafeIcon name={g.icon || 'bullseye'} cls="text-[10px]" style={{ color: g.color }} />
                                        </div>
                                        <span className={`text-sm truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{g.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <span className="text-sm font-semibold text-emerald-500">{formatCurrency(g.currentAmount)}</span>
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-[10px] text-emerald-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div></AnimateIn>
            )}

            {/* Empty State */}
            {goals.length === 0 && !showForm && (
                <AnimateIn delay={200}><div className={`${card} p-5 text-center py-12`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                        <FontAwesomeIcon icon={faPiggyBank} className={`text-lg ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No goals yet</p>
                    <p className={`text-xs mb-4 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Start tracking what you're saving for.</p>
                    {!isViewer && <button onClick={() => setShowForm(true)} className={`text-xs font-medium px-4 py-2 rounded-lg ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                        <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-[10px]" />Create Goal
                    </button>}
                </div></AnimateIn>
            )}

            {deleteModal && (
                <DeleteConfirmModal isLight={isLight} title={deleteModal.title} message={deleteModal.message} onCancel={() => setDeleteModal(null)} onConfirm={() => {
                    if (deleteModal.type === 'goal') confirmDelete(deleteModal.id)
                    else if (deleteModal.type === 'contribution') confirmRemoveContribution(deleteModal.goalId, deleteModal.contributionId)
                }} />
            )}
        </div>
    )
})


export default Budget
