import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTimes,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faWallet,
} from '@fortawesome/free-solid-svg-icons'
import { main } from '../../style'
import { SETTINGS_SUB_TABS, VALID_TABS } from '../Pages/Budget/constants'
import {
    getSidebarNavItems,
    LS_SIDEBAR_OPEN_GROUPS,
} from './budgetTabNav'

const NAV_TEXT = 'text-sm font-medium'
const SIDEBAR_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SIDEBAR_TRANSITION = 'transition-all duration-300 ease-out'
const SIDEBAR_WIDTH_TRANSITION = 'transition-[width,min-width,max-width,opacity] duration-300 ease-out'
const DESKTOP_EXPANDED_W = '15rem'
const DESKTOP_COLLAPSED_W = '4.25rem'
const SETTINGS_DROPDOWN_ID = 'settings'

const SidebarCollapseToggle = ({ collapsed, onToggle, isLight }) => {
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar'

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            title={label}
            className={`group absolute top-1/2 -translate-y-1/2 left-full -translate-x-1/2 z-[60]
                flex h-9 w-9 items-center justify-center rounded-full
                transition-all duration-300 ease-out
                hover:scale-105 active:scale-95
                focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/25
                ${isLight
                    ? 'bg-white text-slate-500 shadow-sm shadow-slate-200/70 hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
                    : 'bg-[#0c0c0c] text-gray-500 shadow-md shadow-black/45 hover:bg-[#141414] hover:text-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0c]'}`}
        >
            <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronLeft}
                className="text-[11px] transition-transform duration-300 group-hover:scale-110"
            />
        </button>
    )
}

const SidebarStyles = () => (
    <style>{`
        @keyframes sidebarNavIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sidebarSubIn {
            from { opacity: 0; transform: translateX(-6px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .sidebar-nav-enter { animation: sidebarNavIn 0.35s ${SIDEBAR_EASE} both; }
        .sidebar-sub-enter { animation: sidebarSubIn 0.28s ${SIDEBAR_EASE} both; }
    `}</style>
)

