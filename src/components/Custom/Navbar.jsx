import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMoon,
    faSun,
    faRightFromBracket,
    faCircleHalfStroke,
    faCalendarAlt,
    faSearch,
    faChevronDown,
    faShieldHalved,
    faCircleCheck,
    faArrowTrendUp,
    faArrowTrendDown,
    faScaleBalanced,
    faPlus,
    faFileExport,
    faGear,
    faSpinner,
    faBolt,
    faChartPie,
    faCalendarDay,
    faTags,
    faPiggyBank,
    faHandHoldingUsd,
    faListAlt,
    faCheckCircle,
    faFilePdf,
    faCogs,
    faBars,
} from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { logout, logoutUser } from '../../actions/auth'
import { searchBudgetExpenses, clearSearchResults } from '../../actions/budget'
import { useDispatch, useSelector } from 'react-redux'
import { main, dark, light } from '../../style'
import { MONTHS, CURRENCIES, VALID_TABS } from '../Pages/Budget/constants'
import { TAB_META } from '../Layout/budgetTabNav'
import { buildExchangeRates, computeMonthlyStats, getActiveViewCurrency } from '../../utils/budgetCurrency'
import Avatar from '../../assets/avatar.webp'

const FAVICON = '/favicon.ico'

const navTitleCls = (isLight) => isLight ? 'text-sm font-semibold text-slate-800' : 'text-sm font-semibold text-white'
const navDescCls = (isLight) => isLight ? 'text-xs text-slate-500' : 'text-xs text-gray-500'

const formatMoney = (value, currencyCode = 'PHP') => {
    const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]
    const amount = Number(value) || 0
    return `${cur.symbol}${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatTxn = (amount, currencyCode = 'PHP') => {
    const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]
    const val = Number(amount) || 0
    return `${cur.symbol}${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ThemeToggle = ({ theme, onChange, isLight }) => {
    const isDark = theme === 'dark'
    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onChange}
            className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                isDark
                    ? (isLight ? 'bg-blue-600' : 'bg-blue-500')
                    : (isLight ? 'bg-slate-300' : 'bg-gray-600')
            }`}
        >
            <span
                className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    isDark ? 'translate-x-5' : 'translate-x-0'
                }`}
            >
                <FontAwesomeIcon
                    icon={isDark ? faMoon : faSun}
                    className={`text-[9px] ${isDark ? 'text-indigo-600' : 'text-amber-500'}`}
                />
            </span>
        </button>
    )
}

