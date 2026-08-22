import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faShare, faTags, faCheck, faCircle, faTimes, faUserFriends, faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, SafeIcon } from './SharedComponents'
import ShareCategoryModal from './ShareCategoryModal'
import { CATEGORY_COLORS, ICON_GRID } from './constants'
import { shareBudgetCategory, unshareBudgetCategory } from '../../../actions/budget'


// ==================== CATEGORIES TAB ====================

const CategoriesTab = React.memo(({
    categories, categoryForm, setCategoryForm, editingCategory, showCategoryForm,
    setShowCategoryForm, handleCategorySubmit, handleEditCategory, handleDeleteCategory,
    setEditingCategory, deleteConfirm, isLight, card, inputCls, selectCls, btnPrimary,
    btnSecondary, formatCurrency, emptyCategory, isLoading, dispatch, currentUserId,
    isViewer, ownerParam = {}
}) => {
    const [showIconPicker, setShowIconPicker] = useState(false)
    const [iconSearch, setIconSearch] = useState('')
    const [shareTargetId, setShareTargetId] = useState(null)
    const shareCategory = shareTargetId ? categories.find(c => c._id === shareTargetId) : null
    const pulse = `animate-pulse rounded ${isLight ? 'bg-slate-200/70' : 'bg-[#1f1f1f]'}`

    const handleShareCategory = async (username) => {
        if (!shareCategory) return
        await dispatch(shareBudgetCategory({ id: shareCategory._id, username })).unwrap()
    }

    const handleUnshareCategory = async (targetUserId) => {
        if (!shareCategory) return
        await dispatch(unshareBudgetCategory({ id: shareCategory._id, targetUserId })).unwrap()
    }

    if (isLoading) {
        return (
            <div className="page-type-scale grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, g) => (
                    <div key={g} className={`${card} overflow-hidden`}>
                        <div className={`px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                            <div className={`h-4 w-32 ${pulse}`} />
                        </div>
                        <div className="p-4 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${pulse}`} />
                                    <div className="flex-1">
                                        <div className={`h-3.5 w-24 ${pulse}`} />
                                    </div>
                                    <div className={`h-3 w-16 ${pulse}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const expenseCats = categories.filter(c => c.type === 'expense')
    const incomeCats = categories.filter(c => c.type === 'income')

    return (
        <div className="page-type-scale space-y-4">
            <AnimateIn delay={0}><div className={`${card} overflow-hidden`}>
                <div className={`flex items-center justify-between px-5 py-3.5 border-b border-solid ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                    <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                        {editingCategory ? 'Edit Category' : 'Manage Categories'}
                    </h3>
                    {!isViewer && <button
                        type="button"
                        onClick={() => { setShowCategoryForm(!showCategoryForm); setEditingCategory(null); setCategoryForm(emptyCategory); setShowIconPicker(false); setIconSearch('') }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                            showCategoryForm
                                ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                                : (isLight ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                        }`}
                    >
                        <FontAwesomeIcon icon={showCategoryForm ? faTimes : faPlus} className="text-[10px]" />
                        {showCategoryForm ? 'Cancel' : 'New Category'}
                    </button>}
                </div>

                {showCategoryForm && !isViewer && (
                    <div className={`px-5 py-5 space-y-4 ${isLight ? 'bg-slate-50/50' : 'bg-[#111]'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Name</label>
                                <input type="text" placeholder="Category name" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Type</label>
                                <select value={categoryForm.type} onChange={e => setCategoryForm({...categoryForm, type: e.target.value})} className={`${selectCls} w-full`}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Monthly budget</label>
                                <input type="number" placeholder="0.00" value={categoryForm.budget} onChange={e => setCategoryForm({...categoryForm, budget: e.target.value})} className={inputCls} min="0" step="0.01" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Icon</label>
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className={`w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center gap-2.5 border border-solid text-left transition-all ${isLight ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-[#1a1a1a] border-[#333] hover:border-blue-500'}`}
                                >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                        {categoryForm.icon
                                            ? <SafeIcon name={categoryForm.icon} cls={`text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'}`} />
                                            : <FontAwesomeIcon icon={faCircle} className={`text-xs ${isLight ? 'text-slate-300' : 'text-gray-600'}`} />}
                                    </span>
                                    <span className={`text-sm truncate ${categoryForm.icon ? (isLight ? 'text-slate-700' : 'text-gray-200') : (isLight ? 'text-slate-400' : 'text-gray-500')}`}>
                                        {categoryForm.icon || 'Choose an icon'}
                                    </span>
                                </button>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Color</label>
                                <div className={`min-h-[42px] px-3 py-2 rounded-xl border border-solid flex items-center gap-2 flex-wrap ${isLight ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-[#333]'}`}>
                                    {CATEGORY_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCategoryForm({...categoryForm, color: c})}
                                            aria-label={`Select color ${c}`}
                                            aria-pressed={categoryForm.color === c}
                                            className={`w-7 h-7 rounded-full transition-all ${categoryForm.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: c, ringColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {showIconPicker && (
                            <div className={`rounded-xl border border-solid overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#111] border-[#333]'}`}>
                                <div className="px-3 pt-3 pb-2">
                                    <input
                                        type="text"
                                        value={iconSearch}
                                        onChange={e => setIconSearch(e.target.value)}
                                        placeholder="Search icons..."
                                        className={inputCls}
                                        autoFocus
                                    />
                                </div>
                                <div className="px-3 pb-3 max-h-40 overflow-y-auto grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                                    {!iconSearch && (
                                        <button type="button" onClick={() => { setCategoryForm({...categoryForm, icon: ''}); setShowIconPicker(false); setIconSearch('') }} className={`h-9 rounded-lg flex items-center justify-center text-sm ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#222] text-gray-500'}`} title="None">
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                    {ICON_GRID.filter(ic => !iconSearch || ic.includes(iconSearch.toLowerCase())).map(ic => (
                                        <button key={ic} type="button" onClick={() => { setCategoryForm({...categoryForm, icon: ic}); setShowIconPicker(false); setIconSearch('') }} className={`h-9 rounded-lg flex items-center justify-center transition-all ${categoryForm.icon === ic ? (isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400') : (isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-[#222] text-gray-400')}`} title={ic}>
                                            <SafeIcon name={ic} cls="text-sm" />
                                        </button>
                                    ))}
                                    {ICON_GRID.filter(ic => !iconSearch || ic.includes(iconSearch.toLowerCase())).length === 0 && (
                                        <p className={`col-span-full text-center text-sm py-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No icons found</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none min-h-[42px]">
                                    <input type="checkbox" checked={!!categoryForm.rollover} onChange={e => setCategoryForm({...categoryForm, rollover: e.target.checked, rolloverRule: e.target.checked ? 'carry' : 'none'})} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                                    <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Enable budget rollover</span>
                                </label>
                                {categoryForm.rollover && (
                                    <select value={categoryForm.rolloverRule || 'carry'} onChange={e => setCategoryForm({...categoryForm, rolloverRule: e.target.value})} className={`${selectCls} w-full`}>
                                        <option value="carry">Carry unused budget forward</option>
                                        <option value="savings">Move unused to savings</option>
                                        <option value="reset">Reset monthly (warn if over)</option>
                                    </select>
                                )}
                            </div>
                            {categoryForm.type === 'income' && (
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Allocation %</label>
                                    <div className="flex items-center gap-3">
                                        <input type="number" min="0" max="100" step="5" placeholder="100" value={categoryForm.allocationPercent ?? 100} onChange={e => setCategoryForm({...categoryForm, allocationPercent: e.target.value})} className={`${inputCls} w-24`} />
                                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>% goes to budget</span>
                                    </div>
                                    <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Remainder is saved automatically</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); setCategoryForm(emptyCategory); setShowIconPicker(false); setIconSearch('') }} className={btnSecondary}>Cancel</button>
                            <button type="button" onClick={handleCategorySubmit} className={btnPrimary} disabled={!categoryForm.name}>
                                <FontAwesomeIcon icon={editingCategory ? faCheck : faPlus} className="mr-1.5 text-xs" />
                                {editingCategory ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                )}
            </div></AnimateIn>

            {/* Expense Categories */}
            <AnimateIn delay={100}><div className={`${card} p-5`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                    Expense Categories ({expenseCats.length})
                </h4>
                {expenseCats.length > 0 ? (
                    <div className="space-y-2">
                        {expenseCats.map(cat => {
                            const isOwner = cat.user === currentUserId || cat.user?._id === currentUserId
                            return (
                            <div key={cat._id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    {cat.icon ? (
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                            <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} />
                                        </div>
                                    ) : (
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-medium block truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                            {!isOwner && (
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isLight ? 'bg-violet-50 text-violet-500' : 'bg-violet-900/20 text-violet-400'}`}>
                                                    <FontAwesomeIcon icon={faUserFriends} className="mr-0.5 text-[7px]" />Shared
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {cat.budget > 0 && (
                                                <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Budget: {formatCurrency(cat.budget)}/mo</span>
                                            )}
                                            {cat.rollover && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400'}`}><FontAwesomeIcon icon={faSyncAlt} className="mr-0.5 text-[8px]" />Rollover</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isOwner && !isViewer ? (
                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                    <button onClick={() => setShareTargetId(cat._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-emerald-100 text-emerald-500' : 'hover:bg-emerald-900/30 text-emerald-400'}`} title="Share">
                                        <FontAwesomeIcon icon={faUserFriends} className="text-[10px]" />
                                    </button>
                                    <button onClick={() => handleEditCategory(cat)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`} title="Edit">
                                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-900/30 text-red-400'}`} title="Delete">
                                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                    </button>
                                </div>
                                ) : null}
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No expense categories yet.</p>
                )}
            </div></AnimateIn>

            {/* Income Categories */}
            <AnimateIn delay={200}><div className={`${card} p-5`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                    Income Categories ({incomeCats.length})
                </h4>
                {incomeCats.length > 0 ? (
                    <div className="space-y-2">
                        {incomeCats.map(cat => {
                            const isOwner = cat.user === currentUserId || cat.user?._id === currentUserId
                            return (
                            <div key={cat._id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#141414]'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    {cat.icon ? (
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                                            <SafeIcon name={cat.icon} cls="text-xs" style={{ color: cat.color }} />
                                        </div>
                                    ) : (
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm font-medium truncate ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                                        {!isOwner && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isLight ? 'bg-violet-50 text-violet-500' : 'bg-violet-900/20 text-violet-400'}`}>
                                                <FontAwesomeIcon icon={faUserFriends} className="mr-0.5 text-[7px]" />Shared
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isOwner && !isViewer ? (
                                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditCategory(cat)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-blue-100 text-blue-500' : 'hover:bg-blue-900/30 text-blue-400'}`}>
                                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat._id)} className={`w-7 h-7 rounded-md flex items-center justify-center ${isLight ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-900/30 text-red-400'}`}>
                                        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                    </button>
                                </div>
                                ) : null}
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No income categories yet.</p>
                )}
            </div></AnimateIn>

            {shareCategory && (
                <ShareCategoryModal
                    category={shareCategory}
                    isLight={isLight}
                    onClose={() => setShareTargetId(null)}
                    onShare={handleShareCategory}
                    onUnshare={handleUnshareCategory}
                />
            )}
        </div>
    )
})

export default CategoriesTab
