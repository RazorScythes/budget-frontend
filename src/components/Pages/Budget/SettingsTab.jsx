import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faEye, faWallet, faExchangeAlt, faDatabase, faCircleInfo,
    faCheckCircle, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons'
import { faChrome } from '@fortawesome/free-brands-svg-icons'
import {
    saveExchangeRates, resetExchangeRates, saveBudgetSettings,
    updateBudgetCategory, getBudgetDashboard,
} from '../../../actions/budget'
import {
    CURRENCIES, DEFAULT_EXCHANGE_RATES, DEFAULT_PAYMENT_METHODS,
    SETTINGS_SUB_TABS, LS_SETTINGS_SUB_TAB,
} from './constants'
import { BUDGET_TEMPLATES } from './settings/templates'
import { SettingsContext } from './settings/SettingsContext'
import { SubTabBar } from './SharedComponents'
import SettingsAppearancePanel from './settings/SettingsAppearancePanel'
import SettingsBudgetPanel from './settings/SettingsBudgetPanel'
import SettingsCurrencyPanel from './settings/SettingsCurrencyPanel'
import SettingsDataPanel from './settings/SettingsDataPanel'
import SettingsToolsPanel from './settings/SettingsToolsPanel'
import SettingsHelpPanel from './settings/SettingsHelpPanel'

const SUB_TAB_META = [
    { id: 'appearance', label: 'Appearance', icon: faEye },
    { id: 'budget', label: 'Budget', icon: faWallet },
    { id: 'currency', label: 'Currency', icon: faExchangeAlt },
    { id: 'data', label: 'Data', icon: faDatabase },
    { id: 'tools', label: 'Tools', icon: faChrome },
    { id: 'help', label: 'Help', icon: faCircleInfo },
]

const PANELS = {
    appearance: SettingsAppearancePanel,
    budget: SettingsBudgetPanel,
    currency: SettingsCurrencyPanel,
    data: SettingsDataPanel,
    tools: SettingsToolsPanel,
    help: SettingsHelpPanel,
}

const NUMBER_FORMATS = [
    { value: 'en-PH', label: 'en-PH — 1,234.56' },
    { value: 'en-US', label: 'en-US — 1,234.56' },
    { value: 'de-DE', label: 'de-DE — 1.234,56' },
    { value: 'fr-FR', label: 'fr-FR — 1 234,56' },
    { value: 'ja-JP', label: 'ja-JP — 1,234.56' },
]

const DATE_FORMATS = [
    { value: 'en-US', label: 'en-US — Jan 1, 2026' },
    { value: 'en-GB', label: 'en-GB — 1 Jan 2026' },
    { value: 'ISO', label: 'ISO — 2026-01-01' },
    { value: 'de-DE', label: 'de-DE — 1.1.2026' },
    { value: 'ja-JP', label: 'ja-JP — 2026/1/1' },
]

