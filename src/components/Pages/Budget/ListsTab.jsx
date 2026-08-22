import React, { useState, useEffect, useMemo, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faListAlt, faSearch, faCheck, faWallet, faEye, faEyeSlash, faTimes, faArrowUp, faArrowDown, faMinus, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, DeleteConfirmModal, SafeIcon as SafeIconShared } from './SharedComponents'
import { CATEGORY_COLORS, CURRENCIES } from './constants'
import { createBudgetList, updateBudgetList, deleteBudgetList, createBudgetExpense } from '../../../actions/budget'

// ==================== LISTS TAB ====================

const LIST_COLORS = [...CATEGORY_COLORS, '#84cc16', '#f43f5e']

const LIST_CURRENCIES = [
    ...CURRENCIES.map(c => ({ symbol: c.symbol, label: `${c.code} (${c.symbol})` })),
    { symbol: 'Fr', label: 'CHF (Fr)' },
    { symbol: 'R$', label: 'BRL (R$)' },
]

const formatListAmount = (v, list) => {
    const num = v || 0
    const show = list?.showCurrency !== false
    const sym = list?.currency || '₱'
    if (show) return `${sym}${num.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return Math.round(num).toLocaleString('en')
}

const LIST_ICONS = [
    'peso-sign','dollar-sign','money-bill-wave','coins','piggy-bank','wallet','credit-card','chart-line','chart-bar','calculator',
    'arrow-up','arrow-down','plus','minus','exchange-alt','hand-holding-usd','money-check-alt','receipt','file-invoice-dollar','cash-register',
    'shopping-cart','shopping-bag','store','tags','tag','box','gift','truck','home','building',
    'utensils','coffee','pizza-slice','hamburger','apple-alt','wine-glass','beer','ice-cream','cookie','bread-slice',
    'car','bus','plane','gas-pump','taxi','motorcycle','bicycle','subway','ship','helicopter',
    'tshirt','shoe-prints','glasses','hat-cowboy','gem','crown','ring','vest','mitten','socks',
    'laptop','desktop','mobile-alt','tablet-alt','keyboard','mouse','headphones','tv','gamepad','wifi',
    'book','graduation-cap','school','pencil-alt','pen','ruler','chalkboard','globe','microscope','flask',
    'heartbeat','medkit','pills','stethoscope','tooth','eye','brain','lungs','dumbbell','running',
    'bolt','lightbulb','fire','water','leaf','seedling','tree','sun','moon','cloud',
    'wrench','tools','hammer','screwdriver','paint-roller','paint-brush','broom','key','lock','shield-alt',
    'music','guitar','drum','microphone','film','camera','palette','theater-masks','puzzle-piece','dice',
    'baby','dog','cat','horse','fish','dove','paw','bone','star','heart',
    'bell','flag','bookmark','trophy','medal','award','phone','envelope','paper-plane','comments',
]

const SafeIcon = SafeIconShared

const ListIconPicker = ({ value, onChange, isLight }) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = useMemo(() => {
        if (!search) return LIST_ICONS
        const q = search.toLowerCase()
        return LIST_ICONS.filter(n => n.includes(q))
    }, [search])

    return (
        <div className="relative" ref={ref}>
            <button type="button" onClick={() => { setOpen(!open); setSearch('') }}
                className={`w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center gap-2.5 border border-solid text-left transition-all ${
                    open
                        ? (isLight ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-100' : 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-900/30')
                        : (isLight ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-[#1a1a1a] border-[#333] hover:border-blue-500')
                }`}
            >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                    <SafeIcon name={value} cls={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`} />
                </span>
                <span className={`text-sm truncate ${value ? (isLight ? 'text-slate-700' : 'text-gray-200') : (isLight ? 'text-slate-400' : 'text-gray-500')}`}>
                    {value || 'Choose an icon'}
                </span>
            </button>

            {open && (
                <div className={`absolute z-50 mt-1.5 left-0 right-0 rounded-xl border border-solid shadow-xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e0e] border-[#2B2B2B]'}`}>
                    <div className={`px-3 py-2 border-b border-solid ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-[#1f1f1f] bg-[#111]'}`}>
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} autoFocus
                                placeholder="Search icons..."
                                className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-sm border border-solid outline-none ${isLight ? 'bg-white border-slate-200 focus:border-blue-400 text-slate-700' : 'bg-[#1a1a1a] border-[#333] focus:border-blue-500 text-gray-200'}`}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-44 p-2">
                        {filtered.length > 0 ? (
                            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                                {filtered.map(name => (
                                    <button key={name} type="button" title={name}
                                        onClick={() => { onChange(name); setOpen(false) }}
                                        className={`h-9 rounded-lg flex items-center justify-center transition-all ${
                                            value === name
                                                ? (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400')
                                                : (isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#222]')
                                        }`}>
                                        <SafeIcon name={name} cls="text-sm" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-center py-4 text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No icons found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const ListsTab = React.memo(({ budgetLists, dispatch, isLight, card, inputCls, selectCls, btnPrimary, btnSecondary, isLoading, isViewer, ownerParam = {}, month, year }) => {
    const [showForm, setShowForm] = useState(false)
    const [editingList, setEditingList] = useState(null)
    const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6', icon: 'peso-sign', currency: '₱', showCurrency: true, items: [] })
    const [newItemName, setNewItemName] = useState('')
    const [newItemAmount, setNewItemAmount] = useState('')
    const [newItemType, setNewItemType] = useState('subtract')
    const [deleteModal, setDeleteModal] = useState(null)
    const [expandedList, setExpandedList] = useState(null)
    const [editingItem, setEditingItem] = useState(null)
    const [editItemForm, setEditItemForm] = useState({ name: '', amount: '', type: 'subtract', notes: '' })

    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const resetForm = () => {
        setForm({ name: '', description: '', color: '#3b82f6', icon: 'peso-sign', currency: '₱', showCurrency: true, items: [] })
        setEditingList(null)
        setShowForm(false)
        setNewItemName('')
        setNewItemAmount('')
        setNewItemType('subtract')
    }

    const openEdit = (list) => {
        setForm({
            name: list.name,
            description: list.description || '',
            color: list.color || '#3b82f6',
            icon: list.icon || 'peso-sign',
            currency: list.currency || '₱',
            showCurrency: list.showCurrency !== false,
            items: list.items?.map(i => ({ ...i })) || []
        })
        setEditingList(list._id)
        setShowForm(true)
    }

    const addItem = () => {
        if (!newItemName.trim()) return
        setForm(f => ({
            ...f,
            items: [...f.items, { name: newItemName.trim(), amount: parseFloat(newItemAmount) || 0, type: newItemType, checked: false, notes: '' }]
        }))
        setNewItemName('')
        setNewItemAmount('')
    }

    const removeItem = (idx) => {
        setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
    }

    const handleSubmit = async () => {
        if (!form.name.trim()) return
        try {
            if (editingList) await dispatch(updateBudgetList({ id: editingList, ...form, ...ownerParam })).unwrap()
            else await dispatch(createBudgetList({ ...form, ...ownerParam })).unwrap()
            resetForm()
        } catch (err) { /* form kept open */ }
    }

    const handleDelete = (id) => {
        setDeleteModal({ id, title: 'Delete List', message: 'Are you sure you want to delete this list? All items will be permanently removed.' })
    }

    const confirmDelete = async (id) => {
        await dispatch(deleteBudgetList({ id, ...ownerParam }))
        setDeleteModal(null)
        if (expandedList === id) setExpandedList(null)
    }

    const listPayload = (list, items) => ({ id: list._id, name: list.name, description: list.description, color: list.color, icon: list.icon, currency: list.currency, showCurrency: list.showCurrency, items, ...ownerParam })

    const convertCheckedToExpenses = async (list) => {
        const checked = (list.items || []).filter(i => i.checked && i.amount)
        if (!checked.length) return
        await dispatch(createBudgetExpense({
            ...ownerParam,
            date: new Date().toISOString().slice(0, 10),
            type: 'expense',
            paymentMethod: 'Cash',
            notes: `From list: ${list.name}`,
            items: checked.map(i => ({ description: i.name, amount: String(i.amount) })),
            month,
            year,
            confirmDuplicates: true,
        }))
        const leftover = (list.items || []).filter(i => !i.checked)
        await dispatch(updateBudgetList(listPayload(list, leftover)))
    }

    const toggleItemCheck = async (list, itemIdx) => {
        const updatedItems = list.items.map((it, i) => i === itemIdx ? { ...it, checked: !it.checked } : { ...it })
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
    }

    const startEditItem = (listId, itemIdx, item) => {
        setEditingItem({ listId, itemIdx })
        setEditItemForm({ name: item.name, amount: item.amount?.toString() || '0', type: item.type || 'subtract', notes: item.notes || '' })
    }

    const saveEditItem = async (list) => {
        if (!editingItem) return
        const updatedItems = list.items.map((it, i) =>
            i === editingItem.itemIdx
                ? { ...it, name: editItemForm.name, amount: parseFloat(editItemForm.amount) || 0, type: editItemForm.type, notes: editItemForm.notes }
                : { ...it }
        )
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
        setEditingItem(null)
    }

    const deleteItemFromList = async (list, itemIdx) => {
        const updatedItems = list.items.filter((_, i) => i !== itemIdx)
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
    }

    const quickAddItem = async (list, name, amount, type) => {
        if (!name.trim()) return
        const updatedItems = [...list.items.map(i => ({ ...i })), { name: name.trim(), amount: parseFloat(amount) || 0, type: type || 'subtract', checked: false, notes: '' }]
        await dispatch(updateBudgetList(listPayload(list, updatedItems)))
    }

    const getListStats = (list) => {
        const items = list.items || []
        const total = items.length
        const checked = items.filter(i => i.checked).length
        const addTotal = items.filter(i => (i.type || 'subtract') === 'add').reduce((s, i) => s + (i.amount || 0), 0)
        const subtractTotal = items.filter(i => (i.type || 'subtract') === 'subtract').reduce((s, i) => s + (i.amount || 0), 0)
        const net = addTotal - subtractTotal
        return { total, checked, addTotal, subtractTotal, net, pct: total > 0 ? Math.round((checked / total) * 100) : 0 }
    }

    if (isLoading && budgetLists.length === 0) {
        return (
            <div className="page-type-scale space-y-4">
                <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`h-5 w-32 ${pulse}`} />
                        <div className={`h-8 w-24 rounded-lg ${pulse}`} />
                    </div>
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`${card} overflow-hidden`}>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                                <div className="flex-1 space-y-1.5">
                                    <div className={`h-4 w-36 ${pulse}`} />
                                    <div className={`h-2.5 w-48 ${pulse}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[...Array(3)].map((_, j) => <div key={j} className={`h-14 rounded-lg ${pulse}`} />)}
                            </div>
                        </div>
                        <div className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className={`flex items-center gap-3 px-5 py-3 ${j > 0 ? `border-t border-solid ${isLight ? 'border-slate-50' : 'border-[#1a1a1a]'}` : ''}`}>
                                    <div className={`w-5 h-5 rounded ${pulse}`} />
                                    <div className={`h-3 flex-1 ${pulse}`} />
                                    <div className={`h-3 w-16 ${pulse}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="page-type-scale space-y-4">
            {/* Header + Form */}
            <AnimateIn delay={0}><div className={`${card} overflow-hidden`}>
                <div className={`flex items-center justify-between px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <div>
                        <h2 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                            {editingList ? 'Edit List' : 'Budget Lists'}
                        </h2>
                        {!editingList && (
                            <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                {budgetLists.length} list{budgetLists.length !== 1 ? 's' : ''}
                                {budgetLists.length > 0 && (() => {
                                    const allNet = budgetLists.reduce((s, l) => s + getListStats(l).net, 0)
                                    return <> · Net: <span className={allNet >= 0 ? 'text-emerald-500' : 'text-red-500'}>{allNet >= 0 ? '+' : ''}{Math.round(allNet).toLocaleString('en')}</span></>
                                })()}
                            </p>
                        )}
                    </div>
                    {!isViewer && <button
                        type="button"
                        onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true) } }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                            showForm
                                ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                : (isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
                        }`}
                    >
                        <FontAwesomeIcon icon={showForm ? faTimes : faPlus} className="text-[10px]" />
                        {showForm ? 'Cancel' : 'New List'}
                    </button>}
                </div>

                {showForm && !isViewer && (
                    <div className={`px-5 py-5 space-y-4 ${isLight ? 'bg-slate-50/50' : 'bg-[#111]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Name</label>
                                <input type="text" placeholder="List name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Description</label>
                                <input type="text" placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Icon</label>
                                <ListIconPicker value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} isLight={isLight} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Color</label>
                                <div className={`min-h-[42px] px-3 py-2 rounded-xl border border-solid flex items-center gap-2 flex-wrap ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-[#333]'}`}>
                                    {LIST_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                                            aria-label={`Select color ${c}`}
                                            aria-pressed={form.color === c}
                                            className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: c, ringColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Currency</label>
                                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                                    className={`${selectCls} w-full`}>
                                    {LIST_CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Show currency</label>
                                <button type="button" onClick={() => setForm(f => ({ ...f, showCurrency: !f.showCurrency }))}
                                    className={`w-full min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-solid transition-all ${
                                        form.showCurrency
                                            ? (isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-900/20 border-blue-800/40 text-blue-400')
                                            : (isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#1a1a1a] border-[#333] text-gray-400')
                                    }`}
                                    title={form.showCurrency ? 'Currency visible — amounts show symbol and decimals' : 'Currency hidden — amounts show integers only'}
                                >
                                    <FontAwesomeIcon icon={form.showCurrency ? faEye : faEyeSlash} className="text-xs" />
                                    {form.showCurrency ? 'Shown' : 'Hidden'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Items ({form.items.length})</label>
                            {form.items.length > 0 && (
                                <div className={`rounded-xl border border-solid mb-3 divide-y ${isLight ? 'border-slate-200 divide-slate-100 bg-white' : 'border-[#2B2B2B] divide-[#1f1f1f] bg-[#1a1a1a]'}`}>
                                    {form.items.map((item, idx) => {
                                        const t = item.type || 'subtract'
                                        return (
                                            <div key={idx} className="flex items-center gap-2.5 px-3 py-2.5">
                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${t === 'add' ? (isLight ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-900/20 text-emerald-400') : (isLight ? 'bg-red-50 text-red-500' : 'bg-red-900/20 text-red-400')}`}>
                                                    <SafeIcon name={form.icon || 'peso-sign'} cls="text-xs font-bold" />
                                                </div>
                                                <span className={`text-sm flex-1 min-w-0 truncate ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{item.name}</span>
                                                <span className={`text-sm font-medium tabular-nums w-28 text-right flex-shrink-0 ${t === 'add' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {t === 'add' ? '+' : '-'}{formatListAmount(item.amount || 0, form)}
                                                </span>
                                                <button type="button" onClick={() => removeItem(idx)} className={`p-0.5 transition-colors flex-shrink-0 ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
                                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="text" placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addItem()} className={`${inputCls} !w-auto flex-1 min-w-0`} />
                                <input type="number" placeholder="Amount" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addItem()} className={`${inputCls} !w-28`} />
                                <button
                                    type="button"
                                    onClick={() => setNewItemType(t => t === 'subtract' ? 'add' : 'subtract')}
                                    className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center flex-shrink-0 transition-all border border-solid ${
                                        newItemType === 'add'
                                            ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400')
                                            : (isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-900/20 border-red-800/40 text-red-400')
                                    }`}
                                    title={newItemType === 'add' ? 'Income (+)' : 'Expense (-)'}
                                >
                                    <FontAwesomeIcon icon={newItemType === 'add' ? faPlus : faMinus} className="text-xs" />
                                </button>
                                <button type="button" onClick={addItem} className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-400'}`}>
                                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={resetForm} className={btnSecondary}>Cancel</button>
                            <button type="button" onClick={handleSubmit} className={btnPrimary}>
                                <FontAwesomeIcon icon={faCheck} className="text-xs mr-1.5" />
                                {editingList ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                )}
            </div></AnimateIn>

            {/* Lists */}
            {budgetLists.length === 0 && !showForm ? (
                <div className={`${card} p-8 text-center`}>
                    <FontAwesomeIcon icon={faListAlt} className={`text-3xl mb-3 ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />
                    <p className={`text-sm font-medium mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No lists yet</p>
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Create a budget list to plan and track purchases, goals, or wishlists.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {budgetLists.map((list, listIdx) => {
                        const stats = getListStats(list)
                        const isExpanded = expandedList === list._id
                        return (
                            <AnimateIn key={list._id} delay={listIdx * 100}>
                            <div className={`${card} overflow-hidden`}>
                                <div className="relative">
                                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: list.color || '#3b82f6' }} />
                                    <div className="p-4 sm:p-5 pt-5 sm:pt-6">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${list.color || '#3b82f6'}20` }}>
                                                    <SafeIcon name={list.icon || 'peso-sign'} cls="text-sm" style={{ color: list.color || '#3b82f6' }} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{list.name}</h3>
                                                    {list.description && <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{list.description}</p>}
                                                </div>
                                            </div>
                                            {!isViewer && <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => openEdit(list)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                                                </button>
                                                <button onClick={() => handleDelete(list._id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-900/20 text-red-400'}`}>
                                                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                </button>
                                            </div>}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <div className={`rounded-lg p-2.5 sm:p-3 ${isLight ? 'bg-emerald-50/70' : 'bg-emerald-900/10'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FontAwesomeIcon icon={faArrowUp} className="text-xs text-emerald-500" />
                                                    <span className={`text-sm font-medium ${isLight ? 'text-emerald-600/70' : 'text-emerald-400/70'}`}>Income</span>
                                                </div>
                                                <p className="text-sm font-bold text-emerald-500">{formatListAmount(stats.addTotal, list)}</p>
                                            </div>
                                            <div className={`rounded-lg p-2.5 sm:p-3 ${isLight ? 'bg-red-50/70' : 'bg-red-900/10'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FontAwesomeIcon icon={faArrowDown} className="text-xs text-red-500" />
                                                    <span className={`text-sm font-medium ${isLight ? 'text-red-600/70' : 'text-red-400/70'}`}>Expense</span>
                                                </div>
                                                <p className="text-sm font-bold text-red-500">{formatListAmount(stats.subtractTotal, list)}</p>
                                            </div>
                                            <div className={`rounded-lg p-2.5 sm:p-3 ${isLight ? 'bg-slate-50' : 'bg-[#151515]'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FontAwesomeIcon icon={faWallet} className={`text-xs ${stats.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                                                    <span className={`text-sm font-medium ${isLight ? 'text-slate-500/70' : 'text-gray-400/70'}`}>Net</span>
                                                </div>
                                                <p className={`text-sm font-bold ${stats.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {stats.net >= 0 ? '+' : ''}{formatListAmount(stats.net, list)}
                                                </p>
                                            </div>
                                        </div>

                                        {stats.total > 0 && (
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-[#1f1f1f]'}`}>
                                                    <div className="h-full rounded-full" style={{ width: `${stats.pct}%`, backgroundColor: list.color || '#3b82f6', animation: 'barGrow 0.8s ease-out 0.3s both' }} />
                                                </div>
                                                <span className={`text-sm font-medium flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{stats.checked}/{stats.total} done</span>
                                                {!isViewer && stats.checked > 0 && (
                                                    <button type="button" onClick={() => convertCheckedToExpenses(list)} className={`text-xs font-semibold px-2 py-0.5 rounded ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>
                                                        Log as expenses
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Items table */}
                                <div className={`border-t border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                                    {list.items?.length > 0 ? (
                                        <>
                                            <div className={`divide-y ${isLight ? 'divide-slate-50' : 'divide-[#1a1a1a]'}`}>
                                                {(isExpanded ? list.items : list.items.slice(0, 5)).map((item, idx) => {
                                                    const itemType = item.type || 'subtract'
                                                    const isItemEditing = editingItem?.listId === list._id && editingItem?.itemIdx === idx
                                                    return (
                                                        <div key={idx} className={`flex items-center gap-2.5 mx-4 sm:mx-5 mb-1.5 px-3 py-2.5 rounded-lg group transition-colors ${
                                                            item.checked
                                                                ? (isLight ? 'bg-slate-50 border border-solid border-slate-100 opacity-60' : 'bg-[#0a0a0a] border border-solid border-[#1a1a1a] opacity-60')
                                                                : itemType === 'add'
                                                                    ? (isLight ? 'bg-emerald-50/80 border border-solid border-emerald-100 hover:border-emerald-200' : 'bg-emerald-900/10 border border-solid border-emerald-900/30 hover:border-emerald-800/50')
                                                                    : (isLight ? 'bg-red-50/80 border border-solid border-red-100 hover:border-red-200' : 'bg-red-900/10 border border-solid border-red-900/30 hover:border-red-800/50')
                                                        }`}>
                                                            <button onClick={() => toggleItemCheck(list, idx)}
                                                                className={`w-[18px] h-[18px] rounded flex items-center justify-center border border-solid transition-all flex-shrink-0 ${
                                                                    item.checked ? 'border-transparent text-white' : (isLight ? 'border-slate-300 hover:border-blue-400' : 'border-[#444] hover:border-blue-500')
                                                                }`}
                                                                style={item.checked ? { backgroundColor: list.color || '#3b82f6' } : {}}
                                                            >
                                                                {item.checked && <FontAwesomeIcon icon={faCheck} className="text-[8px]" />}
                                                            </button>

                                                            {isItemEditing ? (
                                                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                    <input type="text" value={editItemForm.name} onChange={e => setEditItemForm(f => ({ ...f, name: e.target.value }))}
                                                                        onKeyDown={e => e.key === 'Enter' && saveEditItem(list)} className={`${inputCls} !w-auto flex-1 min-w-0 !py-1.5 !text-sm`} autoFocus />
                                                                    <input type="number" value={editItemForm.amount} onChange={e => setEditItemForm(f => ({ ...f, amount: e.target.value }))}
                                                                        onKeyDown={e => e.key === 'Enter' && saveEditItem(list)} className={`${inputCls} !w-28 !py-1.5 !text-sm`} />
                                                                    <button
                                                                        onClick={() => setEditItemForm(f => ({ ...f, type: f.type === 'add' ? 'subtract' : 'add' }))}
                                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border border-solid ${
                                                                            editItemForm.type === 'add'
                                                                                ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400')
                                                                                : (isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-900/20 border-red-800/40 text-red-400')
                                                                        }`}
                                                                    >
                                                                        <FontAwesomeIcon icon={editItemForm.type === 'add' ? faPlus : faMinus} className="text-xs" />
                                                                    </button>
                                                                    <button onClick={() => saveEditItem(list)} className="text-emerald-500 hover:text-emerald-600 p-0.5 flex-shrink-0">
                                                                        <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                                                    </button>
                                                                    <button onClick={() => setEditingItem(null)} className="text-red-400 hover:text-red-500 p-0.5 flex-shrink-0">
                                                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                                                        itemType === 'add'
                                                                            ? (isLight ? 'bg-emerald-100 text-emerald-500' : 'bg-emerald-900/30 text-emerald-400')
                                                                            : (isLight ? 'bg-red-100 text-red-500' : 'bg-red-900/30 text-red-400')
                                                                    }`}>
                                                                        <SafeIcon name={list.icon || 'peso-sign'} cls="text-xs font-bold" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className={`text-sm font-medium block truncate transition-all ${item.checked ? 'line-through' : ''} ${
                                                                            item.checked
                                                                                ? (isLight ? 'text-slate-400' : 'text-gray-500')
                                                                                : itemType === 'add'
                                                                                    ? (isLight ? 'text-emerald-700' : 'text-emerald-300')
                                                                                    : (isLight ? 'text-red-700' : 'text-red-300')
                                                                        }`}>
                                                                            {item.name}
                                                                        </span>
                                                                        {item.notes && <p className={`text-sm truncate ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>{item.notes}</p>}
                                                                    </div>
                                                                    <span className={`text-sm font-bold tabular-nums w-28 text-right flex-shrink-0 ${item.checked ? 'opacity-40 line-through' : ''} ${itemType === 'add' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                        {itemType === 'add' ? '+' : '-'}{formatListAmount(item.amount || 0, list)}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex-shrink-0">
                                                                        <button onClick={() => startEditItem(list._id, idx, item)} className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                                                            <FontAwesomeIcon icon={faPen} className="text-xs" />
                                                                        </button>
                                                                        <button onClick={() => deleteItemFromList(list, idx)} className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-900/20 text-red-400'}`}>
                                                                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {list.items.length > 5 && (
                                                <button onClick={() => setExpandedList(isExpanded ? null : list._id)}
                                                    className={`w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-all border-t border-solid ${isLight ? 'border-slate-50 text-slate-400 hover:bg-slate-50 hover:text-slate-600' : 'border-[#1a1a1a] text-gray-500 hover:bg-[#111] hover:text-gray-300'}`}>
                                                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-xs" />
                                                    {isExpanded ? 'Show less' : `Show ${list.items.length - 5} more`}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className={`px-5 py-4 text-center text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No items — add one below</div>
                                    )}
                                    <QuickAddItem list={list} quickAddItem={quickAddItem} isLight={isLight} inputCls={inputCls} />
                                </div>
                            </div>
                            </AnimateIn>
                        )
                    })}
                </div>
            )}
        </div>
    )
})

const QuickAddItem = ({ list, quickAddItem, isLight, inputCls }) => {
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState('subtract')

    const handleAdd = async () => {
        if (!name.trim()) return
        await quickAddItem(list, name, amount, type)
        setName('')
        setAmount('')
    }

    return (
        <div className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 border-t border-solid ${isLight ? 'border-slate-100 bg-slate-50/30' : 'border-[#1f1f1f] bg-[#090909]'}`}>
            <input type="text" placeholder="Add item..." value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} className={`${inputCls} !w-auto flex-1 min-w-0 !py-1.5 !text-sm`} />
            <input type="number" placeholder="₱" value={amount} onChange={e => setAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} className={`${inputCls} !w-28 !py-1.5 !text-sm`} />
            <button onClick={() => setType(t => t === 'subtract' ? 'add' : 'subtract')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border border-solid ${
                    type === 'add'
                        ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400')
                        : (isLight ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-900/20 border-red-800/40 text-red-400')
                }`}
                title={type === 'add' ? 'Income (+)' : 'Expense (-)'}
            >
                <FontAwesomeIcon icon={type === 'add' ? faPlus : faMinus} className="text-xs" />
            </button>
            <button onClick={handleAdd} className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isLight ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
            </button>
        </div>
    )
}


export default ListsTab
