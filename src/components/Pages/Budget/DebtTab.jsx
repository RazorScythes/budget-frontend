import React, { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faHandHoldingUsd, faChevronDown, faChevronUp, faCheck, faCheckCircle, faArrowUp, faArrowDown, faUserFriends, faCalendarCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, DeleteConfirmModal } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import { CURRENCIES } from './constants'
import { monthsToPayOff, remainingBalance, snowballOrder, avalancheOrder } from '../../../utils/debtPayoff'
import { createDebt, updateDebt, deleteDebt, addDebtPayment, removeDebtPayment, toggleDebtStatus } from '../../../actions/budget'


// ==================== DEBT TAB ====================

const DebtTab = React.memo(({ debts, categories, dispatch, isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, formatCurrency, isLoading, PAYMENT_METHODS, isViewer, ownerParam = {}, showBalances = true, maskedBalance = '₱ ----' }) => {
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', type: 'owe', person: '', total_amount: '', due_date: '', notes: '', currency: 'PHP', interestRate: '', minimumPayment: '' })
    const [payoffView, setPayoffView] = useState('snowball')
    const [paymentForm, setPaymentForm] = useState({ debtId: null, amount: '', notes: '', category: '', paymentMethod: 'Cash' })
    const [expandedId, setExpandedId] = useState(null)
    const [filterStatus, setFilterStatus] = useState('all')

    const resetForm = () => {
        setForm({ name: '', type: 'owe', person: '', total_amount: '', due_date: '', notes: '', currency: 'PHP', interestRate: '', minimumPayment: '' })
        setEditing(null)
        setShowForm(false)
    }

    const handleSubmit = async () => {
        if (!form.name || !form.total_amount) return
        const data = {
            ...form,
            ...ownerParam,
            total_amount: parseFloat(form.total_amount),
            interestRate: parseFloat(form.interestRate) || 0,
            minimumPayment: parseFloat(form.minimumPayment) || 0,
        }
        try {
            if (editing) await dispatch(updateDebt({ ...data, id: editing })).unwrap()
            else await dispatch(createDebt(data)).unwrap()
            resetForm()
        } catch (err) { /* form kept open */ }
    }

    const handleEdit = (d) => {
        setForm({
            name: d.name, type: d.type, person: d.person || '',
            total_amount: d.total_amount.toString(),
            due_date: d.due_date ? new Date(d.due_date).toISOString().split('T')[0] : '',
            notes: d.notes || '',
            currency: d.currency || 'PHP',
            interestRate: d.interestRate != null ? String(d.interestRate) : '',
            minimumPayment: d.minimumPayment != null ? String(d.minimumPayment) : '',
        })
        setEditing(d._id)
        setShowForm(true)
    }

    const [deleteModal, setDeleteModal] = useState(null)

    const handleDelete = (id) => {
        setDeleteModal({ id, title: 'Delete Debt', message: 'Are you sure you want to delete this debt? All payment history will be lost.' })
    }

    const confirmDelete = async (id) => {
        await dispatch(deleteDebt({ id, ...ownerParam }))
        setDeleteModal(null)
    }

    const handlePayment = async () => {
        if (!paymentForm.amount || !paymentForm.debtId) return
        await dispatch(addDebtPayment({ id: paymentForm.debtId, amount: parseFloat(paymentForm.amount), notes: paymentForm.notes, category: paymentForm.category || null, paymentMethod: paymentForm.paymentMethod, ...ownerParam }))
        setPaymentForm({ debtId: null, amount: '', notes: '', category: '', paymentMethod: 'Cash' })
    }

    const handleRemovePayment = (debtId, paymentId) => {
        setDeleteModal({ type: 'payment', debtId, paymentId, title: 'Remove Payment', message: 'Are you sure you want to remove this payment record?' })
    }

    const confirmRemovePayment = async (debtId, paymentId) => {
        await dispatch(removeDebtPayment({ id: debtId, paymentId, ...ownerParam }))
        setDeleteModal(null)
    }

    const handleToggle = async (id) => {
        await dispatch(toggleDebtStatus({ id, ...ownerParam }))
    }

    const filtered = useMemo(() => {
        if (!debts) return []
        if (filterStatus === 'all') return debts
        return debts.filter(d => d.status === filterStatus)
    }, [debts, filterStatus])

    const totalOwed = debts?.filter(d => d.type === 'owe' && d.status === 'active').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0) || 0
    const totalOwedToYou = debts?.filter(d => d.type === 'owed' && d.status === 'active').reduce((s, d) => s + (d.total_amount - d.amount_paid), 0) || 0
    const totalPaid = debts?.reduce((s, d) => s + (d.amount_paid || 0), 0) || 0
    const activeCount = debts?.filter(d => d.status === 'active').length || 0
    const paidCount = debts?.filter(d => d.status === 'paid').length || 0

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
                <div className={`${card} p-5`}>
                    <div className={`h-4 w-32 mb-4 ${pulse}`} />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1.5"><div className={`h-3 w-24 ${pulse}`} /><div className={`h-3 w-16 ${pulse}`} /></div>
                                <div className={`h-1.5 rounded-full ${pulse}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const labelCls = `block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`

    return (
        <div className="page-type-scale space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'You Owe', value: formatCurrency(totalOwed), icon: faArrowUp, color: 'red', isMoney: true },
                    { label: 'Owed to You', value: formatCurrency(totalOwedToYou), icon: faArrowDown, color: 'emerald', isMoney: true },
                    { label: 'Total Paid', value: formatCurrency(totalPaid), icon: faCheckCircle, color: 'blue', isMoney: true },
                    { label: 'Active / Paid', value: `${activeCount} / ${paidCount}`, icon: faHandHoldingUsd, color: 'violet' },
                ].map((s, i) => {
                    const colorMap = {
                        red: { icon: isLight ? 'text-red-600' : 'text-red-400', bg: isLight ? 'bg-red-50' : 'bg-red-900/20' },
                        emerald: { icon: isLight ? 'text-emerald-600' : 'text-emerald-400', bg: isLight ? 'bg-emerald-50' : 'bg-emerald-900/20' },
                        blue: { icon: isLight ? 'text-blue-600' : 'text-blue-400', bg: isLight ? 'bg-blue-50' : 'bg-blue-900/20' },
                        violet: { icon: isLight ? 'text-violet-600' : 'text-violet-400', bg: isLight ? 'bg-violet-50' : 'bg-violet-900/20' },
                    }
                    const cm = colorMap[s.color]
                    return (
                        <AnimateIn key={i} delay={i * 80}>
                            <div className={`${card} p-5`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cm.bg}`}>
                                        <FontAwesomeIcon icon={s.icon} className={`text-sm ${cm.icon}`} />
                                    </div>
                                </div>
                                <p className={`text-lg sm:text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    {s.isMoney ? <BalanceAmount visible={showBalances} maskedText={maskedBalance}>{s.value}</BalanceAmount> : s.value}
                                </p>
                            </div>
                        </AnimateIn>
                    )
                })}
            </div>

            {snowballOrder(debts).length > 0 && (
                <AnimateIn delay={120}><div className={`${card} p-5`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Payoff plan</h3>
                        <div className="flex gap-1">
                            {['snowball', 'avalanche'].map(v => (
                                <button key={v} type="button" onClick={() => setPayoffView(v)}
                                    className={`text-[10px] font-semibold px-2 py-1 rounded-md ${payoffView === v ? (isLight ? 'bg-slate-800 text-white' : 'bg-white text-slate-900') : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1a1a1a] text-gray-400')}`}>
                                    {v === 'snowball' ? 'Snowball' : 'Avalanche'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        {payoffView === 'snowball' ? 'Smallest remaining balance first.' : 'Highest interest rate first.'}
                    </p>
                    <div className="space-y-2">
                        {(payoffView === 'snowball' ? snowballOrder(debts) : avalancheOrder(debts)).map((d, i) => {
                            const months = monthsToPayOff({ remaining: remainingBalance(d), annualRate: d.interestRate, minimumPayment: d.minimumPayment })
                            return (
                                <div key={d._id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                    <div>
                                        <p className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{i + 1}. {d.name}</p>
                                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {d.interestRate ? `${d.interestRate}% APR` : 'No interest'}{d.currency && d.currency !== 'PHP' ? ` · ${d.currency}` : ''}
                                        </p>
                                    </div>
                                    <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                                        {months == null ? 'Set a minimum' : months === 0 ? 'Paid' : `${months} mo`}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div></AnimateIn>
            )}

            {/* Debt List */}
            <AnimateIn delay={350}><div className={`${card} overflow-hidden`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-violet-100' : 'bg-violet-900/30'}`}>
                            <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-sm ${isLight ? 'text-violet-600' : 'text-violet-400'}`} />
                        </div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                            {editing ? 'Edit Debt' : 'Debts'}
                            {!editing && <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-gray-500'}`}>{debts?.length || 0}</span>}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className={`${selectCls} text-sm py-1.5`}>
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="paid">Paid</option>
                        </select>
                        {!isViewer && <button
                            type="button"
                            onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true) } }}
                            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                                showForm
                                    ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                    : (isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')
                            }`}
                        >
                            <FontAwesomeIcon icon={showForm ? faTimes : faPlus} className="text-[10px]" />
                            {showForm ? 'Cancel' : 'Add Debt'}
                        </button>}
                    </div>
                </div>

                {showForm && !isViewer && (
                    <div className={`px-5 py-5 space-y-4 border-b border-solid ${isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#111] border-[#1f1f1f]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Name *</label>
                                <input type="text" className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Car loan, Rent" />
                            </div>
                            <div>
                                <label className={labelCls}>Type</label>
                                <select className={`${selectCls} w-full`} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="owe">I Owe (Payable)</option>
                                    <option value="owed">Owed to Me (Receivable)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Person / Entity</label>
                                <input type="text" className={inputCls} value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} placeholder="Who?" />
                            </div>
                            <div>
                                <label className={labelCls}>Total Amount *</label>
                                <input type="number" className={inputCls} value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
                            </div>
                            <div>
                                <label className={labelCls}>Due Date</label>
                                <input type="date" className={inputCls} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Currency</label>
                                <select className={`${selectCls} w-full`} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Interest % / year</label>
                                <input type="number" className={inputCls} value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="0" min="0" step="0.01" />
                            </div>
                            <div>
                                <label className={labelCls}>Minimum payment</label>
                                <input type="number" className={inputCls} value={form.minimumPayment} onChange={e => setForm({ ...form, minimumPayment: e.target.value })} placeholder="0.00" min="0" step="0.01" />
                            </div>
                            <div>
                                <label className={labelCls}>Notes</label>
                                <input type="text" className={inputCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={resetForm} className={btnSecondary}>Cancel</button>
                            <button type="button" onClick={handleSubmit} disabled={!form.name || !form.total_amount} className={`${btnPrimary} disabled:opacity-50`}>
                                <FontAwesomeIcon icon={faCheck} className="text-xs mr-1.5" />
                                {editing ? 'Save Changes' : 'Add Debt'}
                            </button>
                        </div>
                    </div>
                )}

                {filtered.length > 0 ? (
                    <div className={`divide-y divide-solid ${isLight ? 'divide-slate-100' : 'divide-[#1f1f1f]'}`}>
                        {filtered.map(debt => {
                            const remaining = debt.total_amount - debt.amount_paid
                            const pct = debt.total_amount > 0 ? Math.round((debt.amount_paid / debt.total_amount) * 100) : 0
                            const isPaid = debt.status === 'paid'
                            const isOverdue = debt.due_date && !isPaid && new Date(debt.due_date) < new Date()
                            const lastPaymentDate = debt.payments?.length > 0 ? new Date(debt.payments[debt.payments.length - 1].date) : null
                            const isPaidLate = isPaid && debt.due_date && lastPaymentDate && lastPaymentDate > new Date(debt.due_date)
                            const isExpanded = expandedId === debt._id
                            const isPaymentOpen = paymentForm.debtId === debt._id

                            return (
                                <div key={debt._id}>
                                    <div className={`px-5 py-3.5 transition-colors ${isLight ? 'hover:bg-slate-50/50' : 'hover:bg-[#111]'}`}>
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => handleToggle(debt._id)}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isPaid
                                                    ? (isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400')
                                                    : debt.type === 'owe'
                                                        ? (isLight ? 'bg-red-50 text-red-500' : 'bg-red-900/20 text-red-400')
                                                        : (isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400')
                                                }`} title={isPaid ? 'Mark as active' : 'Mark as paid'}>
                                                <FontAwesomeIcon icon={isPaid ? faCheckCircle : (debt.type === 'owe' ? faArrowUp : faArrowDown)} className="text-xs" />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                    <h4 className={`text-sm font-semibold ${isPaid ? 'line-through opacity-50' : ''} ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{debt.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${debt.type === 'owe'
                                                            ? (isLight ? 'bg-red-50 text-red-500' : 'bg-red-900/20 text-red-400')
                                                            : (isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400')
                                                        }`}>{debt.type === 'owe' ? 'Payable' : 'Receivable'}</span>
                                                        {isPaid && !isPaidLate && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>Paid</span>}
                                                        {isPaidLate && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>Paid Late</span>}
                                                        {isOverdue && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>Overdue</span>}
                                                    </div>
                                                </div>
                                                <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {debt.person && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faUserFriends} className="text-[10px]" /> {debt.person}</span>}
                                                    {debt.due_date && <span className={`flex items-center gap-1 ${isOverdue ? 'text-amber-500' : ''}`}><FontAwesomeIcon icon={faCalendarCheck} className="text-[10px]" /> {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                                    {debt.notes && <span className="truncate max-w-[200px]">{debt.notes}</span>}
                                                </div>

                                                <div className="mt-2">
                                                    <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]'}`}>
                                                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${Math.min(pct, 100)}%`, animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{formatCurrency(debt.amount_paid)} / {formatCurrency(debt.total_amount)}</span>
                                                        <span className={`text-[10px] font-semibold ${pct >= 100 ? 'text-emerald-500' : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>{pct}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!isPaid && !isViewer && (
                                                    <button onClick={() => setPaymentForm(prev => prev.debtId === debt._id ? { debtId: null, amount: '', notes: '', category: '', paymentMethod: 'Cash' } : { debtId: debt._id, amount: '', notes: '', category: '', paymentMethod: 'Cash' })}
                                                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isPaymentOpen
                                                            ? (isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400')
                                                            : (isLight ? 'text-emerald-500 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-900/20')
                                                        }`} title="Add payment">
                                                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                                    </button>
                                                )}
                                                <button onClick={() => setExpandedId(isExpanded ? null : debt._id)}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-50' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'}`}
                                                    title="Payment history">
                                                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[10px]" />
                                                </button>
                                                {!isViewer && <>
                                                <button onClick={() => handleEdit(debt)}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-blue-500 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-900/20'}`}
                                                    title="Edit">
                                                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                </button>
                                                <button onClick={() => handleDelete(debt._id)}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20'}`} title="Delete">
                                                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                </button>
                                                </>}
                                            </div>
                                        </div>

                                        {/* Payment form inline */}
                                        {isPaymentOpen && (
                                            <div className={`mt-3 pt-3 border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Amount *</label>
                                                        <input type="number" className={`${inputCls} text-xs`} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                            placeholder={`Remaining: ${formatCurrency(remaining)}`} min="0" step="0.01" />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Payment Method</label>
                                                        <select className={`${selectCls} w-full text-xs`} value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
                                                        <select className={`${selectCls} w-full text-xs`} value={paymentForm.category} onChange={e => setPaymentForm({ ...paymentForm, category: e.target.value })}>
                                                            <option value="">Uncategorized</option>
                                                            {categories.filter(c => c.type === (debt.type === 'owe' ? 'expense' : 'income')).map(c => (
                                                                <option key={c._id} value={c._id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={`text-[10px] font-medium mb-1 block ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Notes</label>
                                                        <input type="text" className={`${inputCls} text-xs`} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Optional" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button onClick={handlePayment} disabled={!paymentForm.amount}
                                                        className={`${btnPrimary} text-xs px-3 py-2 disabled:opacity-50 whitespace-nowrap`}>
                                                        <FontAwesomeIcon icon={faCheck} className="text-[10px] mr-1" /> Record Payment
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment history (expanded) */}
                                    {isExpanded && (
                                        <div className={`px-5 pt-3 pb-4 ${isLight ? 'bg-slate-50/50' : 'bg-[#0a0a0a]'}`}>
                                            {debt.payments?.length > 0 ? (
                                                <div className={`rounded-lg overflow-hidden border border-solid ${isLight ? 'border-slate-200' : 'border-[#1f1f1f]'}`}>
                                                    <div className={`px-3.5 py-2.5 text-xs font-semibold ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#111] text-gray-400'}`}>
                                                        Payment History ({debt.payments.length})
                                                    </div>
                                                    {debt.payments.slice().reverse().map((p, pi) => (
                                                        <div key={p._id || pi} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm ${pi > 0 ? `border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1a1a1a]'}` : `border-t border-solid ${isLight ? 'border-slate-200' : 'border-[#1f1f1f]'}`} ${isLight ? 'bg-white' : 'bg-[#0e0e0e]'}`}>
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className={`flex-shrink-0 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                    {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                {p.notes && <span className={`truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>· {p.notes}</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="font-semibold text-emerald-500">{formatCurrency(p.amount)}</span>
                                                                {!isViewer && <button onClick={() => handleRemovePayment(debt._id, p._id)}
                                                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isLight ? 'text-red-400 hover:text-red-500 hover:bg-red-50' : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'}`}>
                                                                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                                </button>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={`text-sm text-center py-5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No payments recorded yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-5">
                        <FontAwesomeIcon icon={faHandHoldingUsd} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                            {filterStatus !== 'all' ? 'No debts match this filter.' : 'No debts tracked yet.'}
                        </p>
                        <p className={`text-xs mt-1 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>
                            {filterStatus !== 'all' ? 'Try a different filter.' : 'Click "Add Debt" to start tracking.'}
                        </p>
                    </div>
                )}
            </div></AnimateIn>

            {deleteModal && (
                <DeleteConfirmModal isLight={isLight} title={deleteModal.title} message={deleteModal.message} onCancel={() => setDeleteModal(null)} onConfirm={() => {
                    if (deleteModal.type === 'payment') confirmRemovePayment(deleteModal.debtId, deleteModal.paymentId)
                    else confirmDelete(deleteModal.id)
                }} />
            )}
        </div>
    )
})

export default DebtTab
