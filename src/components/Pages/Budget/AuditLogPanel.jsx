import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHistory, faSpinner, faSyncAlt, faSearch, faPlus, faPen, faTrash,
    faShare, faCogs, faWallet, faPiggyBank, faHandHoldingUsd, faListAlt,
    faTags, faCheckCircle, faExchangeAlt, faFileExport, faUserFriends,
    faChevronDown, faChevronUp, faInbox,
} from '@fortawesome/free-solid-svg-icons'
import { getBudgetAuditLogs } from '../../../endpoint'
import { AnimateIn, SettingsListSkeleton } from './SharedComponents'

const TAB_FILTERS = [
    { id: '', label: 'All', icon: faHistory },
    { id: 'expenses', label: 'Expenses', icon: faWallet },
    { id: 'categories', label: 'Categories', icon: faTags },
    { id: 'savings', label: 'Savings', icon: faPiggyBank },
    { id: 'debts', label: 'Debts', icon: faHandHoldingUsd },
    { id: 'goals', label: 'Goals', icon: faCheckCircle },
    { id: 'lists', label: 'Lists', icon: faListAlt },
    { id: 'settings', label: 'Settings', icon: faCogs },
    { id: 'sharing', label: 'Sharing', icon: faUserFriends },
]

const ACTION_META = {
    create: { label: 'Created', icon: faPlus, tone: 'emerald' },
    update: { label: 'Updated', icon: faPen, tone: 'blue' },
    delete: { label: 'Deleted', icon: faTrash, tone: 'red' },
    bulk_delete: { label: 'Bulk delete', icon: faTrash, tone: 'red' },
    transfer: { label: 'Transfer', icon: faExchangeAlt, tone: 'violet' },
    import: { label: 'Imported', icon: faFileExport, tone: 'indigo' },
    import_backup: { label: 'Backup', icon: faFileExport, tone: 'indigo' },
    share: { label: 'Shared', icon: faShare, tone: 'sky' },
    unshare: { label: 'Unshared', icon: faShare, tone: 'slate' },
    process_recurring: { label: 'Recurring', icon: faSyncAlt, tone: 'amber' },
    process_interest: { label: 'Interest', icon: faPiggyBank, tone: 'amber' },
    add_contribution: { label: 'Contribution', icon: faPlus, tone: 'emerald' },
    add_payment: { label: 'Payment', icon: faPlus, tone: 'emerald' },
}

