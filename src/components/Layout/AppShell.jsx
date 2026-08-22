import React, { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../Custom/Navbar'
import Sidebar from './Sidebar'
import { LS_SIDEBAR_COLLAPSED } from './budgetTabNav'
import { PAGE_LAYOUT_TRANSITION_MS } from '../../utils/appearanceCache'

const AppShell = ({ user, theme, setTheme, setUser, sidebarEnabled = true }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(LS_SIDEBAR_COLLAPSED) === '1' } catch { return false }
    })

    const closeMobileSidebar = useCallback(() => setSidebarOpen(false), [])

    const toggleCollapse = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev
            try { localStorage.setItem(LS_SIDEBAR_COLLAPSED, next ? '1' : '0') } catch { /* ignore */ }
            return next
        })
    }, [])

    return (
        <div className="flex flex-col h-[100dvh] w-full overflow-hidden">
            <Navbar
                theme={theme}
                setTheme={setTheme}
                setUser={setUser}
                sidebarLayout={sidebarEnabled}
                onMenuToggle={sidebarEnabled ? () => setSidebarOpen(true) : undefined}
            />
            <div className="flex flex-1 min-h-0 w-full min-w-0 overflow-visible">
                <Sidebar
                    theme={theme}
                    layoutActive={sidebarEnabled}
                    mobileOpen={sidebarOpen}
                    onClose={closeMobileSidebar}
                    collapsed={collapsed}
                    onToggleCollapse={toggleCollapse}
                />
                <main
                    className="relative z-0 flex-1 min-w-0 w-full h-full overflow-y-auto overflow-x-hidden transition-[flex-grow,padding] duration-300 ease-out"
                    style={{ transitionDuration: `${PAGE_LAYOUT_TRANSITION_MS}ms` }}
                >
                    <Outlet context={{ user, theme }} />
                </main>
            </div>
        </div>
    )
}

export default AppShell
