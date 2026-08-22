import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCoins, faMoneyBillWave, faCheck, faCreditCard, faMobileAlt, faUniversity,
    faTimes, faPlus, faSpinner, faTags, faArrowDown, faArrowUp, faWallet, faSyncAlt,
} from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, SafeIcon } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'
import { DEFAULT_PAYMENT_METHODS } from '../constants'

export default function SettingsBudgetPanel() {
    const {
        isLight, cardP, descCls, titleCls, metaCls, sectionCls, templateStyles, btnPrimary, inputCls, savingSettings,
        year, month, categories, expenses, formatCurrencyRaw,
        totalIncomeGlobal, allocatedPool, autoSavings,
        allocEdits, setAllocEdits, dispatch, updateBudgetCategory, getBudgetDashboard, notify,
        PAYMENT_METHODS, expenseStats,
        newPaymentMethod, setNewPaymentMethod, handleAddPaymentMethod, handleRemovePaymentMethod,
        catStats, editingCatId, setEditingCatId, catBudgetEdit, setCatBudgetEdit,
        handleSaveCatBudget, handleToggleRollover,
    } = useSettings()

    return (
        <div className="space-y-4">
            {/* ─── Income Allocation ─── */}
            <AnimateIn delay={75}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                        <FontAwesomeIcon icon={faCoins} className={`text-sm ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Income Allocation <span className={`text-xs font-medium px-1.5 py-0.5 rounded ml-1.5 ${isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400'}`}>{new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}</span></h3>
                        <p className={descCls}>Set what percentage of each income source goes to your budget this month</p>
                    </div>
                </div>

                {/* Summary */}
                <div className={`grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                    <div className="text-center">
                        <p className={`text-sm uppercase tracking-wider font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Total Income</p>
                        <p className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrencyRaw(totalIncomeGlobal)}</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-sm uppercase tracking-wider font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>To Budget</p>
                        <p className={`text-sm font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{formatCurrencyRaw(allocatedPool)}</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-sm uppercase tracking-wider font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Auto Savings</p>
                        <p className={`text-sm font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{formatCurrencyRaw(autoSavings)}</p>
                    </div>
                </div>

                {/* Per income category allocation */}
                <div className="space-y-2">
                    {categories.filter(c => c.type === 'income').map(cat => {
                        const catIncome = expenses
                            .filter(e => e.category?._id === cat._id && e.type === 'income' && !e.listOnly)
                            .reduce((s, e) => s + e.amount, 0)
                        const monthKey = `${year}-${String(month).padStart(2, '0')}`
                        const monthlyVal = cat.monthlyAllocation && (cat.monthlyAllocation instanceof Map ? cat.monthlyAllocation.get(monthKey) : cat.monthlyAllocation[monthKey])
                        const editVal = allocEdits[cat._id]
                        const pct = editVal != null ? editVal : (monthlyVal != null ? Number(monthlyVal) : (cat.allocationPercent ?? 80))
                        const allocated = catIncome * (pct / 100)
                        const saved = catIncome - allocated
                        return (
                            <div key={cat._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-solid ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}>
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: (cat.color || '#3b82f6') + '20' }}>
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-xs" style={{ color: cat.color || '#3b82f6' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</p>
                                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {formatCurrencyRaw(allocated)} to budget{saved > 0 ? ` · ${formatCurrencyRaw(saved)} saved` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        min="0" max="100" step="5"
                                        value={pct}
                                        onChange={(e) => {
                                            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                            setAllocEdits(prev => ({ ...prev, [cat._id]: val }))
                                        }}
                                        className={`w-14 text-center text-sm font-medium py-1 rounded-md border border-solid outline-none ${isLight ? 'bg-white border-slate-200 text-slate-700 focus:border-emerald-400' : 'bg-[#1a1a1a] border-[#333] text-gray-200 focus:border-emerald-600'}`}
                                    />
                                    <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>%</span>
                                </div>
                            </div>
                        )
                    })}
                    {categories.filter(c => c.type === 'income').length === 0 && (
                        <p className={`text-sm text-center py-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income categories. Create income categories to set allocation percentages.</p>
                    )}
                </div>
                {Object.keys(allocEdits).length > 0 && (
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={async () => {
                                const monthKey = `${year}-${String(month).padStart(2, '0')}`
                                for (const [catId, val] of Object.entries(allocEdits)) {
                                    const cat = categories.find(c => c._id === catId)
                                    if (cat) await dispatch(updateBudgetCategory({ id: cat._id, name: cat.name, color: cat.color, type: cat.type, budget: cat.budget || 0, icon: cat.icon || '', rollover: !!cat.rollover, monthlyAllocation: { [monthKey]: val } }))
                                }
                                dispatch(getBudgetDashboard({ month, year }))
                                setAllocEdits({})
                                notify(`Allocation saved for ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`)
                            }}
                            className={btnPrimary}
                        >
                            <FontAwesomeIcon icon={faCheck} className="mr-1.5 text-xs" /> Save Allocation
                        </button>
                    </div>
                )}
            </div></AnimateIn>

            {/* ─── Payment Methods ─── */}
            <AnimateIn delay={300}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-50' : 'bg-violet-900/20'}`}>
                        <FontAwesomeIcon icon={faCreditCard} className={`text-sm ${isLight ? 'text-violet-500' : 'text-violet-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Payment Methods</h3>
                        <p className={descCls}>Add or remove methods available when recording transactions</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {PAYMENT_METHODS.map(m => {
                        const used = expenseStats.methods.includes(m)
                        const isCustom = !DEFAULT_PAYMENT_METHODS.includes(m)
                        return (
                            <div key={m} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-solid transition-all ${
                                used
                                    ? (isLight ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-violet-900/15 border-violet-800/30 text-violet-400')
                                    : (isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#111] border-[#2B2B2B] text-gray-500')
                            }`}>
                                <FontAwesomeIcon icon={
                                    m === 'GCash' ? faMobileAlt : m === 'Bank' || m === 'BPI' ? faUniversity :
                                    m === 'Credit Card' ? faCreditCard : m === 'Debit Card' ? faCreditCard :
                                    m === 'PayPal' ? faMoneyBillWave : faCoins
                                } className="text-xs" />
                                <span className="text-sm font-medium">{m}</span>
                                {used && <span className={`text-xs px-1.5 py-0.5 rounded-full ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-900/30 text-violet-300'}`}>In use</span>}
                                {isCustom && (
                                    <button onClick={() => handleRemovePaymentMethod(m)} disabled={savingSettings} className={`ml-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${isLight ? 'hover:bg-red-100 text-red-400 hover:text-red-600' : 'hover:bg-red-900/30 text-red-500 hover:text-red-400'}`}>
                                        <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newPaymentMethod}
                        onChange={e => setNewPaymentMethod(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddPaymentMethod()}
                        placeholder="Add custom method..."
                        className={`${inputCls} flex-1 !py-2`}
                    />
                    <button onClick={handleAddPaymentMethod} disabled={!newPaymentMethod.trim() || savingSettings} className={btnPrimary}>
                        {savingSettings ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" /> : <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-xs" />}
                        Add
                    </button>
                </div>
            </div></AnimateIn>

            {/* ─── Categories Overview ─── */}
            <AnimateIn delay={400}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                        <FontAwesomeIcon icon={faTags} className={`text-sm ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Categories Overview</h3>
                        <p className={descCls}>Toggle rollover and edit budgets inline</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                    {[
                        { label: 'Total', value: catStats.total, icon: faTags, color: isLight ? 'text-slate-600' : 'text-gray-300' },
                        { label: 'Expense', value: catStats.expense, icon: faArrowDown, color: 'text-red-500' },
                        { label: 'Income', value: catStats.income, icon: faArrowUp, color: 'text-emerald-500' },
                        { label: 'With Budget', value: catStats.withBudget, icon: faWallet, color: templateStyles?.accentText || (isLight ? 'text-blue-600' : 'text-blue-400') },
                        { label: 'Rollover', value: catStats.withRollover, icon: faSyncAlt, color: isLight ? 'text-amber-600' : 'text-amber-400' },
                    ].map((s, i) => (
                        <div key={i} className={`text-center px-3 py-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                            <FontAwesomeIcon icon={s.icon} className={`text-xs mb-1.5 ${s.color}`} />
                            <p className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{s.value}</p>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className={`border-t border-solid pt-3 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <p className={`${sectionCls} mb-3`}>Expense Categories</p>
                    <div className="space-y-1.5">
                        {categories.filter(c => c.type === 'expense').map(cat => (
                            <div key={cat._id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    {cat.icon && <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} />}
                                    {!cat.icon && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />}
                                    <span className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {editingCatId === cat._id ? (
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                value={catBudgetEdit}
                                                onChange={e => setCatBudgetEdit(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveCatBudget(cat)}
                                                className={`${inputCls} !py-1 !px-2 !text-sm w-20`}
                                                placeholder="0"
                                                min="0"
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveCatBudget(cat)} className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'}`}>
                                                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                            </button>
                                            <button onClick={() => { setEditingCatId(null); setCatBudgetEdit('') }} className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-[#2a2a2a] text-gray-500'}`}>
                                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setEditingCatId(cat._id); setCatBudgetEdit(cat.budget?.toString() || '0') }} className={`text-sm font-medium px-2 py-1 rounded transition-all ${
                                            cat.budget > 0
                                                ? `${templateStyles?.accentBg || (isLight ? 'bg-blue-50' : 'bg-blue-900/20')} ${templateStyles?.accentText || (isLight ? 'text-blue-600' : 'text-blue-400')}`
                                                : (isLight ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-[#1a1a1a] text-gray-500 hover:bg-[#222]')
                                        }`}>
                                            <FontAwesomeIcon icon={faWallet} className="mr-1" />
                                            {cat.budget > 0 ? formatCurrencyRaw(cat.budget, 'PHP') : 'No budget'}
                                        </button>
                                    )}
                                    <button onClick={() => handleToggleRollover(cat)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                        cat.rollover
                                            ? (isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400')
                                            : (isLight ? 'bg-slate-100 text-slate-300 hover:text-slate-500' : 'bg-[#1a1a1a] text-gray-600 hover:text-gray-400')
                                    }`} title={cat.rollover ? 'Disable rollover' : 'Enable rollover'}>
                                        <FontAwesomeIcon icon={faSyncAlt} className="text-xs" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {categories.filter(c => c.type === 'income').length > 0 && (
                    <div className={`mt-4 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <p className={`${sectionCls} mb-3`}>Income Categories</p>
                        <div className="flex flex-wrap gap-1.5">
                            {categories.filter(c => c.type === 'income').map(c => (
                                <span key={c._id} className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-900/15 text-emerald-400'}`}>
                                    {c.icon && <SafeIcon name={c.icon} cls="text-xs" style={{ color: c.color }} />}
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div></AnimateIn>
        </div>
    )
}