const SettingsTab = React.memo(({
    isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, dispatch,
    categories, expenses, savedRates, liveRates, savedBaseCurrency, exchangeRates,
    viewCurrency, setViewCurrency, activeViewCurrency, formatCurrencyRaw, budgetSettings,
    PAYMENT_METHODS, month, year, templateStyles, monthlyBudgetData, allTabs,
    allocatedPool, autoSavings, totalIncomeGlobal,
}) => {
    const [settingsSubTab, setSettingsSubTab] = useState(() => {
        try {
            const saved = localStorage.getItem(LS_SETTINGS_SUB_TAB)
            return SETTINGS_SUB_TABS.includes(saved) ? saved : 'appearance'
        } catch {
            return 'appearance'
        }
    })

    const [allocEdits, setAllocEdits] = useState({})
    const [rateEdits, setRateEdits] = useState({})
    const [rateEditorOpen, setRateEditorOpen] = useState(false)
    const [savingRates, setSavingRates] = useState(false)
    const [resettingRates, setResettingRates] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    const [notification, setNotification] = useState(null)
    const [newPaymentMethod, setNewPaymentMethod] = useState('')
    const [savingSettings, setSavingSettings] = useState(false)
    const [editingFormat, setEditingFormat] = useState(false)
    const [formatEdits, setFormatEdits] = useState({
        numberFormat: budgetSettings?.numberFormat || 'en-PH',
        dateFormat: budgetSettings?.dateFormat || 'en-US',
        decimalPlaces: budgetSettings?.decimalPlaces ?? 2,
        startOfWeek: budgetSettings?.startOfWeek || 'monday',
    })
    const [editingCatId, setEditingCatId] = useState(null)
    const [catBudgetEdit, setCatBudgetEdit] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(budgetSettings?.template || 'default')
    const [savingTemplate, setSavingTemplate] = useState(false)

    const cardP = `${card} ${templateStyles?.cardPadding || 'p-5'}`

    useEffect(() => {
        try { localStorage.setItem(LS_SETTINGS_SUB_TAB, settingsSubTab) } catch { /* ignore */ }
    }, [settingsSubTab])

    useEffect(() => {
        setFormatEdits({
            numberFormat: budgetSettings?.numberFormat || 'en-PH',
            dateFormat: budgetSettings?.dateFormat || 'en-US',
            decimalPlaces: budgetSettings?.decimalPlaces ?? 2,
            startOfWeek: budgetSettings?.startOfWeek || 'monday',
        })
    }, [budgetSettings])

    const notify = (msg, variant = 'success') => {
        setNotification({ msg, variant })
        setTimeout(() => setNotification(null), 3000)
    }

    useEffect(() => {
        const init = {}
        CURRENCIES.filter(c => c.code !== 'PHP').forEach(c => {
            init[c.code] = exchangeRates[c.code] || ''
        })
        setRateEdits(init)
    }, [exchangeRates])

    const handleSetDefaultCurrency = async (code) => {
        await dispatch(saveExchangeRates({ rates: savedRates || {}, baseCurrency: code }))
        setViewCurrency(code === 'PHP' ? '' : code)
        notify(`Default currency set to ${code}`)
    }

    const handleSaveRates = async () => {
        setSavingRates(true)
        const rates = {}
        Object.entries(rateEdits).forEach(([code, val]) => {
            const num = parseFloat(val)
            if (num > 0) rates[code] = num
        })
        await dispatch(saveExchangeRates({ rates }))
        setSavingRates(false)
        setRateEditorOpen(false)
        notify('Exchange rates saved')
    }

    const handleResetRates = async () => {
        setResettingRates(true)
        const result = await dispatch(resetExchangeRates())
        setResettingRates(false)
        setConfirmReset(false)
        const freshLive = result.payload?.data?.result?.liveRates || liveRates || DEFAULT_EXCHANGE_RATES
        const init = {}
        CURRENCIES.filter(c => c.code !== 'PHP').forEach(c => {
            init[c.code] = freshLive[c.code] || DEFAULT_EXCHANGE_RATES[c.code] || ''
        })
        setRateEdits(init)
        notify('Exchange rates reset to live rates')
    }

    const saveSettings = async (overrides = {}) => {
        setSavingSettings(true)
        const current = budgetSettings || {}
        await dispatch(saveBudgetSettings({ budgetSettings: { ...current, ...overrides } }))
        setSavingSettings(false)
    }

    const handleSelectTemplate = async (templateId) => {
        setSelectedTemplate(templateId)
        setSavingTemplate(true)
        await saveSettings({ template: templateId })
        setSavingTemplate(false)
        notify(`Layout & style changed to "${BUDGET_TEMPLATES.find(t => t.id === templateId)?.name}"`)
    }

    useEffect(() => {
        if (budgetSettings?.template && budgetSettings.template !== selectedTemplate) {
            setSelectedTemplate(budgetSettings.template)
        }
    }, [budgetSettings?.template, selectedTemplate])

    const handleAddPaymentMethod = async () => {
        const name = newPaymentMethod.trim()
        if (!name) return
        if (PAYMENT_METHODS.includes(name)) { notify('Method already exists', 'danger'); return }
        const customMethods = [...(budgetSettings?.paymentMethods || []), name]
        await saveSettings({ paymentMethods: customMethods })
        setNewPaymentMethod('')
        notify(`Added "${name}"`)
    }

    const handleRemovePaymentMethod = async (name) => {
        if (DEFAULT_PAYMENT_METHODS.includes(name)) { notify('Cannot remove default method', 'danger'); return }
        const customMethods = (budgetSettings?.paymentMethods || []).filter(m => m !== name)
        await saveSettings({ paymentMethods: customMethods })
        notify(`Removed "${name}"`)
    }

    const handleToggleRollover = async (cat) => {
        await dispatch(updateBudgetCategory({ id: cat._id, name: cat.name, color: cat.color, type: cat.type, budget: cat.budget || 0, icon: cat.icon || '', rollover: !cat.rollover }))
        dispatch(getBudgetDashboard({ month, year }))
        notify(`${cat.name} rollover ${cat.rollover ? 'disabled' : 'enabled'}`)
    }

    const handleSaveCatBudget = async (cat) => {
        const newBudget = parseFloat(catBudgetEdit) || 0
        await dispatch(updateBudgetCategory({ id: cat._id, name: cat.name, color: cat.color, type: cat.type, budget: newBudget, icon: cat.icon || '', rollover: !!cat.rollover }))
        dispatch(getBudgetDashboard({ month, year }))
        setEditingCatId(null)
        setCatBudgetEdit('')
        notify(`${cat.name} budget updated to ${newBudget}`)
    }

    const handleSaveFormatSettings = async () => {
        await saveSettings(formatEdits)
        setEditingFormat(false)
        notify('Formatting settings saved')
    }

    const catStats = useMemo(() => {
        const expCats = categories.filter(c => c.type === 'expense')
        const incCats = categories.filter(c => c.type === 'income')
        const withBudget = expCats.filter(c => c.budget > 0)
        const withRollover = expCats.filter(c => c.rollover)
        return { total: categories.length, expense: expCats.length, income: incCats.length, withBudget: withBudget.length, withRollover: withRollover.length }
    }, [categories])

    const expenseStats = useMemo(() => {
        const active = expenses.filter(e => !e.listOnly)
        const listOnly = expenses.length - active.length
        const recurring = expenses.filter(e => e.isRecurring)
        const currencies = [...new Set(expenses.map(e => e.currency || 'PHP'))]
        const methods = [...new Set(expenses.map(e => e.paymentMethod || 'Cash'))]
        return { total: expenses.length, active: active.length, listOnly, recurring: recurring.length, currencies, methods }
    }, [expenses])

    const labelCls = `block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`
    const sectionCls = `text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`
    const descCls = `text-[11px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`

    const contextValue = useMemo(() => ({
        isLight, card, cardP, inputCls, selectCls, btnPrimary, btnSecondary, dispatch,
        categories, expenses, savedRates, liveRates, savedBaseCurrency, exchangeRates,
        viewCurrency, setViewCurrency, activeViewCurrency, formatCurrencyRaw, budgetSettings,
        PAYMENT_METHODS, month, year, templateStyles, monthlyBudgetData, allTabs,
        allocatedPool, autoSavings, totalIncomeGlobal,
        allocEdits, setAllocEdits, rateEdits, setRateEdits, rateEditorOpen, setRateEditorOpen,
        savingRates, resettingRates, confirmReset, setConfirmReset,
        notification, setNotification, notify,
        newPaymentMethod, setNewPaymentMethod, savingSettings,
        editingFormat, setEditingFormat, formatEdits, setFormatEdits,
        editingCatId, setEditingCatId, catBudgetEdit, setCatBudgetEdit,
        selectedTemplate, savingTemplate,
        labelCls, sectionCls, descCls, NUMBER_FORMATS, DATE_FORMATS,
        catStats, expenseStats,
        handleSetDefaultCurrency, handleSaveRates, handleResetRates, saveSettings,
        handleSelectTemplate, handleAddPaymentMethod, handleRemovePaymentMethod,
        handleToggleRollover, handleSaveCatBudget, handleSaveFormatSettings,
        updateBudgetCategory, getBudgetDashboard,
    }), [
        isLight, card, cardP, inputCls, selectCls, btnPrimary, btnSecondary, dispatch,
        categories, expenses, savedRates, liveRates, savedBaseCurrency, exchangeRates,
        viewCurrency, setViewCurrency, activeViewCurrency, formatCurrencyRaw, budgetSettings,
        PAYMENT_METHODS, month, year, templateStyles, monthlyBudgetData, allTabs,
        allocatedPool, autoSavings, totalIncomeGlobal,
        allocEdits, rateEdits, rateEditorOpen, savingRates, resettingRates, confirmReset,
        notification, newPaymentMethod, savingSettings, editingFormat, formatEdits,
        editingCatId, catBudgetEdit, selectedTemplate, savingTemplate,
        labelCls, sectionCls, descCls, catStats, expenseStats,
    ])

    const ActivePanel = PANELS[settingsSubTab] || SettingsAppearancePanel

    return (
        <SettingsContext.Provider value={contextValue}>
            <div className={templateStyles?.sectionGap || 'space-y-4'}>
                {notification && (
                    <div className={`${templateStyles?.radius || 'rounded-lg'} px-4 py-2.5 text-xs font-medium flex items-center gap-2 transition-all ${
                        notification.variant === 'success'
                            ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/50')
                            : (isLight ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-900/20 text-red-400 border border-red-800/50')
                    }`}>
                        <FontAwesomeIcon icon={notification.variant === 'success' ? faCheckCircle : faExclamationTriangle} className="text-[10px]" />
                        {notification.msg}
                    </div>
                )}

                <SubTabBar
                    tabs={SUB_TAB_META}
                    activeId={settingsSubTab}
                    onChange={setSettingsSubTab}
                    isLight={isLight}
                    templateStyles={templateStyles}
                />

                <ActivePanel />
            </div>
        </SettingsContext.Provider>
    )
})

SettingsTab.displayName = 'SettingsTab'

export default SettingsTab