const SubmenuPanel = ({ open, children }) => (
    <div
        className={`grid duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        style={{ transitionProperty: 'grid-template-rows, opacity' }}
        aria-hidden={!open}
    >
        <div className="overflow-hidden">
            <div className={`space-y-0.5 pt-0.5 duration-300 ease-out ${open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}>
                {children}
            </div>
        </div>
    </div>
)

const SidebarNav = ({ showFullNav, renderCollapsedNav, renderFullNav, animateLabels }) => (
    <nav
        className={`sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain space-y-1 ${SIDEBAR_TRANSITION}
            ${showFullNav ? 'px-3 py-4' : 'px-2 py-4'}`}
        role="navigation"
    >
        <div key={showFullNav ? 'expanded' : 'collapsed'} className="space-y-1">
            {showFullNav ? renderFullNav(animateLabels) : renderCollapsedNav()}
        </div>
    </nav>
)

const Sidebar = ({ theme, layoutActive = true, mobileOpen, onClose, collapsed, onToggleCollapse }) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const { budgetSettings, sharedBudgets, viewingBudgetOwner } = useSelector((state) => state.budget)

    const isLight = theme === 'light'
    const tabParam = searchParams.get('tab')
    const sectionParam = searchParams.get('section')
    const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'dashboard'
    const activeSection = SETTINGS_SUB_TABS.includes(sectionParam) ? sectionParam : 'appearance'

    const isViewingShared = !!viewingBudgetOwner
    const viewingRole = isViewingShared
        ? (sharedBudgets.find(s => s.owner?._id === viewingBudgetOwner?.id)?.role || 'viewer')
        : 'owner'
    const isViewer = viewingRole === 'viewer'
    const hiddenTabs = budgetSettings?.hiddenTabs || []

    const navItems = useMemo(
        () => getSidebarNavItems({ isViewer, hiddenTabs }),
        [isViewer, hiddenTabs],
    )

    const [openDropdowns, setOpenDropdowns] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_SIDEBAR_OPEN_GROUPS))
            if (saved && typeof saved === 'object') return saved
        } catch { /* ignore */ }
        return {}
    })

    const [mobileMounted, setMobileMounted] = useState(false)
    const [mobileVisible, setMobileVisible] = useState(false)

    const showFullNav = mobileOpen || !collapsed

    useEffect(() => {
        if (mobileOpen) {
            setMobileMounted(true)
            const frame = requestAnimationFrame(() => setMobileVisible(true))
            return () => cancelAnimationFrame(frame)
        }
        setMobileVisible(false)
        const timer = setTimeout(() => setMobileMounted(false), 320)
        return () => clearTimeout(timer)
    }, [mobileOpen])

    useEffect(() => {
        if (activeTab !== 'settings') return
        setOpenDropdowns((prev) => {
            if (prev[SETTINGS_DROPDOWN_ID]) return prev
            const next = { ...prev, [SETTINGS_DROPDOWN_ID]: true }
            try { localStorage.setItem(LS_SIDEBAR_OPEN_GROUPS, JSON.stringify(next)) } catch { /* ignore */ }
            return next
        })
    }, [activeTab])

    useEffect(() => {
        if (!mobileOpen) return undefined
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prevOverflow
            window.removeEventListener('keydown', onKey)
        }
    }, [mobileOpen, onClose])

    const toggleDropdown = (id) => {
        if (!showFullNav) {
            onToggleCollapse?.()
            setOpenDropdowns((prev) => ({ ...prev, [id]: true }))
            return
        }
        setOpenDropdowns((prev) => {
            const next = { ...prev, [id]: !prev[id] }
            try { localStorage.setItem(LS_SIDEBAR_OPEN_GROUPS, JSON.stringify(next)) } catch { /* ignore */ }
            return next
        })
    }

    const navigateToTab = (tabId, section) => {
        const next = new URLSearchParams(searchParams)
        next.set('tab', tabId)
        if (tabId === 'settings' && section) {
            next.set('section', section)
        } else {
            next.delete('section')
        }
        setSearchParams(next, { replace: true })
        onClose?.()
    }

    const shellCls = isLight
        ? 'bg-white text-slate-700'
        : 'bg-[#0c0c0c] text-gray-300'

    const itemActive = isLight
        ? 'bg-blue-50 text-blue-700'
        : 'bg-blue-950/40 text-blue-300'

    const itemIdle = isLight
        ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        : 'text-gray-400 hover:bg-[#141414] hover:text-gray-100'

    const isSubLinkActive = (link) => activeTab === 'settings' && activeSection === link.section

    const renderTopLink = (item, index, animate) => {
        const isActive = activeTab === item.tabId
        return (
            <button
                key={item.id}
                type="button"
                onClick={() => navigateToTab(item.tabId)}
                title={item.hint || item.label}
                style={animate ? { animationDelay: `${index * 35}ms` } : undefined}
                className={`w-full flex items-center gap-2.5 rounded-lg ${NAV_TEXT} ${SIDEBAR_TRANSITION} text-left px-3 py-2.5
                    hover:translate-x-0.5 active:scale-[0.98]
                    ${animate ? 'sidebar-nav-enter' : ''}
                    ${isActive ? itemActive : itemIdle}`}
                aria-current={isActive ? 'page' : undefined}
            >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SIDEBAR_TRANSITION} ${isActive
                    ? (isLight ? 'bg-blue-100 text-blue-600 scale-105' : 'bg-blue-900/30 text-blue-400 scale-105')
                    : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#141414] text-gray-500')}`}>
                    <FontAwesomeIcon icon={item.icon} className="text-xs" />
                </span>
                <span className={`truncate ${SIDEBAR_TRANSITION} ${showFullNav ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0 overflow-hidden'}`}>
                    {item.label}
                </span>
            </button>
        )
    }

    const renderSubLink = (link, index, animate = false) => {
        const isActive = isSubLinkActive(link)
        return (
            <button
                key={link.section}
                type="button"
                onClick={() => navigateToTab('settings', link.section)}
                title={link.label}
                style={animate ? { animationDelay: `${index * 30}ms` } : undefined}
                className={`w-full flex items-center gap-2.5 rounded-lg ${NAV_TEXT} ${SIDEBAR_TRANSITION} text-left pl-4 pr-3 py-2.5
                    ${animate ? 'sidebar-sub-enter' : ''}
                    hover:translate-x-0.5 active:scale-[0.98]
                    ${isActive ? itemActive : itemIdle}`}
                aria-current={isActive ? 'page' : undefined}
            >
                <FontAwesomeIcon icon={link.icon} className={`text-[10px] w-3.5 shrink-0 ${isActive
                    ? (isLight ? 'text-blue-600' : 'text-blue-400')
                    : (isLight ? 'text-slate-400' : 'text-gray-500')}`}
                />
                <span className="truncate">{link.label}</span>
            </button>
        )
    }

    const renderSettingsDropdown = (item, index, animate) => {
        const isOpen = openDropdowns[item.id] !== false && (openDropdowns[item.id] || activeTab === 'settings')
        const isActive = activeTab === 'settings'
        const panelId = 'sidebar-panel-settings'

        return (
            <div key={item.id} className="mb-1" style={animate ? { animationDelay: `${index * 35}ms` } : undefined}>
                <button
                    type="button"
                    onClick={() => toggleDropdown(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${NAV_TEXT} ${SIDEBAR_TRANSITION}
                        hover:translate-x-0.5 active:scale-[0.98]
                        ${animate ? 'sidebar-nav-enter' : ''}
                        ${isActive
                            ? (isLight ? 'text-blue-600 bg-blue-50/60' : 'text-blue-400 bg-blue-950/20')
                            : itemIdle}`}
                >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SIDEBAR_TRANSITION} ${isActive
                        ? (isLight ? 'bg-blue-100 text-blue-600 scale-105' : 'bg-blue-900/30 text-blue-400 scale-105')
                        : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#141414] text-gray-500')}`}>
                        <FontAwesomeIcon icon={item.icon} className="text-xs" />
                    </span>
                    <span className={`flex-1 text-left truncate ${SIDEBAR_TRANSITION} ${showFullNav ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        {item.label}
                    </span>
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-[10px] shrink-0 duration-300 ease-out ${showFullNav ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    />
                </button>
                <SubmenuPanel open={isOpen}>
                    <div id={panelId} role="group" aria-label="Settings sections">
                        {item.subLinks.map((link, subIndex) => renderSubLink(link, subIndex, isOpen))}
                    </div>
                </SubmenuPanel>
            </div>
        )
    }

    const renderCollapsedIcon = (item, index) => {
        const isActive = item.type === 'link'
            ? activeTab === item.tabId
            : activeTab === 'settings'

        const onClick = () => {
            if (item.type === 'link') {
                navigateToTab(item.tabId)
            } else {
                onToggleCollapse?.()
                setOpenDropdowns((prev) => ({ ...prev, [item.id]: true }))
            }
        }

        return (
            <button
                key={item.id}
                type="button"
                onClick={onClick}
                title={item.label}
                style={{ animationDelay: `${index * 25}ms` }}
                className={`w-full flex items-center justify-center p-2.5 rounded-xl ${SIDEBAR_TRANSITION} ${NAV_TEXT} sidebar-nav-enter
                    hover:scale-105 active:scale-95
                    ${isActive ? itemActive : itemIdle}`}
                aria-current={isActive ? 'page' : undefined}
            >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive
                    ? (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400')
                    : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#141414] text-gray-500')}`}>
                    <FontAwesomeIcon icon={item.icon} className="text-xs" />
                </span>
            </button>
        )
    }

    const renderFullNav = (animate = false) => navItems.map((item, index) =>
        item.type === 'dropdown' ? renderSettingsDropdown(item, index, animate) : renderTopLink(item, index, animate),
    )

    const renderCollapsedNav = () => navItems.map((item, index) => renderCollapsedIcon(item, index))

    const desktopWidth = layoutActive ? (collapsed ? DESKTOP_COLLAPSED_W : DESKTOP_EXPANDED_W) : '0'
    const desktopShowFullNav = layoutActive && !collapsed

    const desktopFooter = (
        <div className={`border-t border-solid text-xs shrink-0 px-4 py-3 ${SIDEBAR_TRANSITION} ${isLight ? 'border-slate-100 text-slate-400' : 'border-[#1a1a1a] text-gray-500'}
            ${desktopShowFullNav ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden py-0'}`}
        >
            {isViewingShared
                ? `Shared · ${viewingBudgetOwner?.username || 'budget'}`
                : 'Personal budget'}
        </div>
    )

    const navProps = { showFullNav, renderCollapsedNav, renderFullNav }

    const mobileDrawer = layoutActive && mobileMounted ? createPortal(
        <div className="lg:hidden fixed inset-0 z-[200]">
            <button
                type="button"
                aria-label="Close navigation"
                onClick={onClose}
                className={`absolute inset-0 bg-black/60 duration-300 ease-out ${mobileVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionProperty: 'opacity' }}
            />
            <aside
                className={`${main.font} absolute inset-y-0 left-0 w-full max-w-none h-full flex flex-col shadow-2xl duration-300 ease-out ${shellCls}
                    ${mobileVisible ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ transitionProperty: 'transform' }}
                role="dialog"
                aria-modal="true"
                aria-label="Budget navigation"
            >
                <div className={`flex items-center justify-between gap-3 px-4 py-4 border-b border-solid shrink-0 ${isLight ? 'border-slate-100' : 'border-[#1a1a1a]'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLight ? 'bg-gradient-to-br from-blue-600 to-indigo-500 text-white' : 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'}`}>
                            <FontAwesomeIcon icon={faWallet} className="text-sm" />
                        </div>
                        <span className={`text-base font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>Menu</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-[#161616] text-gray-300'}`}
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-base" />
                    </button>
                </div>
                <SidebarNav {...navProps} showFullNav animateLabels />
                <div className={`border-t border-solid text-xs shrink-0 px-4 py-4 ${isLight ? 'border-slate-100 text-slate-400' : 'border-[#1a1a1a] text-gray-500'}`}>
                    {isViewingShared
                        ? `Shared · ${viewingBudgetOwner?.username || 'budget'}`
                        : 'Personal budget'}
                </div>
            </aside>
        </div>,
        document.body,
    ) : null

    return (
        <>
            <SidebarStyles />
            {mobileDrawer}

            <div
                className={`hidden lg:block relative shrink-0 h-full overflow-visible ${SIDEBAR_WIDTH_TRANSITION}
                    ${layoutActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ width: desktopWidth, minWidth: desktopWidth, maxWidth: desktopWidth }}
                aria-hidden={!layoutActive}
            >
                <div className="h-full w-full overflow-hidden">
                    <aside
                        className={`${main.font} h-full flex flex-col overflow-hidden border-r border-solid ${SIDEBAR_TRANSITION} ${shellCls}
                            ${layoutActive ? (isLight ? 'border-slate-200/90' : 'border-[#1f1f1f]') : 'border-transparent'}`}
                        aria-label="Budget navigation"
                        aria-expanded={desktopShowFullNav}
                    >
                        <SidebarNav {...navProps} showFullNav={desktopShowFullNav} animateLabels={layoutActive && !collapsed} />
                        {desktopFooter}
                    </aside>
                </div>

                {layoutActive && (
                    <SidebarCollapseToggle
                        collapsed={collapsed}
                        onToggle={onToggleCollapse}
                        isLight={isLight}
                    />
                )}
            </div>
        </>
    )
}

export default Sidebar
