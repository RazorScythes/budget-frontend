import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

export const ModalOverlay = ({ children, onClose, className = '', isLight }) => {
    const overlayRef = useRef(null)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        const scrollY = window.scrollY
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = '0'
        document.body.style.right = '0'
        document.body.style.width = '100%'

        const themeEl = document.querySelector('[data-theme]')
        const theme = isLight !== undefined
            ? (isLight ? 'light' : 'dark')
            : (themeEl?.getAttribute('data-theme') || 'dark')
        document.body.dataset.modalOpen = 'true'
        document.body.dataset.modalTheme = theme
        document.body.style.backgroundColor = theme === 'light' ? '#f1f5f9' : '#0e0e0e'

        const handleKey = (e) => { if (e.key === 'Escape') onCloseRef.current() }
        window.addEventListener('keydown', handleKey)

        const focusable = overlayRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusable?.length) focusable[0].focus()

        return () => {
            document.body.style.overflow = ''
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.left = ''
            document.body.style.right = ''
            document.body.style.width = ''
            document.body.style.backgroundColor = ''
            delete document.body.dataset.modalOpen
            delete document.body.dataset.modalTheme
            window.removeEventListener('keydown', handleKey)
            window.scrollTo(0, scrollY)
        }
    }, [isLight])

    return createPortal(
        <div
            ref={overlayRef}
            className={`fixed z-[9999] ${className}`}
            style={{
                top: 0,
                left: 0,
                width: '100vw',
                height: '100dvh',
                maxWidth: '100vw',
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute bg-black/75 backdrop-blur-sm"
                style={{ inset: 0, width: '100%', height: '100%' }}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none"
                style={{ width: '100%', height: '100%' }}
            >
                <div className="pointer-events-auto relative w-full flex justify-center my-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

export const DeleteConfirmModal = ({ isLight, onConfirm, onCancel, title = 'Delete', message = 'Are you sure? You can undo this from the notification.', confirmLabel = 'Delete' }) => {
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
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all ${confirmLabel === 'Add anyway' ? 'bg-amber-500' : 'bg-red-500 hover:bg-red-600'}`}>{confirmLabel}</button>
                </div>
            </div>
        </ModalOverlay>
    )
}

export const AnimateIn = ({ children, delay = 0, className = '' }) => {
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

export const SafeIcon = ({ name, cls, style }) => {
    if (!name || name === 'peso-sign') return <span className={cls} style={style}>₱</span>
    try { return <FontAwesomeIcon icon={['fas', name]} className={cls} style={style} /> }
    catch { return <FontAwesomeIcon icon={faCogs} className={`${cls} opacity-20`} style={style} /> }
}

/** Pill sub-tab bar — same design as Settings (rounded container, template-aware active state). */
export const SubTabBar = ({ tabs, activeId, onChange, isLight, templateStyles, renderBadge }) => (
    <div className={`flex flex-wrap gap-1 p-1 rounded-xl border border-solid ${
        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#111] border-[#2B2B2B]'
    }`}>
        {tabs.map(tab => {
            const active = activeId === tab.id
            return (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                            ? (templateStyles?.tabActive || (isLight ? 'bg-white text-slate-800 shadow-sm' : 'bg-[#1a1a1a] text-white'))
                            : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-white/60' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]/60')
                    }`}
                >
                    {tab.icon && <FontAwesomeIcon icon={tab.icon} className="text-xs" />}
                    {tab.label}
                    {renderBadge?.(tab, active)}
                </button>
            )
        })}
    </div>
)

const skeletonPulse = (isLight) => `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

export const SettingsPanelSkeleton = ({ isLight, cards = 2, className = '' }) => (
    <div className={`space-y-4 ${className}`} aria-busy="true" aria-label="Loading settings">
        {Array.from({ length: cards }).map((_, i) => (
            <div
                key={i}
                className={`rounded-xl border border-solid p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}
            >
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${skeletonPulse(isLight)}`} />
                    <div className="flex-1 space-y-2">
                        <div className={`h-3.5 w-28 ${skeletonPulse(isLight)}`} />
                        <div className={`h-3 w-44 max-w-full ${skeletonPulse(isLight)}`} />
                    </div>
                </div>
                <div className="space-y-2.5">
                    <div className={`h-9 w-full ${skeletonPulse(isLight)}`} />
                    <div className={`h-9 w-full ${skeletonPulse(isLight)}`} />
                    {i === 0 && <div className={`h-20 w-full ${skeletonPulse(isLight)}`} />}
                </div>
            </div>
        ))}
    </div>
)

export const SettingsListSkeleton = ({ isLight, rows = 4, className = '' }) => (
    <div className={`space-y-2 ${className}`} aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }).map((_, i) => (
            <div
                key={i}
                className={`rounded-lg px-3 py-2.5 ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}
            >
                <div className={`h-3 w-3/5 mb-2 ${skeletonPulse(isLight)}`} />
                <div className={`h-2.5 w-2/5 ${skeletonPulse(isLight)}`} />
            </div>
        ))}
    </div>
)
