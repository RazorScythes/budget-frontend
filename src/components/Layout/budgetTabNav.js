import {
    faChartPie,
    faCalendarDay,
    faCalendarAlt,
    faTags,
    faPiggyBank,
    faHandHoldingUsd,
    faListAlt,
    faCheckCircle,
    faFilePdf,
    faCogs,
    faEye,
    faWallet,
    faExchangeAlt,
    faDatabase,
    faCircleInfo,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { faChrome } from '@fortawesome/free-brands-svg-icons'

export const TAB_META = {
    dashboard: { label: 'Dashboard', icon: faChartPie, hint: 'Overview & insights' },
    daily: { label: 'Daily Expenses', icon: faCalendarDay, hint: 'Log & track spending' },
    monthly: { label: 'Monthly Budget', icon: faCalendarAlt, hint: 'Plan your month' },
    categories: { label: 'Categories', icon: faTags, hint: 'Review spending' },
    savings: { label: 'Savings', icon: faPiggyBank, hint: 'Grow your savings' },
    debts: { label: 'Debts', icon: faHandHoldingUsd, hint: 'Manage payments' },
    lists: { label: 'Lists', icon: faListAlt, hint: 'Shopping & wishlists' },
    goals: { label: 'Goals', icon: faCheckCircle, hint: 'Track your goals' },
    summary: { label: 'Summary', icon: faFilePdf, hint: 'Reports & export' },
    settings: { label: 'Settings', icon: faCogs, hint: 'Preferences & layout' },
}

/** Same sub-sections as Settings tab in classic layout */
export const SETTINGS_SUB_NAV = [
    { id: 'appearance', label: 'Appearance', icon: faEye },
    { id: 'budget', label: 'Budget', icon: faWallet },
    { id: 'currency', label: 'Currency', icon: faExchangeAlt },
    { id: 'data', label: 'Data', icon: faDatabase },
    { id: 'tools', label: 'Tools', icon: faChrome },
    { id: 'security', label: 'Security', icon: faShieldHalved },
    { id: 'help', label: 'Help', icon: faCircleInfo },
]

export const ALL_BUDGET_TABS = Object.entries(TAB_META).map(([id, meta]) => ({
    id,
    label: meta.label,
    icon: meta.icon,
    hint: meta.hint,
}))

export const getVisibleBudgetTabs = ({ isViewer = false, hiddenTabs = [] } = {}) =>
    (isViewer ? ALL_BUDGET_TABS.filter(t => t.id !== 'settings') : ALL_BUDGET_TABS)
        .filter(t => !hiddenTabs.includes(t.id) || t.id === 'dashboard' || t.id === 'settings')

/** Sidebar mirrors classic tab bar; Settings alone uses its existing sub-sections */
export const getSidebarNavItems = ({ isViewer = false, hiddenTabs = [] } = {}) =>
    getVisibleBudgetTabs({ isViewer, hiddenTabs }).map((tab) => {
        if (tab.id === 'settings') {
            return {
                type: 'dropdown',
                id: 'settings',
                label: tab.label,
                icon: tab.icon,
                hint: tab.hint,
                subLinks: SETTINGS_SUB_NAV.map((s) => ({
                    tabId: 'settings',
                    section: s.id,
                    label: s.label,
                    icon: s.icon,
                })),
            }
        }
        return {
            type: 'link',
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            hint: tab.hint,
            tabId: tab.id,
        }
    })

export const LS_SIDEBAR_COLLAPSED = 'budget_sidebar_collapsed'
export const LS_SIDEBAR_OPEN_GROUPS = 'budget_sidebar_open_groups'
