import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine } from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { calcMonthOverMonth } from '../../../utils/netWorth'

const TrendsChart = ({ isLight, ytdData, month, formatCurrency, card }) => {
    const mom = calcMonthOverMonth(ytdData?.monthlyBreakdown, month - 1)
    const chartData = ytdData?.monthlyBreakdown
        ? Array.from({ length: month }, (_, i) => ({
            name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            expense: ytdData.monthlyBreakdown[i]?.expense || 0,
            income: ytdData.monthlyBreakdown[i]?.income || 0,
        }))
        : []

    if (!chartData.length) return null

    return (
        <div className={`${card} p-5`}>
            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                <FontAwesomeIcon icon={faChartLine} className="text-blue-400 text-xs" />
                Month-over-Month Trends
            </h4>
            {mom && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {['expense', 'income'].map(key => {
                        const m = mom[key]
                        const up = m.diff > 0
                        const color = key === 'expense' ? (up ? 'text-red-500' : 'text-emerald-500') : (up ? 'text-emerald-500' : 'text-red-500')
                        return (
                            <div key={key} className={`rounded-lg px-3 py-2 ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>{key}</p>
                                <p className={`text-sm font-bold ${color}`}>
                                    {m.pct > 0 ? '+' : ''}{m.pct}% vs last month
                                </p>
                                <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {formatCurrency(m.previous)} → {formatCurrency(m.current)}
                                </p>
                            </div>
                        )
                    })}
                </div>
            )}
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#f1f5f9' : '#1f1f1f'} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={40} />
                    <Tooltip
                        contentStyle={{ background: isLight ? '#fff' : '#1a1a1a', border: isLight ? '1px solid #e2e8f0' : '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default TrendsChart
