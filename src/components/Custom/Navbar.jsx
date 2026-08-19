import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faWallet,
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
} from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { logout } from '../../actions/auth'
import { searchBudgetExpenses, clearSearchResults } from '../../actions/budget'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, X } from 'lucide-react'
import { main, dark, light } from '../../style'
import { MONTHS, CURRENCIES, VALID_TABS } from '../Pages/Budget/constants'
import { buildExchangeRates, computeMonthlyStats, getActiveViewCurrency } from '../../utils/budgetCurrency'
import Avatar from '../../assets/avatar.webp'

const TAB_LABELS = {
    dashboard: 'Dashboard',
    daily: 'Daily Expenses',
    monthly: 'Monthly Budget',
    categories: 'Categories',
    savings: 'Savings',
    debts: 'Debts',
    lists: 'Lists',
    goals: 'Goals',
    summary: 'Summary',
    settings: 'Settings',
}

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
    <div className={`w-72 rounded-2xl shadow-2xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2a2a2a]'}`}>
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

const Navbar = ({ theme, setTheme, setUser }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    const profileRef = useRef(null)
    const quickRef = useRef(null)
    const mobileRef = useRef(null)
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
    const [mobileOpen, setMobileOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchKey, setSearchKey] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const isLight = theme === 'light'
    const tabParam = searchParams.get('tab')
    const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'dashboard'
    const activeLabel = TAB_LABELS[activeTab] || 'Dashboard'
    const now = new Date()
    const monthLabel = `${MONTHS[(selectedMonth || now.getMonth() + 1) - 1]} ${selectedYear || now.getFullYear()}`

    const savingsRate = stats.income > 0
        ? Math.round(((stats.income - stats.expenses) / stats.income) * 100)
        : 0

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('profile'))
        const storedAvatar = JSON.parse(localStorage.getItem('avatar'))
        setLocalUser(profile || null)
        setAvatar(storedAvatar || null)
    }, [])

    useEffect(() => {
        setMobileOpen(false)
        setQuickOpen(false)
    }, [location.pathname, location.search])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setMenuOpen(false)
            if (quickRef.current && !quickRef.current.contains(e.target)) setQuickOpen(false)
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
            if (mobileRef.current && !mobileRef.current.contains(e.target) && !e.target.closest('[data-mobile-toggle]')) {
                setMobileOpen(false)
            }
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setMenuOpen(false)
                setQuickOpen(false)
                setMobileOpen(false)
                setSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    const changeTheme = () => {
        const next = isLight ? 'dark' : 'light'
        setTheme(next)
        localStorage.setItem('theme', next)
    }

    const signOut = () => {
        dispatch(logout())
        setLocalUser(null)
        setAvatar(null)
        if (setUser) setUser(null)
        navigate('/login')
    }

    const jumpTo = (tab, extra = {}) => {
        const params = new URLSearchParams({ tab, ...extra })
        navigate(`/budget?${params.toString()}`)
        setMobileOpen(false)
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
        <header className={`${main.font} sticky top-0 z-50 w-full transition-all ${isLight ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm' : 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1f1f1f] shadow-lg shadow-black/30'}`}>
            <div className={`h-px w-full ${isLight ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent'}`} />

            <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main bar */}
                <div className="flex items-center justify-between gap-4 h-[60px] sm:h-[64px]">
                    {/* Left: brand + breadcrumb context (not nav) */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                            type="button"
                            data-mobile-toggle
                            onClick={() => setMobileOpen(true)}
                            className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#161616]'}`}
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>

                        <Link to="/budget" className="flex items-center gap-2.5 shrink-0 group">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-[1.03] ${isLight ? 'bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-md shadow-blue-200/40' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/25'}`}>
                                <FontAwesomeIcon icon={faWallet} className="text-sm sm:text-base" />
                            </div>
                            <div className="hidden sm:block">
                                <p className={`font-bold text-sm leading-none ${isLight ? 'text-slate-800' : 'text-white'}`}>Budget</p>
                                <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Finance tracker</p>
                            </div>
                        </Link>

                        <div className={`hidden sm:block w-px h-8 ${isLight ? 'bg-slate-200' : 'bg-[#2a2a2a]'}`} />

                        {/* Context breadcrumb — shows where you are, not duplicate tabs */}
                        <div className="hidden sm:flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] truncate">
                                <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>{monthLabel}</span>
                                <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>/</span>
                                <span className={`font-semibold truncate ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{activeLabel}</span>
                                {viewingBudgetOwner && (
                                    <>
                                        <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>·</span>
                                        <span className={`truncate ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>Shared</span>
                                    </>
                                )}
                            </div>
                            <p className={`text-[10px] truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                {currencyLabel} · {savingsRate >= 0 ? `${savingsRate}% saved this month` : 'Review spending'}
                            </p>
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
                                <FontAwesomeIcon icon={item.icon} className={`text-[10px] ${statTone(item.key === 'balance' ? 'balance' : item.key)} opacity-80`} />
                                <div>
                                    <p className={`text-[9px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{item.label}</p>
                                    <p className={`text-xs font-bold tabular-nums leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                        {isLoading && !expenses?.length ? '—' : formatMoney(item.value, activeViewCurrency)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Quick actions — shortcuts, not full tab nav */}
                        <div className="relative hidden sm:block" ref={quickRef}>
                            <button
                                type="button"
                                onClick={() => setQuickOpen(!quickOpen)}
                                className={`flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold transition-all ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/30'}`}
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                <span className="hidden lg:inline">Quick</span>
                                <FontAwesomeIcon icon={faChevronDown} className={`text-[9px] transition-transform ${quickOpen ? 'rotate-180' : ''}`} />
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

                        <button
                            type="button"
                            onClick={() => setSearchOpen(!searchOpen)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${searchOpen ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/40 text-blue-400') : (isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#161616]')}`}
                            title="Search"
                        >
                            <FontAwesomeIcon icon={faSearch} className="text-sm" />
                        </button>

                        <button
                            type="button"
                            onClick={changeTheme}
                            className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#161616] hover:text-amber-400'}`}
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
                                    className={`flex items-center gap-1.5 h-9 pl-1 pr-2.5 rounded-xl transition-all ${menuOpen ? (isLight ? 'bg-slate-100 ring-1 ring-slate-200' : 'bg-[#161616] ring-1 ring-[#333]') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-[#111]')}`}
                                >
                                    <img src={avatarSrc} alt={userName} className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/25 shrink-0" onError={(e) => { e.target.src = Avatar }} />
                                    <FontAwesomeIcon icon={faChevronDown} className={`hidden sm:block text-[9px] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 z-50">
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

                {/* Search expand + live results */}
                {searchOpen && (
                    <div className="pb-3 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <FontAwesomeIcon icon={faSearch} className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                            <input
                                type="text"
                                value={searchKey}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                autoFocus
                                placeholder="Search transactions (min. 2 characters)..."
                                className={`w-full pl-10 pr-24 py-2.5 rounded-xl text-sm border outline-none ${isLight ? `${light.input} border-slate-200` : `${dark.input} border-[#333]`}`}
                            />
                            <button
                                type="submit"
                                disabled={searchKey.trim().length < 2}
                                className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                            >
                                Search
                            </button>
                        </form>

                        {searchKey.trim().length >= 2 && (
                            <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto ${isLight ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2a2a2a]'}`}>
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
                                                View all in Daily →
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
                                            No transactions found for "{searchKey.trim()}"
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {searchKey.trim().length > 0 && searchKey.trim().length < 2 && (
                            <p className={`mt-1.5 text-[11px] px-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Type at least 2 characters to search</p>
                        )}
                    </div>
                )}

                {/* Mobile stats strip — compact, not nav */}
                <div className={`md:hidden flex items-center justify-between gap-2 pb-2.5 -mt-1`}>
                    <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-950/30 text-blue-300'}`}>
                        <FontAwesomeIcon icon={faCalendarAlt} className="opacity-70" />
                        {monthLabel}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] tabular-nums">
                        <span className={statTone('income')}>{formatMoney(stats.income, activeViewCurrency)}</span>
                        <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>|</span>
                        <span className={statTone('expense')}>{formatMoney(stats.expenses, activeViewCurrency)}</span>
                        <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>|</span>
                        <span className={`font-bold ${statTone('balance')}`}>{formatMoney(stats.balance, activeViewCurrency)}</span>
                    </div>
                </div>
            </div>

            {/* Mobile drawer — account & utilities only */}
            {mobileOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
                    <aside ref={mobileRef} className={`fixed top-0 left-0 z-50 h-full w-[min(300px,85vw)] md:hidden flex flex-col ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#0c0c0c] border-r border-[#222]'}`}>
                        <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-slate-100' : 'border-[#222]'}`}>
                            <div>
                                <p className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Menu</p>
                                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Viewing: {activeLabel}</p>
                            </div>
                            <button type="button" onClick={() => setMobileOpen(false)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'hover:bg-slate-100' : 'hover:bg-[#1a1a1a]'}`}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                            <div className={`rounded-xl p-3 grid grid-cols-3 gap-2 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-[#111] border border-[#252525]'}`}>
                                {[
                                    { l: 'Income', v: stats.income, t: 'income' },
                                    { l: 'Spent', v: stats.expenses, t: 'expense' },
                                    { l: 'Balance', v: stats.balance, t: 'balance' },
                                ].map(s => (
                                    <div key={s.l} className="text-center">
                                        <p className={`text-[9px] uppercase font-semibold ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.l}</p>
                                        <p className={`text-xs font-bold tabular-nums ${statTone(s.t)}`}>{formatMoney(s.v, activeViewCurrency)}</p>
                                    </div>
                                ))}
                            </div>

                            <p className={`text-[10px] font-semibold uppercase tracking-wider px-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Shortcuts</p>
                            <div className="space-y-1">
                                {[
                                    { label: 'Log expense', tab: 'daily', icon: faPlus },
                                    { label: 'Monthly budget', tab: 'monthly', icon: faCalendarAlt },
                                    { label: 'Export report', tab: 'summary', icon: faFileExport },
                                    { label: 'Settings', tab: 'settings', icon: faGear },
                                ].map(a => (
                                    <button key={a.tab} type="button" onClick={() => jumpTo(a.tab)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-gray-300 hover:bg-[#161616]'}`}>
                                        <FontAwesomeIcon icon={a.icon} className="w-4 text-xs opacity-50" /> {a.label}
                                    </button>
                                ))}
                            </div>

                            <p className={`text-[10px] font-semibold uppercase tracking-wider px-1 pt-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Account</p>
                            <div className={`flex items-center justify-between gap-4 px-3 py-3 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-white text-slate-500 shadow-sm' : 'bg-[#1a1a1a] text-gray-400'}`}>
                                        <FontAwesomeIcon icon={faCircleHalfStroke} className="text-xs" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Appearance</p>
                                        <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{isLight ? 'Light' : 'Dark'}</p>
                                    </div>
                                </div>
                                <ThemeToggle theme={theme} onChange={changeTheme} isLight={isLight} />
                            </div>
                            <button type="button" onClick={signOut}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isLight ? 'text-rose-600 hover:bg-rose-50' : 'text-red-400 hover:bg-red-500/10'}`}>
                                <FontAwesomeIcon icon={faRightFromBracket} className="opacity-70" /> Sign Out
                            </button>
                        </div>

                        {localUser && (
                            <div className={`p-4 border-t ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#222] bg-[#0a0a0a]'}`}>
                                <div className="flex items-center gap-3">
                                    <img src={avatarSrc} alt={userName} className="w-9 h-9 rounded-full object-cover" onError={(e) => { e.target.src = Avatar }} />
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{userName}</p>
                                        <p className={`text-[11px] truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{userEmail}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </>
            )}
        </header>
    )
}

export default Navbar