const ProfileDropdown = ({
    isLight, avatarSrc, userName, userEmail, userRole, isVerified,
    stats, isLoading, expenses, baseCurrency, statTone, theme, changeTheme, signOut,
}) => (
    <div className={`w-full sm:w-72 rounded-2xl shadow-2xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2a2a2a]'}`}>
        {/* Profile header */}
        <div className={`px-5 pt-5 pb-4 text-center border-b ${isLight ? 'border-slate-100 bg-gradient-to-b from-slate-50 to-white' : 'border-[#222] bg-gradient-to-b from-[#161616] to-[#141414]'}`}>
            <div className="relative inline-block">
                <img
                    src={avatarSrc}
                    alt={userName}
                    className="h-16 w-16 rounded-full object-cover ring-[3px] ring-blue-500/30 mx-auto"
                    onError={(e) => { e.target.src = Avatar }}
                />
                <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 ${isLight ? 'border-white bg-emerald-500' : 'border-[#141414] bg-emerald-500'}`} />
            </div>
            <div className="mt-3 min-w-0">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <p className={`text-base font-semibold truncate max-w-full ${isLight ? 'text-slate-800' : 'text-white'}`}>{userName}</p>
                    {isVerified && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/40 text-emerald-400'}`}>
                            <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />
                            Verified
                        </span>
                    )}
                </div>
                <p className={`text-xs mt-1 truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{userEmail}</p>
                <span className={`inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium px-2.5 py-1 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400'}`}>
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[10px] opacity-70" />
                    {userRole}
                </span>
            </div>
        </div>

        {/* Stats row */}
        <div className={`grid grid-cols-3 divide-x ${isLight ? 'divide-slate-100 border-b border-slate-100' : 'divide-[#222] border-b border-[#222]'}`}>
            {[
                { l: 'Income', v: stats.income, t: 'income' },
                { l: 'Spent', v: stats.expenses, t: 'expense' },
                { l: 'Balance', v: stats.balance, t: 'balance' },
            ].map((s) => (
                <div key={s.l} className="px-3 py-3 text-center">
                    <p className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.l}</p>
                    <p className={`text-xs font-bold tabular-nums leading-none ${statTone(s.t)}`}>
                        {isLoading && !expenses?.length ? '—' : formatMoney(s.v, baseCurrency)}
                    </p>
                </div>
            ))}
        </div>

        {/* Theme row */}
        <div className={`flex items-center justify-between gap-4 px-5 py-3.5 ${isLight ? 'bg-slate-50/50' : 'bg-[#111]/50'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLight ? 'bg-white text-slate-500 shadow-sm' : 'bg-[#1a1a1a] text-gray-400'}`}>
                    <FontAwesomeIcon icon={faCircleHalfStroke} className="text-xs" />
                </div>
                <div>
                    <p className={`text-sm font-medium leading-none ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Appearance</p>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{isLight ? 'Light mode' : 'Dark mode'}</p>
                </div>
            </div>
            <ThemeToggle theme={theme} onChange={changeTheme} isLight={isLight} />
        </div>

        {/* Sign out */}
        <button
            type="button"
            onClick={signOut}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium border-t transition-colors ${isLight ? 'text-rose-600 hover:bg-rose-50 border-slate-100' : 'text-red-400 hover:bg-red-500/10 border-[#222]'}`}
        >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
            Sign Out
        </button>
    </div>
)

