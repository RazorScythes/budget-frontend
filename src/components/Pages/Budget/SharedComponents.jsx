import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'

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
