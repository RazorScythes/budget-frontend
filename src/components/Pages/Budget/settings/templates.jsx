import React from 'react'

export const BUDGET_TEMPLATES = [
    {
        id: 'default',
        name: 'Default',
        description: 'Balanced layout with standard width, pill tabs, and blue accents',
        layout: { density: 'Balanced', width: 'Wide', tabs: 'Pill', spacing: 'Standard' },
        style: { accent: 'Blue', surface: 'Bordered cards' },
        preview: { accent: 'blue', tabLayout: 'pill' },
    },
    {
        id: 'compact',
        name: 'Compact',
        description: 'Dense spacing, 2-column stats on mobile, segmented tabs — more data on screen',
        layout: { density: 'Dense', width: 'Wide', tabs: 'Segmented', spacing: 'Tight' },
        style: { accent: 'Slate', surface: 'Flat borders' },
        preview: { accent: 'slate', tabLayout: 'segment' },
    },
    {
        id: 'vibrant',
        name: 'Vibrant',
        description: 'Spacious padding, narrower content, large pill tabs, bold gradients',
        layout: { density: 'Spacious', width: 'Focused', tabs: 'Large pills', spacing: 'Generous' },
        style: { accent: 'Violet', surface: 'Shadow cards' },
        preview: { accent: 'violet', tabLayout: 'pill-lg' },
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Narrow layout, underline tabs (text only), relaxed whitespace',
        layout: { density: 'Relaxed', width: 'Narrow', tabs: 'Underline', spacing: 'Airy' },
        style: { accent: 'Emerald', surface: 'Shadow only' },
        preview: { accent: 'emerald', tabLayout: 'underline' },
    },
    {
        id: 'glass',
        name: 'Glassmorphism',
        description: 'Wide layout with frosted segment tabs and translucent cards',
        layout: { density: 'Balanced', width: 'Wide', tabs: 'Frosted segment', spacing: 'Standard' },
        style: { accent: 'Cyan', surface: 'Glass blur' },
        preview: { accent: 'cyan', tabLayout: 'segment-glass' },
    },
]

export const TEMPLATE_ACCENT_COLORS = {
    blue: { bg: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', muted: '#93c5fd' },
    slate: { bg: '#475569', light: '#f8fafc', border: '#cbd5e1', muted: '#94a3b8' },
    violet: { bg: '#8b5cf6', light: '#f5f3ff', border: '#c4b5fd', muted: '#a78bfa' },
    emerald: { bg: '#10b981', light: '#ecfdf5', border: '#a7f3d0', muted: '#6ee7b7' },
    cyan: { bg: '#06b6d4', light: '#ecfeff', border: '#a5f3fc', muted: '#67e8f9' },
}

export function TemplateLayoutPreview({ template, isLight }) {
    const accent = TEMPLATE_ACCENT_COLORS[template.preview.accent] || TEMPLATE_ACCENT_COLORS.blue
    const shellBg = isLight ? '#f1f5f9' : '#111'
    const cardBg = isLight ? '#ffffff' : '#0e0e0e'
    const tabLayout = template.preview.tabLayout

    const renderTabs = () => {
        if (tabLayout === 'segment' || tabLayout === 'segment-glass') {
            const segBg = tabLayout === 'segment-glass'
                ? (isLight ? 'rgba(255,255,255,0.5)' : 'rgba(17,17,17,0.6)')
                : (isLight ? '#e2e8f0' : '#0a0a0a')
            return (
                <div className="flex gap-0.5 p-0.5 rounded-md" style={{ backgroundColor: segBg, border: tabLayout === 'segment-glass' ? `1px solid ${isLight ? '#e2e8f0' : '#333'}` : 'none' }}>
                    <div className="flex-1 h-3 rounded-sm" style={{ backgroundColor: accent.bg }} />
                    <div className="flex-1 h-3 rounded-sm opacity-40" style={{ backgroundColor: isLight ? '#cbd5e1' : '#333' }} />
                    <div className="flex-1 h-3 rounded-sm opacity-40" style={{ backgroundColor: isLight ? '#cbd5e1' : '#333' }} />
                </div>
            )
        }
        if (tabLayout === 'underline') {
            return (
                <div className="flex gap-3 border-b" style={{ borderColor: isLight ? '#e2e8f0' : '#222' }}>
                    <div className="h-3 w-8 border-b-2" style={{ borderColor: accent.bg, marginBottom: -1 }} />
                    <div className="h-3 w-6 opacity-30 rounded-sm" style={{ backgroundColor: isLight ? '#cbd5e1' : '#333' }} />
                    <div className="h-3 w-7 opacity-30 rounded-sm" style={{ backgroundColor: isLight ? '#cbd5e1' : '#333' }} />
                </div>
            )
        }
        const pillH = tabLayout === 'pill-lg' ? 'h-3.5' : 'h-3'
        const pillRadius = tabLayout === 'pill-lg' ? 'rounded-lg' : 'rounded-md'
        return (
            <div className="flex gap-1">
                <div className={`${pillH} w-10 ${pillRadius}`} style={{ backgroundColor: accent.bg }} />
                <div className={`${pillH} w-8 ${pillRadius} opacity-30`} style={{ backgroundColor: isLight ? '#cbd5e1' : '#333' }} />
                <div className={`${pillH} w-9 ${pillRadius} opacity-30`} style={{ backgroundColor: isLight ? '#cbd5e1' : '#333' }} />
            </div>
        )
    }

    const isCompact = template.id === 'compact'
    const isVibrant = template.id === 'vibrant'
    const isMinimal = template.id === 'minimal'
    const cardCount = isCompact ? 4 : isVibrant ? 2 : 3
    const cardH = isCompact ? 'h-7' : isVibrant ? 'h-12' : 'h-9'
    const gridCols = isCompact ? 'grid-cols-2' : isVibrant ? 'grid-cols-1' : 'grid-cols-3'

    return (
        <div className="rounded-lg border border-solid overflow-hidden p-2" style={{ backgroundColor: shellBg, borderColor: isLight ? '#e2e8f0' : '#1f1f1f' }}>
            <div className="mb-2">{renderTabs()}</div>
            <div className={`grid ${gridCols} gap-1`}>
                {[...Array(cardCount)].map((_, i) => (
                    <div
                        key={i}
                        className={`${cardH} rounded-md border border-solid`}
                        style={{
                            backgroundColor: cardBg,
                            borderColor: isMinimal ? 'transparent' : (isLight ? accent.border : '#2B2B2B'),
                            boxShadow: isMinimal ? (isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none') : undefined,
                            opacity: tabLayout === 'segment-glass' ? 0.85 : 1,
                        }}
                    >
                        <div className="p-1">
                            <div className="h-1 w-4 rounded-full mb-0.5" style={{ backgroundColor: accent.muted, opacity: 0.5 }} />
                            <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: accent.bg, opacity: 0.7 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
