import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faCheck, faCheckCircle, faEyeSlash, faCogs, faPen, faSpinner, faTableColumns } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'
import { BUDGET_TEMPLATES, TEMPLATE_ACCENT_COLORS, TemplateLayoutPreview } from './templates'
import { PAGE_LAYOUT_OPTIONS, PageLayoutPreview } from '../../../Layout/pageLayoutOptions'

export default function SettingsAppearancePanel() {
    const {
        selectedTemplate, savingTemplate, handleSelectTemplate,
        selectedPageLayout, savingPageLayout, handleSelectPageLayout,
        allTabs, budgetSettings, saveSettings, notify,
        editingFormat, setEditingFormat, formatEdits, setFormatEdits, savingSettings, handleSaveFormatSettings,
        labelCls, titleCls, selectCls, btnPrimary, btnSecondary, isLight, cardP, descCls, metaCls, templateStyles,
        NUMBER_FORMATS, DATE_FORMATS,
    } = useSettings()

    const tagRowLabelCls = `text-xs font-medium uppercase tracking-wide ${isLight ? 'text-slate-400' : 'text-gray-500'}`
    const tagBadgeCls = `text-xs font-medium px-1 py-px rounded`
    const defaultBadgeCls = `text-xs font-medium uppercase px-1 py-px rounded ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1f1f1f] text-gray-500'}`

    return (
        <div className="space-y-4">
            {/* ─── Page Layout ─── */}
            <AnimateIn delay={0}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                        <FontAwesomeIcon icon={faTableColumns} className={`text-sm ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Page Layout</h3>
                        <p className={descCls}>Choose how navigation is arranged across the app</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PAGE_LAYOUT_OPTIONS.map((layout) => {
                        const isActive = selectedPageLayout === layout.id
                        return (
                            <button
                                key={layout.id}
                                type="button"
                                onClick={() => handleSelectPageLayout(layout.id)}
                                disabled={savingPageLayout}
                                className={`relative text-left p-4 rounded-xl border-2 border-solid transition-all ${
                                    isActive
                                        ? (isLight ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-blue-500 bg-blue-900/10')
                                        : (isLight ? 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm' : 'border-[#2B2B2B] hover:border-[#444] bg-[#0e0e0e]')
                                } ${savingPageLayout ? 'opacity-60 cursor-wait' : ''}`}
                            >
                                {isActive && (
                                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${isLight ? 'bg-blue-500' : 'bg-blue-600'}`}>
                                        <FontAwesomeIcon icon={faCheck} className="text-[8px] text-white" />
                                    </div>
                                )}
                                <div className="mb-3">
                                    <PageLayoutPreview layoutId={layout.id} isLight={isLight} />
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={titleCls}>{layout.name}</h4>
                                    {layout.id === 'classic' && (
                                        <span className={defaultBadgeCls}>Default</span>
                                    )}
                                </div>
                                <p className={`${metaCls} leading-relaxed`}>{layout.description}</p>
                            </button>
                        )
                    })}
                </div>
            </div></AnimateIn>

            {/* ─── Layout & Style Template ─── */}
            <AnimateIn delay={50}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-fuchsia-50' : 'bg-fuchsia-900/20'}`}>
                        <FontAwesomeIcon icon={faEye} className={`text-sm ${isLight ? 'text-fuchsia-500' : 'text-fuchsia-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Layout & Style</h3>
                        <p className={descCls}>Each template changes spacing, tab layout, content width, and colors across the budget app</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {BUDGET_TEMPLATES.map(template => {
                        const isActive = selectedTemplate === template.id
                        const accent = TEMPLATE_ACCENT_COLORS[template.preview.accent] || TEMPLATE_ACCENT_COLORS.blue
                        return (
                            <button
                                key={template.id}
                                onClick={() => handleSelectTemplate(template.id)}
                                disabled={savingTemplate}
                                className={`relative text-left p-4 rounded-xl border-2 border-solid transition-all ${
                                    isActive
                                        ? (isLight ? 'border-fuchsia-400 bg-fuchsia-50/50 shadow-sm' : 'border-fuchsia-500 bg-fuchsia-900/10')
                                        : (isLight ? 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm' : 'border-[#2B2B2B] hover:border-[#444] bg-[#0e0e0e]')
                                } ${savingTemplate ? 'opacity-60 cursor-wait' : ''}`}
                            >
                                {isActive && (
                                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${isLight ? 'bg-fuchsia-500' : 'bg-fuchsia-600'}`}>
                                        <FontAwesomeIcon icon={faCheck} className="text-[8px] text-white" />
                                    </div>
                                )}
                                <div className="mb-3">
                                    <TemplateLayoutPreview template={template} isLight={isLight} />
                                </div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className={titleCls}>{template.name}</h4>
                                    {template.id === 'default' && (
                                        <span className={defaultBadgeCls}>Default</span>
                                    )}
                                </div>
                                <p className={`${metaCls} leading-relaxed mb-2.5`}>{template.description}</p>
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap gap-1">
                                        <span className={`${tagRowLabelCls} px-1 py-px rounded bg-transparent`}>Layout</span>
                                        {Object.values(template.layout).map((tag, i) => (
                                            <span key={i} className={`${tagBadgeCls} ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'}`}>{tag}</span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className={`${tagRowLabelCls} px-1 py-px rounded bg-transparent`}>Style</span>
                                        {Object.values(template.style).map((tag, i) => (
                                            <span key={i} className={tagBadgeCls} style={{ backgroundColor: i === 0 ? accent.bg : (isLight ? '#e2e8f0' : '#333'), color: i === 0 ? '#fff' : (isLight ? '#64748b' : '#9ca3af') }}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
                {selectedTemplate !== 'default' && (
                    <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isLight ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-fuchsia-900/10 text-fuchsia-400'}`}>
                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                        <span>Active: <strong>{BUDGET_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</strong> — layout and style applied app-wide</span>
                        <button onClick={() => handleSelectTemplate('default')} className={`ml-auto text-sm font-medium px-2 py-1 rounded-md transition-all ${isLight ? 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200' : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300 border border-[#333]'}`}>
                            Reset to Default
                        </button>
                    </div>
                )}
            </div></AnimateIn>

            {/* ─── Tab Visibility ─── */}
            <AnimateIn delay={50}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-50' : 'bg-violet-900/20'}`}>
                        <FontAwesomeIcon icon={faEye} className={`text-sm ${isLight ? 'text-violet-500' : 'text-violet-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Tab Visibility</h3>
                        <p className={descCls}>Show or hide tabs from the navigation</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allTabs.filter(t => t.id !== 'dashboard' && t.id !== 'settings').map(tab => {
                        const isHidden = (budgetSettings?.hiddenTabs || []).includes(tab.id)
                        return (
                            <button
                                key={tab.id}
                                onClick={async () => {
                                    const current = budgetSettings?.hiddenTabs || []
                                    const updated = isHidden ? current.filter(id => id !== tab.id) : [...current, tab.id]
                                    await saveSettings({ hiddenTabs: updated })
                                    notify(isHidden ? `${tab.label} tab is now visible` : `${tab.label} tab is now hidden`)
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-solid transition-all ${
                                    isHidden
                                        ? (isLight ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-[#111] border-[#2B2B2B] opacity-60')
                                        : (isLight ? 'bg-white border-slate-200 hover:border-violet-300' : 'bg-[#0e0e0e] border-[#2B2B2B] hover:border-violet-800/50')
                                }`}
                            >
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                    isHidden
                                        ? (isLight ? 'bg-slate-100' : 'bg-[#1a1a1a]')
                                        : (isLight ? 'bg-violet-50' : 'bg-violet-900/20')
                                }`}>
                                    <FontAwesomeIcon icon={tab.icon} className={`text-xs ${isHidden ? (isLight ? 'text-slate-400' : 'text-gray-500') : (isLight ? 'text-violet-500' : 'text-violet-400')}`} />
                                </div>
                                <span className={`text-sm font-medium flex-1 text-left ${isHidden ? (isLight ? 'text-slate-400 line-through' : 'text-gray-500 line-through') : (isLight ? 'text-slate-700' : 'text-gray-200')}`}>{tab.label}</span>
                                <FontAwesomeIcon icon={isHidden ? faEyeSlash : faEye} className={`text-xs ${isHidden ? (isLight ? 'text-slate-300' : 'text-gray-600') : (isLight ? 'text-violet-400' : 'text-violet-500')}`} />
                            </button>
                        )
                    })}
                </div>
            </div></AnimateIn>

            {/* ─── Data & Formatting ─── */}
            <AnimateIn delay={600}><div className={cardP}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-rose-50' : 'bg-rose-900/20'}`}>
                            <FontAwesomeIcon icon={faCogs} className={`text-sm ${isLight ? 'text-rose-500' : 'text-rose-400'}`} />
                        </div>
                        <div>
                            <h3 className={titleCls}>Data & Formatting</h3>
                            <p className={descCls}>Customize how your data is displayed</p>
                        </div>
                    </div>
                    {!editingFormat && (
                        <button onClick={() => setEditingFormat(true)} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${isLight ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-rose-900/20 text-rose-400 hover:bg-rose-900/30'}`}>
                            <FontAwesomeIcon icon={faPen} className="text-xs" />
                            Edit
                        </button>
                    )}
                </div>
                {editingFormat ? (
                    <div className="space-y-3">
                        <div>
                            <label className={labelCls}>Number Format</label>
                            <select value={formatEdits.numberFormat} onChange={e => setFormatEdits(p => ({ ...p, numberFormat: e.target.value }))} className={`${selectCls} w-full`}>
                                {NUMBER_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Date Format</label>
                            <select value={formatEdits.dateFormat} onChange={e => setFormatEdits(p => ({ ...p, dateFormat: e.target.value }))} className={`${selectCls} w-full`}>
                                {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Decimal Places</label>
                            <select value={formatEdits.decimalPlaces} onChange={e => setFormatEdits(p => ({ ...p, decimalPlaces: parseInt(e.target.value) }))} className={`${selectCls} w-full`}>
                                <option value={0}>0</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Start of Week</label>
                            <select value={formatEdits.startOfWeek} onChange={e => setFormatEdits(p => ({ ...p, startOfWeek: e.target.value }))} className={`${selectCls} w-full`}>
                                <option value="monday">Monday</option>
                                <option value="sunday">Sunday</option>
                                <option value="saturday">Saturday</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button onClick={handleSaveFormatSettings} disabled={savingSettings} className={btnPrimary}>
                                {savingSettings ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" /> : <FontAwesomeIcon icon={faCheck} className="mr-1.5 text-xs" />}
                                Save Settings
                            </button>
                            <button onClick={() => { setEditingFormat(false); setFormatEdits({ numberFormat: budgetSettings?.numberFormat || 'en-PH', dateFormat: budgetSettings?.dateFormat || 'en-US', decimalPlaces: budgetSettings?.decimalPlaces ?? 2, startOfWeek: budgetSettings?.startOfWeek || 'monday' }) }} className={btnSecondary}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {[
                            { label: 'Number Format', value: budgetSettings?.numberFormat || 'en-PH', desc: 'Controls thousand separators and decimal notation' },
                            { label: 'Date Format', value: budgetSettings?.dateFormat || 'en-US', desc: 'Controls how dates are displayed throughout the app' },
                            { label: 'Decimal Places', value: String(budgetSettings?.decimalPlaces ?? 2), desc: 'Number of decimal places shown for amounts' },
                            { label: 'Start of Week', value: (budgetSettings?.startOfWeek || 'monday').charAt(0).toUpperCase() + (budgetSettings?.startOfWeek || 'monday').slice(1), desc: 'First day of the week in calendar views' },
                            { label: 'Base Currency', value: 'PHP (₱)', desc: 'Internal base for all exchange rate calculations' },
                            { label: 'Rate Source', value: 'open.er-api.com', desc: 'Live rates refresh every 6 hours, overridable manually' },
                        ].map((item, i) => (
                            <div key={i} className={`flex items-start justify-between px-3 py-2.5 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <div>
                                    <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{item.label}</p>
                                    <p className={metaCls}>{item.desc}</p>
                                </div>
                                <span className={`text-sm font-bold flex-shrink-0 ml-3 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div></AnimateIn>
        </div>
    )
}
