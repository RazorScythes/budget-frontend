export const LS_APPEARANCE_PREFIX = 'budget_appearance_settings'

export const APPEARANCE_SETTING_KEYS = [
    'template',
    'pageLayout',
    'hiddenTabs',
    'numberFormat',
    'dateFormat',
    'decimalPlaces',
    'startOfWeek',
]

/** Keys that swap many CSS classes at once — lock transitions to avoid twitch (excludes pageLayout). */
export const APPEARANCE_TRANSITION_LOCK_KEYS = APPEARANCE_SETTING_KEYS.filter((key) => key !== 'pageLayout')

export const PAGE_LAYOUT_TRANSITION_MS = 300

const getUserId = () => {
    try {
        const profile = JSON.parse(localStorage.getItem('profile'))
        return profile?._id || profile?.id || null
    } catch {
        return null
    }
}

export const getAppearanceCacheKey = () => {
    const userId = getUserId()
    return userId ? `${LS_APPEARANCE_PREFIX}_${userId}` : LS_APPEARANCE_PREFIX
}

export const pickAppearanceSettings = (settings) => {
    if (!settings || typeof settings !== 'object') return null
    const picked = {}
    APPEARANCE_SETTING_KEYS.forEach((key) => {
        if (settings[key] !== undefined) picked[key] = settings[key]
    })
    return Object.keys(picked).length ? picked : null
}

export const loadCachedAppearanceSettings = () => {
    try {
        const raw = localStorage.getItem(getAppearanceCacheKey())
        if (!raw) return null
        return pickAppearanceSettings(JSON.parse(raw))
    } catch {
        return null
    }
}

export const saveCachedAppearanceSettings = (settings) => {
    const picked = pickAppearanceSettings(settings)
    if (!picked) return
    try {
        localStorage.setItem(getAppearanceCacheKey(), JSON.stringify(picked))
    } catch { /* ignore */ }
}

export const mergeAppearanceSettings = (current, incoming) => {
    if (!incoming) return current || null
    if (!current) return incoming
    return { ...current, ...incoming }
}

let appearanceSwitchTimer = null

/** Suppress CSS transitions briefly while template/layout classes swap (avoids visual twitch). */
export const lockAppearanceTransitions = () => {
    const root = document.documentElement
    root.dataset.appearanceSwitch = '1'
    if (appearanceSwitchTimer) clearTimeout(appearanceSwitchTimer)
    appearanceSwitchTimer = setTimeout(() => {
        delete root.dataset.appearanceSwitch
        appearanceSwitchTimer = null
    }, 200)
}

export const budgetSettingsEqual = (a, b) => {
    if (a === b) return true
    if (!a || !b) return false
    try {
        return JSON.stringify(a) === JSON.stringify(b)
    } catch {
        return false
    }
}
