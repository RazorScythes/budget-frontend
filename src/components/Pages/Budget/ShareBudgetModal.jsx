import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes, faUserPlus, faEye, faPen, faTrash,
    faUsers, faLock, faSpinner, faShieldHalved, faLink,
    faCopy, faSyncAlt, faSearch, faQrcode, faClock, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { ModalOverlay } from './SharedComponents'
import {
    searchBudgetUsers, getBudgetShareLink,
    createBudgetShareLink, refreshBudgetShareLink,
} from '../../../endpoint'

const ROLES = [
    { id: 'viewer', label: 'Viewer', icon: faEye, description: 'Can view expenses, charts, and reports' },
    { id: 'editor', label: 'Editor', icon: faPen, description: 'Can add, edit, and delete budget data' },
]

const EXPIRY_OPTIONS = [
    { value: 1, label: '1 hour' },
    { value: 24, label: '24 hours' },
    { value: 168, label: '7 days' },
    { value: 720, label: '30 days' },
]

const ModalToast = ({ toast, isLight, onDismiss }) => {
    useEffect(() => {
        if (!toast?.message) return
        const t = setTimeout(onDismiss, 4000)
        return () => clearTimeout(t)
    }, [toast?.message, onDismiss])

    if (!toast?.message) return null

    const variants = {
        success: isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-900/30 border-emerald-800/50 text-emerald-200',
        danger: isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-900/30 border-red-800/50 text-red-200',
        info: isLight ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-blue-900/30 border-blue-800/50 text-blue-200',
        warning: isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-900/30 border-amber-800/50 text-amber-200',
    }

    return createPortal(
        <div className="fixed right-4 bottom-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto max-w-md z-[10050] pointer-events-none">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-solid shadow-lg text-sm font-medium pointer-events-auto transition-all duration-300 ${variants[toast.variant] || variants.info}`}>
                <FontAwesomeIcon icon={toast.variant === 'success' ? faCheck : faShieldHalved} className="text-xs flex-shrink-0" />
                <span className="flex-1 min-w-0">{toast.message}</span>
                <button type="button" onClick={onDismiss} className="opacity-60 hover:opacity-100 p-0.5">
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                </button>
            </div>
        </div>,
        document.body
    )
}

const RolePicker = ({ value, onChange, isLight, compact = false }) => (
    <div className={`grid grid-cols-2 gap-2.5 ${compact ? '' : 'mt-4'}`}>
        {ROLES.map(role => {
            const active = value === role.id
            return (
                <button
                    key={role.id}
                    type="button"
                    onClick={() => onChange(role.id)}
                    className={`text-left rounded-lg border border-solid transition-all ${compact ? 'px-3 py-2.5' : 'px-3.5 py-3'} ${
                        active
                            ? (isLight ? 'border-blue-300 bg-blue-50' : 'border-blue-700 bg-blue-900/25')
                            : (isLight ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50' : 'border-[#2a2a2a] bg-[#111] hover:border-[#333] hover:bg-[#151515]')
                    }`}
                >
                    <div className="flex items-start gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            active ? (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400')
                        }`}>
                            <FontAwesomeIcon icon={role.icon} className="text-xs" />
                        </span>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{role.label}</p>
                            {!compact && (
                                <p className={`text-sm mt-0.5 leading-snug ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{role.description}</p>
                            )}
                        </div>
                    </div>
                </button>
            )
        })}
    </div>
)

const MemberRow = ({ share, isLight, onUpdateRole, onRemove, removingId, setRemovingId, onToast }) => {
    const su = share.sharedWith
    if (!su) return null
    const isRemoving = removingId === su._id

    const handleRemove = async () => {
        try {
            await onRemove(su._id)
            onToast('Access revoked', 'success')
            setRemovingId(null)
        } catch (err) {
            onToast(err?.alert?.message || 'Failed to remove access', 'danger')
        }
    }

    return (
        <div className={`group flex items-center gap-3 px-3.5 py-3 rounded-lg border border-solid transition-colors ${
            isLight ? 'bg-slate-50/80 border-slate-100 hover:border-slate-200' : 'bg-[#111] border-[#1f1f1f] hover:border-[#2a2a2a]'
        }`}>
            {su.avatar ? (
                <img src={su.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-300'
                }`}>
                    {su.username?.[0]?.toUpperCase() || '?'}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{su.username}</p>
                <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                    {share.role === 'editor' ? 'Can edit budget' : 'View only access'}
                </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`flex rounded-lg p-0.5 border border-solid ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-[#2a2a2a]'}`}>
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            type="button"
                            title={role.label}
                            onClick={() => share.role !== role.id && onUpdateRole(su._id, role.id)}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                                share.role === role.id
                                    ? (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                                    : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')
                            }`}
                        >
                            <FontAwesomeIcon icon={role.icon} className="text-xs" />
                        </button>
                    ))}
                </div>
                {isRemoving ? (
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={handleRemove} className="px-2.5 py-1 rounded-md text-sm font-semibold bg-red-500 text-white hover:bg-red-600">Remove</button>
                        <button type="button" onClick={() => setRemovingId(null)} className={`px-2.5 py-1 rounded-md text-sm font-medium ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#1a1a1a]'}`}>Cancel</button>
                    </div>
                ) : (
                    <button type="button" onClick={() => setRemovingId(su._id)} title="Remove access"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`}>
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                )}
            </div>
        </div>
    )
}

const formatExpiry = (expiresAt) => {
    if (!expiresAt) return ''
    const d = new Date(expiresAt)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ShareBudgetModal = ({
    isLight,
    sharedUsers,
    username,
    onUsernameChange,
    role,
    onRoleChange,
    onInvite,
    onUpdateRole,
    onRemove,
    onClose,
    externalAlert,
}) => {
    const [tab, setTab] = useState('invite')
    const [isInviting, setIsInviting] = useState(false)
    const [removingId, setRemovingId] = useState(null)
    const [toast, setToast] = useState(null)
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const searchRef = useRef(null)
    const debounceRef = useRef(null)

    const [shareLink, setShareLink] = useState(null)
    const [linkLoading, setLinkLoading] = useState(true)
    const [linkRefreshing, setLinkRefreshing] = useState(false)
    const [expiresInHours, setExpiresInHours] = useState(24)
    const [linkRole, setLinkRole] = useState('viewer')
    const [copied, setCopied] = useState(false)

    const members = sharedUsers.filter(s => s.sharedWith)
    const inviteValue = selectedUser?.username || username
    const canInvite = inviteValue.trim().length > 0 && !isInviting

    const showToast = useCallback((message, variant = 'info') => {
        setToast({ message, variant })
    }, [])

    const dismissToast = useCallback(() => setToast(null), [])

    useEffect(() => {
        if (externalAlert?.message) {
            showToast(externalAlert.message, externalAlert.variant || 'info')
        }
    }, [externalAlert, showToast])

    const loadShareLink = useCallback(async () => {
        setLinkLoading(true)
        try {
            const res = await getBudgetShareLink()
            const link = res.data?.result
            if (link && !link.expired && new Date(link.expiresAt) > new Date()) {
                setShareLink(link)
                setLinkRole(link.role || 'viewer')
            } else {
                setShareLink(null)
            }
        } catch {
            setShareLink(null)
        } finally {
            setLinkLoading(false)
        }
    }, [])

    useEffect(() => {
        loadShareLink()
    }, [loadShareLink])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        const q = username.trim()
        if (q.length < 2) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }
        debounceRef.current = setTimeout(async () => {
            setSearchLoading(true)
            try {
                const res = await searchBudgetUsers({ q })
                setSearchResults(res.data?.result || [])
                setShowDropdown(true)
            } catch {
                setSearchResults([])
            } finally {
                setSearchLoading(false)
            }
        }, 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [username])

    const handleSelectUser = (user) => {
        setSelectedUser(user)
        onUsernameChange(user.username)
        setShowDropdown(false)
        setSearchResults([])
    }

    const handleInvite = async () => {
        if (!canInvite) return
        setIsInviting(true)
        try {
            const identifier = selectedUser?.username || username.trim()
            await onInvite(identifier, role)
            onUsernameChange('')
            setSelectedUser(null)
            showToast(`Invited ${identifier} as ${role}`, 'success')
        } catch (err) {
            showToast(err?.alert?.message || err?.message || 'Failed to send invite', 'danger')
        } finally {
            setIsInviting(false)
        }
    }

    const handleGenerateLink = async (refresh = false) => {
        refresh ? setLinkRefreshing(true) : setLinkLoading(true)
        try {
            const fn = refresh ? refreshBudgetShareLink : createBudgetShareLink
            const res = await fn({ role: linkRole, expiresInHours })
            setShareLink(res.data?.result)
            showToast(res.data?.alert?.message || (refresh ? 'Link refreshed' : 'Link created'), 'success')
        } catch (err) {
            showToast(err.response?.data?.alert?.message || 'Failed to update link', 'danger')
        } finally {
            setLinkLoading(false)
            setLinkRefreshing(false)
        }
    }

    const inviteUrl = shareLink?.token
        ? `${window.location.origin}/budget?invite=${shareLink.token}`
        : ''

    const handleCopyLink = async () => {
        if (!inviteUrl) return
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            showToast('Link copied to clipboard', 'success')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            showToast('Could not copy link', 'danger')
        }
    }

    const linkValid = shareLink?.token && shareLink?.expiresAt && new Date(shareLink.expiresAt) > new Date()

    return (
        <>
        <ModalOverlay onClose={onClose} isLight={isLight}>
            <div
                className={`relative w-full max-w-lg rounded-2xl border border-solid shadow-2xl overflow-hidden ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'
                }`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-6 pt-5 pb-4 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className={`text-2xl font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Share Budget</h3>
                            <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Invite people or share a link & QR code</p>
                        </div>
                        <button type="button" onClick={onClose}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}>
                            <FontAwesomeIcon icon={faTimes} className="text-sm" />
                        </button>
                    </div>
                    <div className={`flex gap-1 mt-4 p-1 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-[#111]'}`}>
                        {[
                            { id: 'invite', label: 'Invite', icon: faUserPlus },
                            { id: 'link', label: 'Link & QR', icon: faQrcode },
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                                    tab === t.id
                                        ? (isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-[#1a1a1a] text-blue-400')
                                        : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-gray-500 hover:text-gray-300')
                                }`}
                            >
                                <FontAwesomeIcon icon={t.icon} className="text-xs" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[min(62vh,460px)] overflow-y-auto">
                    {tab === 'invite' && (
                        <>
                            <section ref={searchRef} className="relative">
                                <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                                    Search username or email
                                </label>
                                <div className={`flex rounded-xl border border-solid overflow-hidden focus-within:ring-2 transition-shadow ${
                                    isLight ? 'border-slate-200 bg-slate-50 focus-within:ring-blue-500/20 focus-within:border-blue-300' : 'border-[#2a2a2a] bg-[#111] focus-within:ring-blue-500/20 focus-within:border-blue-700'
                                }`}>
                                    <span className={`flex items-center px-3 border-r border-solid ${isLight ? 'text-slate-400 border-slate-200 bg-white' : 'text-gray-500 border-[#2a2a2a] bg-[#0a0a0a]'}`}>
                                        {searchLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faSearch} className="text-xs" />}
                                    </span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => { onUsernameChange(e.target.value); setSelectedUser(null) }}
                                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                        placeholder="Type username or email…"
                                        className={`flex-1 px-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-gray-100 placeholder:text-gray-600'}`}
                                        onKeyDown={e => { if (e.key === 'Enter') handleInvite() }}
                                        autoFocus
                                    />
                                </div>

                                {showDropdown && searchResults.length > 0 && (
                                    <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border border-solid shadow-xl z-[10002] overflow-hidden max-h-48 overflow-y-auto ${
                                        isLight ? 'bg-white border-slate-200' : 'bg-[#111] border-[#2a2a2a]'
                                    }`}>
                                        {searchResults.map(u => (
                                            <button
                                                key={u._id}
                                                type="button"
                                                onClick={() => handleSelectUser(u)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}
                                            >
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                                                        {u.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{u.username}</p>
                                                    {u.email && (
                                                        <p className={`text-sm mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{u.email}</p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {showDropdown && !searchLoading && username.trim().length >= 2 && searchResults.length === 0 && (
                                    <div className={`absolute left-0 right-0 top-full mt-1 px-3 py-2.5 rounded-xl border border-solid text-sm ${
                                        isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#111] border-[#2a2a2a] text-gray-500'
                                    }`}>
                                        No users found
                                    </div>
                                )}

                                <RolePicker value={role} onChange={onRoleChange} isLight={isLight} />

                                <button type="button" onClick={handleInvite} disabled={!canInvite}
                                    className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                    {isInviting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faUserPlus} className="text-xs" />}
                                    {isInviting ? 'Sending invite…' : 'Send invite'}
                                </button>
                            </section>

                            <section>
                                <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                    <FontAwesomeIcon icon={faUsers} className="text-xs" />
                                    People with access {members.length > 0 && `(${members.length})`}
                                </label>
                                {members.length > 0 ? (
                                    <div className="space-y-2">
                                        {members.map(s => (
                                            <MemberRow key={s._id} share={s} isLight={isLight} onUpdateRole={onUpdateRole} onRemove={onRemove}
                                                removingId={removingId} setRemovingId={setRemovingId} onToast={showToast} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`flex flex-col items-center py-7 px-5 rounded-lg border border-dashed ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#2a2a2a] bg-[#111]/50'}`}>
                                        <FontAwesomeIcon icon={faLock} className={`text-sm mb-2.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                        <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Your budget is private</p>
                                        <p className={`text-sm text-center mt-1 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Search and invite someone above</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {tab === 'link' && (
                        <section className="space-y-5">
                            <div>
                                <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                    <FontAwesomeIcon icon={faClock} className="text-xs" />
                                    Link expiration
                                </label>
                                <select
                                    value={expiresInHours}
                                    onChange={e => setExpiresInHours(Number(e.target.value))}
                                    className={`w-full px-3 py-2.5 rounded-xl border border-solid text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                        isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-[#2a2a2a] bg-[#111] text-gray-200'
                                    }`}
                                >
                                    {EXPIRY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                    Default role for link invites
                                </label>
                                <RolePicker value={linkRole} onChange={setLinkRole} isLight={isLight} compact />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleGenerateLink(false)}
                                    disabled={linkLoading || linkRefreshing}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                >
                                    {linkLoading && !linkRefreshing ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faLink} className="text-xs" />}
                                    {linkValid ? 'Update link' : 'Generate link'}
                                </button>
                                {linkValid && (
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateLink(true)}
                                        disabled={linkRefreshing}
                                        title="Refresh code"
                                        className={`px-4 py-2.5 rounded-xl border border-solid text-sm font-semibold transition-all disabled:opacity-50 ${isLight ? 'border-slate-200 hover:bg-slate-50 text-slate-700' : 'border-[#2a2a2a] hover:bg-[#1a1a1a] text-gray-300'}`}
                                    >
                                        <FontAwesomeIcon icon={faSyncAlt} className={`text-xs ${linkRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                )}
                            </div>

                            {linkValid ? (
                                <div className={`rounded-lg border border-solid p-4 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#2a2a2a] bg-[#111]/50'}`}>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${isLight ? 'bg-white border border-slate-200' : 'bg-[#1a1a1a] border border-[#333]'}`}>
                                            <QRCodeSVG value={inviteUrl} size={96} level="M" includeMargin bgColor={isLight ? '#ffffff' : '#1a1a1a'} fgColor={isLight ? '#0f172a' : '#f1f5f9'} />
                                        </div>
                                        <div className="flex-1 w-full min-w-0 space-y-2">
                                            <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Share link</p>
                                            <div className={`flex rounded-lg border border-solid overflow-hidden ${isLight ? 'border-slate-200 bg-white' : 'border-[#2a2a2a] bg-[#0a0a0a]'}`}>
                                                <input readOnly value={inviteUrl} className={`flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none truncate ${isLight ? 'text-slate-700' : 'text-gray-300'}`} />
                                                <button type="button" onClick={handleCopyLink}
                                                    className={`px-3 py-2 flex items-center gap-1 text-sm font-semibold transition-colors ${isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'}`}>
                                                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                                                    {copied ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                            <p className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                <FontAwesomeIcon icon={faClock} className="text-xs" />
                                                Expires {formatExpiry(shareLink.expiresAt)}
                                            </p>
                                            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                Anyone with this link can join as <strong>{linkRole}</strong> until it expires. Refresh to invalidate the old code.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : !linkLoading && (
                                <div className={`flex flex-col items-center py-7 px-5 rounded-lg border border-dashed ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#2a2a2a] bg-[#111]/50'}`}>
                                    <FontAwesomeIcon icon={faQrcode} className={`text-sm mb-2.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                    <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>No active link</p>
                                    <p className={`text-sm text-center mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Generate a link to share via QR code or URL</p>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <div className={`px-6 py-4 border-t border-solid flex items-center gap-2.5 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <FontAwesomeIcon icon={faShieldHalved} className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        Links expire automatically. Refresh anytime to revoke old codes.
                    </p>
                </div>
            </div>
        </ModalOverlay>
        <ModalToast toast={toast} isLight={isLight} onDismiss={dismissToast} />
        </>
    )
}

export default ShareBudgetModal