const TONE = {
    emerald: { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-900/20 text-emerald-400 border-emerald-800/40', dot: 'bg-emerald-500', icon: 'text-emerald-500' },
    blue: { light: 'bg-blue-50 text-blue-700 border-blue-200', dark: 'bg-blue-900/20 text-blue-400 border-blue-800/40', dot: 'bg-blue-500', icon: 'text-blue-500' },
    red: { light: 'bg-red-50 text-red-700 border-red-200', dark: 'bg-red-900/20 text-red-400 border-red-800/40', dot: 'bg-red-500', icon: 'text-red-500' },
    violet: { light: 'bg-violet-50 text-violet-700 border-violet-200', dark: 'bg-violet-900/20 text-violet-400 border-violet-800/40', dot: 'bg-violet-500', icon: 'text-violet-500' },
    indigo: { light: 'bg-indigo-50 text-indigo-700 border-indigo-200', dark: 'bg-indigo-900/20 text-indigo-400 border-indigo-800/40', dot: 'bg-indigo-500', icon: 'text-indigo-500' },
    sky: { light: 'bg-sky-50 text-sky-700 border-sky-200', dark: 'bg-sky-900/20 text-sky-400 border-sky-800/40', dot: 'bg-sky-500', icon: 'text-sky-500' },
    amber: { light: 'bg-amber-50 text-amber-700 border-amber-200', dark: 'bg-amber-900/20 text-amber-400 border-amber-800/40', dot: 'bg-amber-500', icon: 'text-amber-500' },
    slate: { light: 'bg-slate-100 text-slate-600 border-slate-200', dark: 'bg-[#1a1a1a] text-gray-400 border-[#2B2B2B]', dot: 'bg-slate-400', icon: 'text-slate-400' },
}

const ROLE_META = {
    owner: { label: 'Owner', light: 'bg-amber-50 text-amber-700', dark: 'bg-amber-900/25 text-amber-400' },
    editor: { label: 'Editor', light: 'bg-blue-50 text-blue-700', dark: 'bg-blue-900/25 text-blue-400' },
    viewer: { label: 'Viewer', light: 'bg-slate-100 text-slate-500', dark: 'bg-[#1a1a1a] text-gray-500' },
}

const getActionMeta = (action) => {
    if (!action) return { label: 'Activity', icon: faHistory, tone: 'slate' }
    const key = Object.keys(ACTION_META).find(k => action.includes(k) || action === k)
    return ACTION_META[key] || { label: action.replace(/_/g, ' '), icon: faHistory, tone: 'slate' }
}

const relativeTime = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const dateGroupLabel = (date) => {
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today - target) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return 'This week'
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

const groupLogsByDate = (logs) => {
    const groups = []
    const map = new Map()
    logs.forEach(log => {
        const label = dateGroupLabel(log.createdAt)
        if (!map.has(label)) {
            const entry = { label, items: [] }
            map.set(label, entry)
            groups.push(entry)
        }
        map.get(label).items.push(log)
    })
    return groups
}

const AuditLogPanel = ({ isLight, card, cardP, descCls, titleCls, metaCls }) => {
    const shellCls = cardP || `${card} p-5`
    const descriptionCls = descCls || `text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-500'}`
    const headingCls = titleCls || `text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`
    const captionCls = metaCls || `text-sm ${isLight ? 'text-slate-500' : 'text-gray-500'}`

    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [tabFilter, setTabFilter] = useState('')
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState(true)

    const loadLogs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getBudgetAuditLogs({ limit: 150, ...(tabFilter ? { tab: tabFilter } : {}) })
            setLogs(res.data?.result || [])
        } catch {
            setLogs([])
        } finally {
            setLoading(false)
        }
    }, [tabFilter])

    useEffect(() => { loadLogs() }, [loadLogs])

    const filteredLogs = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return logs
        return logs.filter(log =>
            log.message?.toLowerCase().includes(q) ||
            log.action?.toLowerCase().includes(q) ||
            log.tab?.toLowerCase().includes(q) ||
            (log.actorUsername || log.actor?.username || '').toLowerCase().includes(q)
        )
    }, [logs, search])

    const stats = useMemo(() => {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayCount = logs.filter(l => new Date(l.createdAt) >= todayStart).length
        const editorCount = logs.filter(l => l.actorRole === 'editor').length
        const tabCounts = {}
        logs.forEach(l => { tabCounts[l.tab] = (tabCounts[l.tab] || 0) + 1 })
        const topTab = Object.entries(tabCounts).sort((a, b) => b[1] - a[1])[0]
        return { total: logs.length, today: todayCount, editors: editorCount, topTab: topTab ? topTab[0] : null }
    }, [logs])

    const grouped = useMemo(() => groupLogsByDate(filteredLogs), [filteredLogs])

    const chipCls = (active) => `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border border-solid ${
        active
            ? (isLight ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-violet-900/20 text-violet-300 border-violet-800/40')
            : (isLight ? 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'bg-[#111] text-gray-400 border-[#2B2B2B] hover:border-[#444] hover:bg-[#161616]')
    }`

    return (
        <AnimateIn delay={600}>
            <div className={shellCls}>
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLight ? 'bg-violet-50' : 'bg-violet-900/20'}`}>
                            <FontAwesomeIcon icon={faHistory} className={`text-sm ${isLight ? 'text-violet-500' : 'text-violet-400'}`} />
                        </div>
                        <div>
                            <h3 className={headingCls}>Activity Log</h3>
                            <p className={descriptionCls}>Track changes made by you and shared collaborators</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadLogs}
                            disabled={loading}
                            title="Refresh"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                                isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                            }`}
                        >
                            <FontAwesomeIcon icon={faSyncAlt} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpanded(v => !v)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                isLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                            }`}
                            aria-expanded={expanded}
                        >
                            <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-xs" />
                        </button>
                    </div>
                </div>

                {expanded && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {[
                                { label: 'Total events', value: stats.total, accent: isLight ? 'text-violet-600' : 'text-violet-400' },
                                { label: 'Today', value: stats.today, accent: isLight ? 'text-emerald-600' : 'text-emerald-400' },
                                { label: 'By editors', value: stats.editors, accent: isLight ? 'text-blue-600' : 'text-blue-400' },
                                { label: 'Most active', value: stats.topTab ? stats.topTab.charAt(0).toUpperCase() + stats.topTab.slice(1) : '—', accent: isLight ? 'text-slate-700' : 'text-gray-200', small: true },
                            ].map((s, i) => (
                                <div key={i} className={`rounded-xl px-3 py-2.5 border border-solid ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#111] border-[#1f1f1f]'}`}>
                                    <p className={`text-sm uppercase tracking-wider font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</p>
                                    <p className={`font-bold mt-0.5 truncate ${s.small ? 'text-sm capitalize' : 'text-lg'} ${s.accent}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Search + filters */}
                        <div className="space-y-3 mb-4">
                            <div className="relative">
                                <FontAwesomeIcon icon={faSearch} className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search activity…"
                                    className={`w-full pl-8 pr-3 py-2 rounded-xl text-sm border border-solid outline-none focus:ring-2 focus:ring-violet-500/20 ${
                                        isLight ? 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400' : 'bg-[#0a0a0a] border-[#2B2B2B] text-gray-200 placeholder:text-gray-600'
                                    }`}
                                />
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
                                {TAB_FILTERS.map(t => (
                                    <button key={t.id || 'all'} type="button" onClick={() => setTabFilter(t.id)} className={chipCls(tabFilter === t.id)}>
                                        <FontAwesomeIcon icon={t.icon} className="text-xs opacity-70" />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Timeline */}
                        {loading ? (
                            <div className={`py-3 px-2 rounded-xl ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <SettingsListSkeleton isLight={isLight} rows={5} />
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-14 rounded-xl border border-dashed ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#111] border-[#2B2B2B]'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isLight ? 'bg-white shadow-sm' : 'bg-[#1a1a1a]'}`}>
                                    <FontAwesomeIcon icon={faInbox} className={`text-lg ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                                </div>
                                <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {search || tabFilter ? 'No matching activity' : 'No activity yet'}
                                </p>
                                <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {search || tabFilter ? 'Try a different filter or search term' : 'Changes to your budget will appear here'}
                                </p>
                            </div>
                        ) : (
                            <div className={`max-h-[28rem] overflow-y-auto rounded-xl border border-solid pr-1 ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#0a0a0a]/50'}`}>
                                <div className="p-3 sm:p-4 space-y-5">
                                    {grouped.map(group => (
                                        <div key={group.label}>
                                            <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 py-1 backdrop-blur-sm">
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                    isLight ? 'bg-white text-slate-500 shadow-sm' : 'bg-[#141414] text-gray-400'
                                                }`}>
                                                    {group.label}
                                                </span>
                                                <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-[#2B2B2B]'}`} />
                                                <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>{group.items.length}</span>
                                            </div>

                                            <div className="relative pl-4 sm:pl-5 space-y-2">
                                                <div className={`absolute left-[7px] sm:left-[9px] top-1 bottom-1 w-px ${isLight ? 'bg-slate-200' : 'bg-[#2B2B2B]'}`} />

                                                {group.items.map(log => {
                                                    const meta = getActionMeta(log.action)
                                                    const tone = TONE[meta.tone] || TONE.slate
                                                    const role = ROLE_META[log.actorRole] || ROLE_META.viewer
                                                    const username = log.actorUsername || log.actor?.username || 'Unknown'
                                                    const initials = username.slice(0, 2).toUpperCase()

                                                    return (
                                                        <div key={log._id} className="relative flex gap-3 group">
                                                            <div className={`absolute -left-4 sm:-left-5 top-3.5 w-[15px] h-[15px] rounded-full border-2 border-solid flex items-center justify-center z-[1] ${
                                                                isLight ? 'bg-white border-slate-100' : 'bg-[#141414] border-[#2B2B2B]'
                                                            }`}>
                                                                <div className={`w-2 h-2 rounded-full ${tone.dot}`} />
                                                            </div>

                                                            <div className={`flex-1 min-w-0 rounded-xl border border-solid p-3 transition-colors ${
                                                                isLight
                                                                    ? 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                                                    : 'bg-[#141414] border-[#1f1f1f] hover:border-[#333]'
                                                            }`}>
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                                                        isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1a1a1a] text-gray-400'
                                                                    }`}>
                                                                        {initials}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                                                            {log.message}
                                                                        </p>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md border border-solid ${isLight ? tone.light : tone.dark}`}>
                                                                                <FontAwesomeIcon icon={meta.icon} className="text-[8px]" />
                                                                                {meta.label}
                                                                            </span>
                                                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md capitalize ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-500'}`}>
                                                                                {log.tab}
                                                                            </span>
                                                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${isLight ? role.light : role.dark}`}>
                                                                                {role.label}
                                                                            </span>
                                                                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                                {username}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-shrink-0 text-right">
                                                                        <span
                                                                            className={`text-sm font-medium block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}
                                                                            title={new Date(log.createdAt).toLocaleString()}
                                                                        >
                                                                            {relativeTime(log.createdAt)}
                                                                        </span>
                                                                        <span className={`text-xs ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                            {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredLogs.length > 0 && (
                            <p className={`text-sm text-center mt-3 ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>
                                Showing {filteredLogs.length} of {logs.length} events · newest first
                            </p>
                        )}
                    </>
                )}
            </div>
        </AnimateIn>
    )
}

export default AuditLogPanel
