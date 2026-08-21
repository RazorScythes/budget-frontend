import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faSyncAlt, faUserFriends, faCalendarCheck } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'

export default function SettingsHelpPanel() {
    const { isLight, cardP, descCls } = useSettings()

    return (
        <div className="space-y-4">
            {/* ─── Feature Reference ─── */}
            <AnimateIn delay={800}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-teal-50' : 'bg-teal-900/20'}`}>
                        <FontAwesomeIcon icon={faEye} className={`text-sm ${isLight ? 'text-teal-500' : 'text-teal-400'}`} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Feature Reference</h3>
                        <p className={descCls}>How special features work in the Budget Manager</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[
                        { icon: faEyeSlash, title: 'List Only', desc: 'Mark transactions as "list only" to exclude them from all totals, budgets, and charts while still keeping them visible.', color: isLight ? 'text-amber-500' : 'text-amber-400' },
                        { icon: faSyncAlt, title: 'Budget Rollover', desc: 'Enable per-category to carry unspent budget from the previous month into the current month automatically.', color: isLight ? 'text-blue-500' : 'text-blue-400' },
                        { icon: faSyncAlt, title: 'Recurring Transactions', desc: 'Set transactions to repeat daily, weekly, biweekly, or monthly. They auto-generate when you visit the app.', color: isLight ? 'text-violet-500' : 'text-violet-400' },
                        { icon: faUserFriends, title: 'Shared Categories', desc: 'Share expense categories with other users so they can record transactions under the same categories.', color: isLight ? 'text-emerald-500' : 'text-emerald-400' },
                        { icon: faCalendarCheck, title: 'Year-to-Date', desc: 'Dashboard and Summary tabs show YTD aggregates — income, expenses, balance, and monthly breakdown for the current year.', color: isLight ? 'text-indigo-500' : 'text-indigo-400' },
                    ].map((f, i) => (
                        <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                                <FontAwesomeIcon icon={f.icon} className={`text-xs ${f.color}`} />
                            </div>
                            <div>
                                <p className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>{f.title}</p>
                                <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div></AnimateIn>
        </div>
    )
}