const Navbar = ({ theme, setTheme, setUser, onMenuToggle, sidebarLayout = false }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    const profileRef = useRef(null)
    const quickRef = useRef(null)
    const searchRef = useRef(null)
    const searchTimeoutRef = useRef(null)
    const searchIdRef = useRef(0)

    const { baseCurrency, viewCurrency, selectedMonth, selectedYear, expenses, exchangeRates: savedRates, liveRates, isLoading, viewingBudgetOwner, budgetSettings, searchResults } = useSelector((state) => state.budget)

    const exchangeRates = useMemo(() => buildExchangeRates(savedRates, liveRates), [savedRates, liveRates])
    const activeViewCurrency = getActiveViewCurrency(viewCurrency, baseCurrency || budgetSettings?.baseCurrency || 'PHP')

    const stats = useMemo(() => computeMonthlyStats({
        expenses,
        month: selectedMonth,
        year: selectedYear,
        viewCurrency,
        exchangeRates,
        baseCurrency: baseCurrency || 'PHP',
    }), [expenses, selectedMonth, selectedYear, viewCurrency, exchangeRates, baseCurrency])

    const [localUser, setLocalUser] = useState(null)
    const [avatar, setAvatar] = useState(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [quickOpen, setQuickOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchKey, setSearchKey] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const isLight = theme === 'light'
    const tabParam = searchParams.get('tab')
    const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'dashboard'
    const activeMeta = TAB_META[activeTab] || TAB_META.dashboard
    const activeLabel = activeMeta.label
    const activeIcon = activeMeta.icon
    const activeHint = activeMeta.hint
    const now = new Date()
    const monthLabel = `${MONTHS[(selectedMonth || now.getMonth() + 1) - 1]} ${selectedYear || now.getFullYear()}`

    const savingsRate = stats.income > 0
        ? Math.round(((stats.income - stats.expenses) / stats.income) * 100)
        : 0

    const contextHint = stats.income > 0
        ? `${savingsRate}% saved this month`
        : activeHint

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('profile'))
        const storedAvatar = JSON.parse(localStorage.getItem('avatar'))
        setLocalUser(profile || null)
        setAvatar(storedAvatar || null)
    }, [])

    useEffect(() => {
        setQuickOpen(false)
    }, [location.pathname, location.search])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setMenuOpen(false)
            if (quickRef.current && !quickRef.current.contains(e.target)) setQuickOpen(false)
            if (searchOpen && searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false)
            }
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setMenuOpen(false)
                setQuickOpen(false)
                setSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [searchOpen])

    const changeTheme = () => {
        const next = isLight ? 'dark' : 'light'
        setTheme(next)
        localStorage.setItem('theme', next)
    }

    const signOut = () => {
        dispatch(logoutUser()).finally(() => {
            dispatch(logout())
            setLocalUser(null)
            setAvatar(null)
            if (setUser) setUser(null)
            navigate('/login')
        })
    }

    const jumpTo = (tab, extra = {}) => {
        const params = new URLSearchParams({ tab, ...extra })
        navigate(`/budget?${params.toString()}`)
        setMenuOpen(false)
        setQuickOpen(false)
    }

    const userName = localUser?.username || ''
    const userEmail = localUser?.email || ''
    const userRole = localUser?.role || 'User'
    const isVerified = localUser?.verification?.verified
    const avatarSrc = avatar || Avatar
    const currencyLabel = activeViewCurrency
    const ownerParam = viewingBudgetOwner?.id ? { budgetOwnerId: viewingBudgetOwner.id } : {}
    const urlQuery = searchParams.get('q') || ''

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        }
    }, [])

    const runSearch = (q) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        if (q.trim().length < 2) {
            searchIdRef.current++
            setIsSearching(false)
            dispatch(clearSearchResults())
            return
        }
        setIsSearching(true)
        const id = ++searchIdRef.current
        searchTimeoutRef.current = setTimeout(() => {
            dispatch(searchBudgetExpenses({ q: q.trim(), ...ownerParam })).finally(() => {
                if (searchIdRef.current === id) setIsSearching(false)
            })
        }, 350)
    }

    useEffect(() => {
        if (urlQuery.length >= 2) {
            setSearchKey(urlQuery)
            setSearchOpen(true)
            runSearch(urlQuery)
        }
    }, [urlQuery])

    const handleSearchInput = (value) => {
        setSearchKey(value)
        runSearch(value)
    }

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        const q = searchKey.trim()
        if (q.length < 2) return
        runSearch(q)
        const params = new URLSearchParams({ tab: 'daily', q })
        navigate(`/budget?${params.toString()}`)
    }

    const openFullSearch = (q) => {
        const query = (q || searchKey).trim()
        if (query.length < 2) return
        const params = new URLSearchParams({ tab: 'daily', q: query })
        navigate(`/budget?${params.toString()}`)
        setSearchOpen(false)
    }

    const statTone = (type) => {
        if (type === 'income') return isLight ? 'text-emerald-600' : 'text-emerald-400'
        if (type === 'expense') return isLight ? 'text-rose-600' : 'text-rose-400'
        return stats.balance >= 0
            ? (isLight ? 'text-blue-600' : 'text-blue-400')
            : (isLight ? 'text-amber-600' : 'text-amber-400')
    }

    return (
        <header className={`${main.font} sticky top-0 z-50 w-full min-w-0 overflow-x-clip transition-all ${isLight ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm' : 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1f1f1f] shadow-lg shadow-black/30'}`}>
            <div className={`h-px w-full ${isLight ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent'}`} />

            <div className={`w-full transition-[max-width,padding] duration-300 ease-out ${sidebarLayout ? 'max-w-none px-3 sm:px-4 lg:px-5' : 'max-w-[1550px] mx-auto px-3 sm:px-6 lg:px-8'}`}>
                {/* Main bar */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[56px] sm:min-h-[64px] py-2 sm:py-0">
                    {/* Left: menu + brand + page context */}
                    <div className="flex items-stretch min-w-0 flex-1">
                        {onMenuToggle && (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className={`lg:hidden w-9 h-9 mr-2 rounded-xl flex items-center justify-center shrink-0 ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-gray-300 hover:bg-[#161616]'}`}
                            aria-label="Open menu"
                            aria-expanded={false}
                        >
                            <FontAwesomeIcon icon={faBars} className="text-sm" />
                        </button>
                        )}
                        <Link
                            to="/budget"
                            className={`flex items-center gap-2.5 pr-3 sm:pr-4 shrink-0 group border-r border-solid ${isLight ? 'border-slate-200/80' : 'border-[#252525]'}`}
                        >
                            <div className={`w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-xl overflow-hidden shrink-0 ring-1 ring-inset transition-transform duration-200 group-hover:scale-[1.02] ${isLight ? 'ring-slate-200/80 bg-white' : 'ring-[#2a2a2a] bg-[#141414]'}`}>
                                <img src={FAVICON} alt="Budget" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 hidden md:block">
                                <p className={`leading-tight ${navTitleCls(isLight)}`}>Budget</p>
                                <p className={`mt-0.5 leading-snug ${navDescCls(isLight)}`}>Finance tracker</p>
                            </div>
                        </Link>

                        {/* Mobile context */}
                        <div className="sm:hidden flex items-center gap-2.5 pl-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/12 text-blue-400'}`}>
                                <FontAwesomeIcon icon={activeIcon} className="text-xs" />
                            </div>
                            <div className="min-w-0">
                                <p className={`truncate leading-tight ${navTitleCls(isLight)}`}>{activeLabel}</p>
                                <p className={`truncate mt-0.5 leading-snug ${navDescCls(isLight)}`}>
                                    {monthLabel} · {currencyLabel}
                                </p>
                            </div>
                        </div>

                        {/* Desktop context */}
                        <div className="hidden sm:flex items-center gap-3 pl-4 min-w-0 flex-1">
                            <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/12 text-blue-400'}`}>
                                <FontAwesomeIcon icon={activeIcon} className="text-xs" />
                                <span className={`absolute -bottom-px left-2 right-2 h-0.5 rounded-full ${isLight ? 'bg-blue-500' : 'bg-blue-400'}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h2 className={`truncate leading-tight ${navTitleCls(isLight)}`}>
                                        {activeLabel}
                                    </h2>
                                    {viewingBudgetOwner && (
                                        <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${isLight ? 'text-amber-700 bg-amber-50' : 'text-amber-400 bg-amber-500/10'}`}>
                                            Shared
                                        </span>
                                    )}
                                </div>
                                <p className={`truncate mt-0.5 leading-snug ${navDescCls(isLight)}`}>
                                    <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>{monthLabel}</span>
                                    <span className="mx-2 opacity-30">|</span>
                                    <span className={`font-medium tabular-nums ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{currencyLabel}</span>
                                    <span className="mx-2 opacity-30">|</span>
                                    <span>{contextHint}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Center: unified stats pill — desktop/tablet */}
                    <div className={`hidden md:flex items-center rounded-2xl border overflow-hidden shrink-0 ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-[#111] border-[#252525]'}`}>
                        {[
                            { key: 'income', label: 'Income', icon: faArrowTrendUp, value: stats.income },
                            { key: 'expense', label: 'Spent', icon: faArrowTrendDown, value: stats.expenses },
                            { key: 'balance', label: 'Balance', icon: faScaleBalanced, value: stats.balance },
                        ].map((item, i) => (
                            <div
                                key={item.key}
                                className={`flex items-center gap-2 px-4 py-2 ${i > 0 ? (isLight ? 'border-l border-slate-200/80' : 'border-l border-[#252525]') : ''}`}
                            >
                                <FontAwesomeIcon icon={item.icon} className={`text-xs ${statTone(item.key === 'balance' ? 'balance' : item.key)} opacity-80`} />
                                <div>
                                    <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{item.label}</p>
                                    <p className={`text-sm font-semibold tabular-nums leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                        {isLoading && !expenses?.length ? '—' : formatMoney(item.value, activeViewCurrency)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        <div className="relative" ref={quickRef}>
                            <button
                                type="button"
                                onClick={() => setQuickOpen(!quickOpen)}
                                title="Quick actions"
                                aria-label="Quick actions"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${quickOpen ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/40 text-blue-400') : (isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-blue-600' : 'text-gray-400 hover:bg-[#161616] hover:text-blue-400')}`}
                            >
                                <FontAwesomeIcon icon={faBolt} className="text-sm" />
                            </button>
                            {quickOpen && (
                                <div className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border overflow-hidden z-50 ${isLight ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2a2a2a]'}`}>
                                    <p className={`px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Shortcuts</p>
                                    {[
                                        { label: 'Log expense', tab: 'daily', icon: faPlus },
                                        { label: 'Monthly plan', tab: 'monthly', icon: faCalendarAlt },
                                        { label: 'Export summary', tab: 'summary', icon: faFileExport },
                                        { label: 'App settings', tab: 'settings', icon: faGear },
                                    ].map((action) => (
                                        <button
                                            key={action.tab + action.label}
                                            type="button"
                                            onClick={() => jumpTo(action.tab)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${isLight ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-700' : 'text-gray-300 hover:bg-[#1c1c1c] hover:text-white'}`}
                                        >
                                            <FontAwesomeIcon icon={action.icon} className="w-3.5 text-[10px] opacity-60" />
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={searchRef}>
                            <button
                                type="button"
                                onClick={() => setSearchOpen((open) => !open)}
                                aria-expanded={searchOpen}
                                aria-haspopup="dialog"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${searchOpen ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/40 text-blue-400') : (isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#161616]')}`}
                                title="Search"
                            >
                                <FontAwesomeIcon icon={faSearch} className="text-sm" />
                            </button>

                            {searchOpen && (
                                <div className={`absolute right-0 top-full mt-2 w-[min(100vw-1.5rem,22rem)] rounded-xl border shadow-xl z-[70] overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2a2a2a]'}`}>
                                    <form onSubmit={handleSearchSubmit} className={`relative p-3 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#222]'}`} onClick={(e) => e.stopPropagation()}>
                                        <FontAwesomeIcon icon={faSearch} className={`absolute left-5 top-1/2 -translate-y-1/2 text-sm ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                                        <input
                                            type="text"
                                            value={searchKey}
                                            onChange={(e) => handleSearchInput(e.target.value)}
                                            autoFocus
                                            placeholder="Search transactions..."
                                            className={`w-full pl-9 pr-20 py-2 rounded-lg text-sm border outline-none ${isLight ? `${light.input} border-slate-200` : `${dark.input} border-[#333]`}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={searchKey.trim().length < 2}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                        >
                                            Go
                                        </button>
                                    </form>

                                    {searchKey.trim().length > 0 && searchKey.trim().length < 2 && (
                                        <p className={`px-3 py-2 text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Type at least 2 characters</p>
                                    )}

                                    {searchKey.trim().length >= 2 && (
                                        <div className="max-h-72 overflow-y-auto">
                                            {isSearching ? (
                                                <div className="flex items-center justify-center gap-2 py-6">
                                                    <FontAwesomeIcon icon={faSpinner} className={`animate-spin text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Searching...</span>
                                                </div>
                                            ) : searchResults?.length > 0 ? (
                                                <>
                                                    <div className={`px-3 py-2 border-b flex items-center justify-between ${isLight ? 'border-slate-100 bg-slate-50' : 'border-[#222] bg-[#111]'}`}>
                                                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openFullSearch()}
                                                            className={`text-[11px] font-medium ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}
                                                        >
                                                            View all →
                                                        </button>
                                                    </div>
                                                    {searchResults.slice(0, 8).map((txn) => (
                                                        <button
                                                            key={txn._id}
                                                            type="button"
                                                            onClick={() => openFullSearch(searchKey)}
                                                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-b-0 ${isLight ? 'hover:bg-blue-50 border-slate-50' : 'hover:bg-[#1a1a1a] border-[#1c1c1c]'}`}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{txn.description}</p>
                                                                <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                    {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    {txn.category?.name ? ` · ${txn.category.name}` : ''}
                                                                </p>
                                                            </div>
                                                            <span className={`text-sm font-semibold tabular-nums shrink-0 ${txn.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {txn.type === 'income' ? '+' : '-'}{formatTxn(txn.amount, txn.currency || activeViewCurrency)}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 gap-1.5 px-4">
                                                    <FontAwesomeIcon icon={faSearch} className={`text-lg ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                                                    <span className={`text-xs text-center ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        No results for "{searchKey.trim()}"
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={changeTheme}
                            className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#161616] hover:text-amber-400'}`}
                            title={isLight ? 'Dark mode' : 'Light mode'}
                        >
                            <FontAwesomeIcon icon={isLight ? faMoon : faSun} className="text-sm" />
                        </button>

                        <button
                            type="button"
                            onClick={changeTheme}
                            className={`hidden md:flex w-9 h-9 rounded-xl items-center justify-center transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#161616] hover:text-amber-400'}`}
                            title={isLight ? 'Dark mode' : 'Light mode'}
                        >
                            <FontAwesomeIcon icon={isLight ? faMoon : faSun} />
                        </button>

                        {/* Profile */}
                        {localUser && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className={`flex items-center gap-1.5 h-9 pl-1 pr-1.5 sm:pr-2.5 rounded-xl transition-all ${menuOpen ? (isLight ? 'bg-slate-100 ring-1 ring-slate-200' : 'bg-[#161616] ring-1 ring-[#333]') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-[#111]')}`}
                                >
                                    <img src={avatarSrc} alt={userName} className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/25 shrink-0" onError={(e) => { e.target.src = Avatar }} />
                                    <FontAwesomeIcon icon={faChevronDown} className={`hidden sm:block text-[9px] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                </button>
                                {menuOpen && (
                                    <div className="fixed inset-x-3 top-[60px] z-[60] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-auto max-w-md mx-auto sm:mx-0">
                                        <ProfileDropdown
                                            isLight={isLight}
                                            avatarSrc={avatarSrc}
                                            userName={userName}
                                            userEmail={userEmail}
                                            userRole={userRole}
                                            isVerified={isVerified}
                                            stats={stats}
                                            isLoading={isLoading}
                                            expenses={expenses}
                                            baseCurrency={activeViewCurrency}
                                            statTone={statTone}
                                            theme={theme}
                                            changeTheme={changeTheme}
                                            signOut={signOut}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile stats strip */}
                <div className="md:hidden pb-3 space-y-2">
                    <div className={`grid grid-cols-3 gap-2 rounded-xl p-2.5 ${isLight ? 'bg-slate-50 border border-slate-200/80' : 'bg-[#111] border border-[#252525]'}`}>
                        {[
                            { l: 'Income', v: stats.income, t: 'income' },
                            { l: 'Spent', v: stats.expenses, t: 'expense' },
                            { l: 'Balance', v: stats.balance, t: 'balance' },
                        ].map(s => (
                            <div key={s.l} className="text-center min-w-0 px-0.5">
                                <p className={`text-xs font-medium truncate ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{s.l}</p>
                                <p className={`text-sm font-semibold tabular-nums truncate ${statTone(s.t)}`}>
                                    {isLoading && !expenses?.length ? '—' : formatMoney(s.v, activeViewCurrency)}
                                </p>
                            </div>
                        ))}
                    </div>
                    {viewingBudgetOwner && (
                        <p className={`text-xs text-center font-medium ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                            Viewing shared budget · {viewingBudgetOwner.username}
                        </p>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Navbar
