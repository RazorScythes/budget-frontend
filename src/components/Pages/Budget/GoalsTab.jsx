import React, { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faPiggyBank, faCheckCircle, faWallet, faCheck, faTimes, faArrowUp, faChartPie, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, DeleteConfirmModal, SafeIcon } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import { CATEGORY_COLORS, CURRENCIES } from './constants'
import { createFinancialGoal, updateFinancialGoal, deleteFinancialGoal, addGoalContribution, removeGoalContribution } from '../../../actions/budget'


// ==================== GOALS TAB ====================

const GoalsTab = React.memo(({ goals, categories, savingsAccounts = [], dispatch, isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, formatCurrency, isLoading, isViewer, ownerParam = {}, showBalances = true, maskedBalance = '₱ ----' }) => {
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '', category: '', color: '#3b82f6', icon: 'bullseye', notes: '', linkedSavingsAccountId: '', currency: 'PHP' })
    const [contribForm, setContribForm] = useState({ goalId: null, amount: '', notes: '' })
    const [deleteModal, setDeleteModal] = useState(null)
    const [expandedGoal, setExpandedGoal] = useState(null)
    const [showCompleted, setShowCompleted] = useState(false)
    const [filterView, setFilterView] = useState('all')
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`
    const labelCls = `block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`

    const resetForm = () => { setForm({ name: '', targetAmount: '', deadline: '', category: '', color: '#3b82f6', icon: 'bullseye', notes: '', linkedSavingsAccountId: '', currency: 'PHP' }); setEditing(null); setShowForm(false) }

    const handleSubmit = async () => {
        if (!form.name || !form.targetAmount) return
        const data = { ...form, ...ownerParam, targetAmount: parseFloat(form.targetAmount), linkedSavingsAccountId: form.linkedSavingsAccountId || null }
        try {
            if (editing) await dispatch(updateFinancialGoal({ ...data, id: editing })).unwrap()
            else await dispatch(createFinancialGoal(data)).unwrap()
            resetForm()
        } catch (err) { /* form kept open */ }
    }

    const handleEdit = (g) => {
        setForm({ name: g.name, targetAmount: g.targetAmount.toString(), deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : '', category: g.category?._id || '', color: g.color, icon: g.icon || 'bullseye', notes: g.notes || '', linkedSavingsAccountId: g.linkedSavingsAccountId || '', currency: g.currency || 'PHP' })
        setEditing(g._id)
        setShowForm(true)
    }

    const handleDelete = (id) => {
        setDeleteModal({ type: 'goal', id, title: 'Delete Goal', message: 'Are you sure you want to delete this goal? All contributions will be lost.' })
    }

    const confirmDelete = async (id) => {
        await dispatch(deleteFinancialGoal({ id, ...ownerParam }))
        setDeleteModal(null)
    }

    const handleContribute = async () => {
        if (!contribForm.goalId || !contribForm.amount) return
        const goal = goals.find(g => g._id === contribForm.goalId)
        const savingsAccountId = goal?.linkedSavingsAccountId || contribForm.savingsAccountId || null
        await dispatch(addGoalContribution({ id: contribForm.goalId, amount: parseFloat(contribForm.amount), notes: contribForm.notes, savingsAccountId, ...ownerParam }))
        if (savingsAccountId) dispatch(getBudgetSavings(ownerParam))
        setContribForm({ goalId: null, amount: '', notes: '', savingsAccountId: '' })
    }

    const handleRemoveContribution = (goalId, contributionId) => {
        setDeleteModal({ type: 'contribution', goalId, contributionId, title: 'Remove Contribution', message: 'Are you sure you want to remove this contribution?' })
    }

    const confirmRemoveContribution = async (goalId, contributionId) => {
        await dispatch(removeGoalContribution({ id: goalId, contributionId, ...ownerParam }))
        setDeleteModal(null)
    }

    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = goals.filter(g => g.status === 'completed')
    const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0)
    const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0)
    const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0
    const totalContributions = goals.reduce((s, g) => s + (g.contributions?.length || 0), 0)

    const filteredActive = useMemo(() => {
        if (filterView === 'all') return activeGoals
        if (filterView === 'urgent') return activeGoals.filter(g => { const d = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null; return d !== null && d <= 30 })
        if (filterView === 'ontrack') return activeGoals.filter(g => { const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0; return pct >= 50 })
        return activeGoals
    }, [activeGoals, filterView])

    if (isLoading) {
        return (
            <div className="page-type-scale space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${card} p-5`}>
                            <div className="flex items-center justify-between mb-3"><div className={`h-3 w-20 ${pulse}`} /><div className={`w-8 h-8 rounded-lg ${pulse}`} /></div>
                            <div className={`h-6 w-28 ${pulse}`} />
                        </div>
                    ))}
                </div>
                <div className={`${card} p-5`}><div className={`h-4 w-32 mb-4 ${pulse}`} /><div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i}><div className="flex items-center justify-between mb-1.5"><div className={`h-3 w-24 ${pulse}`} /><div className={`h-3 w-16 ${pulse}`} /></div><div className={`h-1.5 rounded-full ${pulse}`} /></div>))}</div></div>
            </div>
        )
    }

    return (
        <div className="page-type-scale space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Saved', value: formatCurrency(totalSaved), icon: faPiggyBank, color: 'emerald' },
                    { label: 'Target', value: formatCurrency(totalTarget), icon: faArrowUp, color: 'blue' },
                    { label: 'Remaining', value: formatCurrency(Math.max(totalTarget - totalSaved, 0)), icon: faWallet, color: 'amber' },
                    { label: 'Progress', value: `${overallPct}%`, icon: faChartPie, color: overallPct >= 100 ? 'emerald' : 'blue', hideMask: true },
                ].map((s, i) => {
                    const colorMap = {
                        emerald: { icon: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20' },
                        blue: { icon: isLight ? 'text-blue-600' : 'text-blue-400', bg: isLight ? 'bg-blue-50' : 'bg-blue-900/20' },
                        amber: { icon: isLight ? 'text-amber-600' : 'text-amber-400', bg: isLight ? 'bg-amber-50' : 'bg-amber-900/20' },
                    }
                    const cm = colorMap[s.color]
                    return (
                        <AnimateIn key={i} delay={i * 80}>
                            <div className={`${card} p-5`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-sm font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cm.bg}`}>
                                        <FontAwesomeIcon icon={s.icon} className={`text-sm ${cm.icon}`} />
                                    </div>
                                </div>
                                <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    {s.hideMask ? s.value : <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{s.value}</BalanceAmount>}
                                </p>
                            </div>
                        </AnimateIn>
                    )
                })}
            </div>

            {/* Overall Progress + New Goal Form */}
            <AnimateIn delay={350}><div className={`${card} overflow-hidden`}>
                <div className={`flex items-center justify-between px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {editing ? 'Edit Goal' : 'Overall Progress'}
                    </h3>
                    {!isViewer && <button
                        type="button"
                        onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                            showForm
                                ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                : (isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500')
                        }`}
                    >
                        <FontAwesomeIcon icon={showForm ? faTimes : faPlus} className="text-[10px]" />
                        {showForm ? 'Cancel' : 'New Goal'}
                    </button>}
                </div>
                <div className="px-5 py-5">
                    {totalTarget > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatCurrency(totalSaved)} of {formatCurrency(totalTarget)}</span>
                                <span className={`text-sm font-semibold ${overallPct >= 100 ? 'text-emerald-500' : (isLight ? 'text-slate-600' : 'text-gray-300')}`}>{overallPct}%</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                <div className={`h-full rounded-full ${overallPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(overallPct, 100)}%`, animation: 'barGrow 1s ease-out 0.4s both' }} />
                            </div>
                            <p className={`text-sm mt-2 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''} · {totalContributions} contribution{totalContributions !== 1 ? 's' : ''}</p>
                        </div>
                    ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active goals yet.</p>
                    )}
                </div>

                {showForm && !isViewer && (
                    <div className={`px-5 py-5 space-y-4 border-t border-solid ${isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#111] border-[#1f1f1f]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 xl:col-span-3">
                                <label className={labelCls}>Goal Name</label>
                                <input type="text" placeholder="e.g., Emergency Fund, Vacation..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Target Amount</label>
                                <input type="number" placeholder="0.00" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} className={inputCls} min="0" step="0.01" />
                            </div>
                            <div>
                                <label className={labelCls}>Deadline</label>
                                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Currency</label>
                                <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className={`${selectCls} w-full`}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={`${selectCls} w-full`}>
                                    <option value="">None</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Linked savings</label>
                                <select value={form.linkedSavingsAccountId} onChange={e => setForm({...form, linkedSavingsAccountId: e.target.value})} className={`${selectCls} w-full`}>
                                    <option value="">None — manual tracking only</option>
                                    {(savingsAccounts || []).map(a => <option key={a._id} value={a._id}>{a.name} ({a.category})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Notes</label>
                                <input type="text" placeholder="Optional description" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Color</label>
                            <div className={`min-h-[42px] px-3 py-2 rounded-xl border border-solid flex items-center gap-2 flex-wrap ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-[#333]'}`}>
                                {CATEGORY_COLORS.map(c => (
                                    <button key={c} type="button" onClick={() => setForm({...form, color: c})} aria-label={`Select color ${c}`} aria-pressed={form.color === c} className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c, ringColor: c }} />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={resetForm} className={btnSecondary}>Cancel</button>
                            <button type="button" onClick={handleSubmit} className={btnPrimary} disabled={!form.name || !form.targetAmount}>
                                <FontAwesomeIcon icon={editing ? faCheck : faPlus} className="mr-1.5 text-xs" />
                                {editing ? 'Save Changes' : 'Create Goal'}
                            </button>
                        </div>
                    </div>
                )}
            </div></AnimateIn>

            {/* Active Goals List */}
            <AnimateIn delay={400}><div className={`${card} p-5`}>
                <h3 className={`text-sm font-semibold mb-4 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Active Goals</h3>
                {filteredActive.length > 0 ? (
                    <div className="space-y-3">
                        {filteredActive.map((g, gIdx) => {
                            const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
                            const remaining = Math.max(g.targetAmount - g.currentAmount, 0)
                            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null
                            const isExpanded = expandedGoal === g._id
                            const isOverdue = daysLeft !== null && daysLeft < 0
                            const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

                            return (
                                <div key={g._id} className={`cursor-pointer rounded-lg p-2 -mx-2 transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1a1a1a]'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: g.color + '20' }}>
                                                <SafeIcon name={g.icon || 'bullseye'} cls="text-xs" style={{ color: g.color }} />
                                            </div>
                                            <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{g.name}</span>
                                            {daysLeft !== null && (
                                                <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : (isLight ? 'text-slate-400' : 'text-gray-500')}`}>
                                                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{formatCurrency(g.currentAmount)}</span>
                                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{pct}%</span>
                                        </div>
                                    </div>
                                    <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: g.color, animation: `barGrow 0.8s ease-out ${0.4 + gIdx * 0.1}s both` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <div className="flex items-center gap-2">
                                            {!isViewer && contribForm.goalId === g._id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <input type="number" placeholder="Amount" value={contribForm.amount} onChange={e => setContribForm({...contribForm, amount: e.target.value})} className={`${inputCls} !py-1 !text-sm w-20`} min="0" autoFocus />
                                                    <input type="text" placeholder="Note" value={contribForm.notes} onChange={e => setContribForm({...contribForm, notes: e.target.value})} className={`${inputCls} !py-1 !text-sm w-20 hidden sm:block`} />
                                                    <button onClick={handleContribute} disabled={!contribForm.amount} className="px-2 py-1 rounded text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40"><FontAwesomeIcon icon={faCheck} /></button>
                                                    <button onClick={() => setContribForm({ goalId: null, amount: '', notes: '' })} className={`px-1.5 py-1 rounded text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}><FontAwesomeIcon icon={faTimes} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {!isViewer && <button onClick={() => setContribForm({ goalId: g._id, amount: '', notes: '' })} className={`text-xs font-medium px-2 py-0.5 rounded transition-all ${isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                                                        <FontAwesomeIcon icon={faPlus} className="mr-1 text-[8px]" />Add
                                                    </button>}
                                                    {!isViewer && <button onClick={() => handleEdit(g)} className={`text-xs px-1.5 py-0.5 rounded ${isLight ? 'text-blue-500 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'}`}><FontAwesomeIcon icon={faPen} /></button>}
                                                    {!isViewer && <button onClick={() => handleDelete(g._id)} className={`text-xs px-1.5 py-0.5 rounded ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`}><FontAwesomeIcon icon={faTrash} /></button>}
                                                </div>
                                            )}
                                            <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(remaining)} left</span>
                                        </div>
                                        <button onClick={() => setExpandedGoal(isExpanded ? null : g._id)} className={`text-sm px-1.5 py-0.5 rounded transition-all ${isExpanded ? (isLight ? 'text-blue-500' : 'text-blue-400') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>
                                            {g.contributions?.length || 0} entries <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[8px] ml-0.5" />
                                        </button>
                                    </div>

                                    {/* Contributions */}
                                    {isExpanded && g.contributions?.length > 0 && (
                                        <div className={`mt-2 pt-2 border-t border-solid space-y-0.5 ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                            {g.contributions.slice().reverse().slice(0, 8).map((c, i) => {
                                                return (
                                                <div key={c._id || i} className={`flex items-center justify-between py-1 group`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-sm font-semibold text-emerald-500">+{formatCurrency(c.amount)}</span>
                                                        {c.notes && <span className={`text-sm truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{c.notes}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        {!isViewer && <button onClick={() => handleRemoveContribution(g._id, c._id)} className={`w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-red-400 hover:text-red-500' : 'text-red-400 hover:text-red-300'}`}><FontAwesomeIcon icon={faTimes} className="text-[7px]" /></button>}
                                                    </div>
                                                </div>
                                            )})}
                                            {g.contributions.length > 8 && <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>+{g.contributions.length - 8} more</p>}
                                        </div>
                                    )}
                                    {isExpanded && (!g.contributions || g.contributions.length === 0) && (
                                        <p className={`text-sm text-center mt-2 pt-2 border-t border-solid ${isLight ? 'border-slate-100 text-slate-400' : 'border-[#1f1f1f] text-gray-500'}`}>No contributions yet</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No active goals.</p>
                )}
            </div></AnimateIn>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <AnimateIn delay={500}><div className={`${card} p-5`}>
                    <button onClick={() => setShowCompleted(!showCompleted)} className="w-full flex items-center justify-between">
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Completed ({completedGoals.length})</h3>
                        <FontAwesomeIcon icon={showCompleted ? faChevronUp : faChevronDown} className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                    </button>
                    {showCompleted && (
                        <div className="mt-3 space-y-2">
                            {completedGoals.map((g) => (
                                <div key={g._id} className={`flex items-center justify-between rounded-lg p-2 -mx-2 ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: g.color + '20' }}>
                                            <SafeIcon name={g.icon || 'bullseye'} cls="text-xs" style={{ color: g.color }} />
                                        </div>
                                        <span className={`text-sm truncate ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{g.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <span className="text-sm font-semibold text-emerald-500">{formatCurrency(g.currentAmount)}</span>
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs text-emerald-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div></AnimateIn>
            )}

            {/* Empty State */}
            {goals.length === 0 && !showForm && (
                <AnimateIn delay={200}><div className={`${card} p-5 text-center py-12`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                        <FontAwesomeIcon icon={faPiggyBank} className={`text-lg ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No goals yet</p>
                    <p className={`text-sm mb-4 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Start tracking what you're saving for.</p>
                    {!isViewer && <button onClick={() => setShowForm(true)} className={`text-sm font-medium px-4 py-2 rounded-lg ${isLight ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                        <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-xs" />Create Goal
                    </button>}
                </div></AnimateIn>
            )}

            {deleteModal && (
                <DeleteConfirmModal isLight={isLight} title={deleteModal.title} message={deleteModal.message} onCancel={() => setDeleteModal(null)} onConfirm={() => {
                    if (deleteModal.type === 'goal') confirmDelete(deleteModal.id)
                    else if (deleteModal.type === 'contribution') confirmRemoveContribution(deleteModal.goalId, deleteModal.contributionId)
                }} />
            )}
        </div>
    )
})


export default GoalsTab
