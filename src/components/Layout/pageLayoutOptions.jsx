import React from 'react'

export const PAGE_LAYOUT_OPTIONS = [
    {
        id: 'classic',
        name: 'Classic',
        description: 'Top navbar with horizontal tabs in the main content area.',
    },
    {
        id: 'sidebar',
        name: 'Sidebar',
        description: 'Top navbar with a left sidebar for section navigation.',
    },
]

export const PageLayoutPreview = ({ layoutId, isLight }) => {
    const border = isLight ? 'border-slate-300' : 'border-[#444]'
    const fill = isLight ? 'bg-slate-200' : 'bg-[#333]'
    const fillSoft = isLight ? 'bg-slate-100' : 'bg-[#222]'
    const accent = isLight ? 'bg-blue-400' : 'bg-blue-500'

    if (layoutId === 'sidebar') {
        return (
            <div className={`rounded-lg border border-solid ${border} p-2 h-[72px] flex flex-col gap-1.5`}>
                <div className={`h-2.5 rounded-sm ${accent} opacity-80`} />
                <div className="flex flex-1 gap-1.5 min-h-0">
                    <div className={`w-[22%] rounded-sm ${fill}`} />
                    <div className={`flex-1 rounded-sm ${fillSoft}`} />
                </div>
            </div>
        )
    }

    return (
        <div className={`rounded-lg border border-solid ${border} p-2 h-[72px] flex flex-col gap-1.5`}>
            <div className={`h-2.5 rounded-sm ${accent} opacity-80`} />
            <div className={`flex-1 rounded-sm ${fillSoft} flex flex-col gap-1 p-1.5 min-h-0`}>
                <div className="flex gap-0.5">
                    <div className={`h-1.5 w-6 rounded-sm ${accent}`} />
                    <div className={`h-1.5 w-5 rounded-sm ${fill}`} />
                    <div className={`h-1.5 w-5 rounded-sm ${fill}`} />
                </div>
                <div className={`flex-1 rounded-sm ${fill} opacity-60`} />
            </div>
        </div>
    )
}
