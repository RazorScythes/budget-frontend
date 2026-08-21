import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faExchangeAlt, faCheck, faCheckCircle, faCoins, faPen, faTimes, faSyncAlt, faSpinner, faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'
import { AnimateIn } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'
import { CURRENCIES, DEFAULT_EXCHANGE_RATES } from '../constants'

export default function SettingsCurrencyPanel() {
    const {
        isLight, cardP, descCls, templateStyles, labelCls, selectCls, btnPrimary, inputCls,
        viewCurrency, setViewCurrency, savedBaseCurrency, activeViewCurrency, handleSetDefaultCurrency,
        rateEditorOpen, setRateEditorOpen, rateEdits, setRateEdits, savedRates, exchangeRates,
        confirmReset, setConfirmReset, handleResetRates, resettingRates, handleSaveRates, savingRates,
    } = useSettings()

    return (
        <div className="space-y-4">
            {/* ─── Default Currency ─── */}
            <AnimateIn delay={100}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${templateStyles?.accentBg || (isLight ? 'bg-blue-50' : 'bg-blue-900/20')}`}>
                        <FontAwesomeIcon icon={faExchangeAlt} className={`text-sm ${templateStyles?.accentText || (isLight ? 'text-blue-500' : 'text-blue-400')}`} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Default Currency</h3>
                        <p className={descCls}>All amounts will be displayed in this currency</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Display Currency</label>
                        <select
                            value={viewCurrency}
                            onChange={e => setViewCurrency(e.target.value)}
                            className={`${selectCls} w-full`}
                        >
                            {CURRENCIES.map(c => {
                                const val = c.code === 'PHP' ? '' : c.code
                                const isDefault = c.code === (savedBaseCurrency || 'PHP')
                                return <option key={c.code} value={val}>{c.symbol} {c.code} — {c.name}{isDefault ? ' ★ Default' : ''}</option>
                            })}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {activeViewCurrency !== (savedBaseCurrency || 'PHP') ? (
                            <button onClick={() => handleSetDefaultCurrency(activeViewCurrency)} className={`${btnPrimary} w-full justify-center`}>
                                <FontAwesomeIcon icon={faCheck} className="mr-1.5 text-xs" />
                                Set {activeViewCurrency} as Default
                            </button>
                        ) : (
                            <div className={`w-full text-center py-2.5 rounded-lg text-xs font-medium ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" />
                                {activeViewCurrency} is your default currency
                            </div>
                        )}
                    </div>
                </div>
            </div></AnimateIn>

            {/* ─── Exchange Rates ─── */}
            <AnimateIn delay={200}><div className={cardP}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                            <FontAwesomeIcon icon={faCoins} className={`text-sm ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Exchange Rates</h3>
                            <p className={descCls}>Rates relative to PHP (₱1 = X foreign)</p>
                        </div>
                    </div>
                    <button onClick={() => setRateEditorOpen(!rateEditorOpen)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                        rateEditorOpen
                            ? (isLight ? 'bg-slate-100 text-slate-600' : 'bg-[#1f1f1f] text-gray-400')
                            : (isLight ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-amber-900/20 text-amber-400 hover:bg-amber-900/30')
                    }`}>
                        <FontAwesomeIcon icon={rateEditorOpen ? faTimes : faPen} className="text-[10px]" />
                        {rateEditorOpen ? 'Cancel' : 'Edit Rates'}
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CURRENCIES.filter(c => c.code !== 'PHP').map(c => (
                        <div key={c.code} className={`px-3 py-2.5 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{c.symbol} {c.code}</span>
                                {savedRates?.[c.code] && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400'}`}>Custom</span>}
                            </div>
                            {rateEditorOpen ? (
                                <input
                                    type="number"
                                    value={rateEdits[c.code] || ''}
                                    onChange={e => setRateEdits(prev => ({ ...prev, [c.code]: e.target.value }))}
                                    className={`${inputCls} !py-1.5 !text-xs`}
                                    step="any"
                                    min="0"
                                    placeholder={`${DEFAULT_EXCHANGE_RATES[c.code] || ''}`}
                                />
                            ) : (
                                <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                    {exchangeRates[c.code]?.toFixed(4) || '—'}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {rateEditorOpen && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-solid" style={{ borderColor: isLight ? '#f1f5f9' : '#1f1f1f' }}>
                        <div className="flex items-center gap-2">
                            {confirmReset ? (
                                <>
                                    <span className={`text-xs ${isLight ? 'text-red-500' : 'text-red-400'}`}>Reset all to live rates?</span>
                                    <button onClick={handleResetRates} disabled={resettingRates} className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${isLight ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                                        {resettingRates ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Confirm'}
                                    </button>
                                    <button onClick={() => setConfirmReset(false)} className={`text-xs px-2 py-1.5 rounded-lg ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-[#1f1f1f]'}`}>No</button>
                                </>
                            ) : (
                                <button onClick={() => setConfirmReset(true)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a]'}`}>
                                    <FontAwesomeIcon icon={faSyncAlt} className="mr-1.5 text-[10px]" />
                                    Reset to Live
                                </button>
                            )}
                        </div>
                        <button onClick={handleSaveRates} disabled={savingRates} className={btnPrimary}>
                            {savingRates ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5" /> : <FontAwesomeIcon icon={faCheck} className="mr-1.5 text-xs" />}
                            Save Rates
                        </button>
                    </div>
                )}
            </div></AnimateIn>

            {/* ─── Supported Currencies ─── */}
            <AnimateIn delay={700}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-indigo-50' : 'bg-indigo-900/20'}`}>
                        <FontAwesomeIcon icon={faMoneyBillWave} className={`text-sm ${isLight ? 'text-indigo-500' : 'text-indigo-400'}`} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Supported Currencies</h3>
                        <p className={descCls}>Available currencies for transactions and display</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CURRENCIES.map(c => {
                        const isActive = c.code === activeViewCurrency
                        const isDefault = c.code === (savedBaseCurrency || 'PHP')
                        const rate = c.code === 'PHP' ? null : exchangeRates[c.code]
                        return (
                            <div key={c.code} className={`px-3 py-2.5 rounded-lg border border-solid transition-all ${
                                isActive
                                    ? (isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-900/15 border-indigo-800/30')
                                    : (isLight ? 'bg-white border-slate-200' : 'bg-[#111] border-[#2B2B2B]')
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{c.symbol} {c.code}</span>
                                    <div className="flex items-center gap-1">
                                        {isDefault && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>★</span>}
                                        {isActive && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-900/30 text-indigo-400'}`}>Viewing</span>}
                                    </div>
                                </div>
                                <p className={`text-[11px] truncate ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{c.name}</p>
                                {rate && <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-300' : 'text-gray-600'}`}>₱1 = {rate.toFixed(4)}</p>}
                            </div>
                        )
                    })}
                </div>
            </div></AnimateIn>
        </div>
    )
}
