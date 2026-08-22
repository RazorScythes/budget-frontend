import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes, faUserPlus, faUsers, faLock,
    faSpinner, faSearch, faTrash, faCheck, faShieldHalved,
    faTag,
} from '@fortawesome/free-solid-svg-icons'
import { searchBudgetUsers } from '../../../endpoint'
import { ModalOverlay } from './SharedComponents'

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
    }

    return createPortal(
        <div className="fixed right-4 bottom-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto max-w-md z-[10050] pointer-events-none">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-solid shadow-lg text-sm font-medium pointer-events-auto ${variants[toast.variant] || variants.info}`}>
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

const SharedMemberRow = ({ user, isLight, onRemove, removingId, setRemovingId, onToast }) => {
    const uid = typeof user === 'object' ? user._id : user
    const name = typeof user === 'object' ? user.username : user
    const avatar = typeof user === 'object' ? user.avatar : null
    const isRemoving = removingId === uid

    const handleRemove = async () => {
        try {
            await onRemove(uid)
            onToast(`Removed access for ${name}`, 'success')
            setRemovingId(null)
        } catch (err) {
            onToast(err?.alert?.message || err?.message || 'Failed to remove access', 'danger')
        }
    }

    return (
        <div className={`flex items-center gap-3 px-3.5 py-3 rounded-lg border border-solid transition-colors ${
            isLight ? 'bg-slate-50/80 border-slate-100 hover:border-slate-200' : 'bg-[#111] border-[#1f1f1f] hover:border-[#2a2a2a]'
        }`}>
            {avatar ? (
                <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-300'
                }`}>
                    {(name || '?')[0]?.toUpperCase()}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{name}</p>
                <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Can use this category on expenses</p>
            </div>
            {isRemoving ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={handleRemove} className="px-2.5 py-1 rounded-md text-sm font-semibold bg-red-500 text-white hover:bg-red-600">Remove</button>
                    <button type="button" onClick={() => setRemovingId(null)} className={`px-2.5 py-1 rounded-md text-sm font-medium ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#1a1a1a]'}`}>Cancel</button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setRemovingId(uid)}
                    title="Remove access"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`}
                >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
            )}
        </div>
    )
}

const ShareCategoryModal = ({
    category,
    isLight,
    onClose,
    onShare,
    onUnshare,
}) => {
    const [username, setUsername] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [isSharing, setIsSharing] = useState(false)
    const [removingId, setRemovingId] = useState(null)
    const [toast, setToast] = useState(null)
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const searchRef = useRef(null)
    const debounceRef = useRef(null)

    const members = category?.sharedWith || []
    const inviteValue = selectedUser?.username || username
    const canShare = inviteValue.trim().length > 0 && !isSharing

    const showToast = useCallback((message, variant = 'info') => {
        setToast({ message, variant })
    }, [])

    const dismissToast = useCallback(() => setToast(null), [])

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
        setUsername(user.username)
        setShowDropdown(false)
        setSearchResults([])
    }

    const handleShare = async () => {
        if (!canShare) return
        setIsSharing(true)
        try {
            const identifier = selectedUser?.username || username.trim()
            await onShare(identifier)
            setUsername('')
            setSelectedUser(null)
            showToast(`Shared "${category.name}" with ${identifier}`, 'success')
        } catch (err) {
            showToast(err?.alert?.message || err?.message || 'Failed to share category', 'danger')
        } finally {
            setIsSharing(false)
        }
    }

    const handleRemove = async (targetUserId) => {
        await onUnshare(targetUserId)
    }

    if (!category) return null

    const typeLabel = category.type === 'income' ? 'Income' : 'Expense'

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
                                <h3 className={`text-2xl font-semibold leading-tight truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    Share "{category.name}"
                                </h3>
                                <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                    Let others record {typeLabel.toLowerCase()} transactions under this category
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1f1f1f] text-gray-500'}`}
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-5 max-h-[min(62vh,460px)] overflow-y-auto">
                        {/* Invite */}
                        <section ref={searchRef} className="relative">
                            <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                <FontAwesomeIcon icon={faSearch} className="text-xs" />
                                Search username or email
                            </label>
                            <div className={`flex rounded-xl border border-solid overflow-hidden focus-within:ring-2 transition-shadow ${
                                isLight
                                    ? 'border-slate-200 bg-slate-50 focus-within:ring-emerald-500/20 focus-within:border-emerald-300'
                                    : 'border-[#2a2a2a] bg-[#111] focus-within:ring-emerald-500/20 focus-within:border-emerald-700'
                            }`}>
                                <span className={`flex items-center px-3 border-r border-solid ${isLight ? 'text-slate-400 border-slate-200 bg-white' : 'text-gray-500 border-[#2a2a2a] bg-[#0a0a0a]'}`}>
                                    {searchLoading ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                                    ) : (
                                        <FontAwesomeIcon icon={faSearch} className="text-xs" />
                                    )}
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => { setUsername(e.target.value); setSelectedUser(null) }}
                                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                    placeholder="Type username or email…"
                                    className={`flex-1 px-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none ${isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-gray-100 placeholder:text-gray-600'}`}
                                    onKeyDown={e => { if (e.key === 'Enter') handleShare() }}
                                    autoFocus
                                />
                            </div>

                            {showDropdown && searchResults.length > 0 && (
                                <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border border-solid shadow-xl z-[10002] overflow-hidden max-h-44 overflow-y-auto ${
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
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400'}`}>
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

                            <button
                                type="button"
                                onClick={handleShare}
                                disabled={!canShare}
                                className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isLight ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                            >
                                {isSharing ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                ) : (
                                    <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
                                )}
                                {isSharing ? 'Sharing…' : 'Share category'}
                            </button>
                        </section>

                        {/* Members */}
                        <section>
                            <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                                <FontAwesomeIcon icon={faUsers} className="text-xs" />
                                Shared with {members.length > 0 && `(${members.length})`}
                            </label>
                            {members.length > 0 ? (
                                <div className="space-y-2">
                                    {members.map((user, i) => (
                                        <SharedMemberRow
                                            key={typeof user === 'object' ? user._id : `${user}-${i}`}
                                            user={user}
                                            isLight={isLight}
                                            onRemove={handleRemove}
                                            removingId={removingId}
                                            setRemovingId={setRemovingId}
                                            onToast={showToast}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className={`flex flex-col items-center py-7 px-5 rounded-lg border border-dashed ${
                                    isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#2a2a2a] bg-[#111]/50'
                                }`}>
                                    <FontAwesomeIcon icon={faLock} className={`text-sm mb-2.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                                    <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Not shared yet</p>
                                    <p className={`text-sm text-center mt-1 max-w-[260px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                        Search for someone above to give them access to this category
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className={`px-6 py-4 border-t border-solid flex items-center gap-2.5 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <FontAwesomeIcon icon={faTag} className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                            Shared users can select this category when logging expenses or income.
                        </p>
                    </div>
                </div>
            </ModalOverlay>
            <ModalToast toast={toast} isLight={isLight} onDismiss={dismissToast} />
        </>
    )
}

export default ShareCategoryModal
