export const normalizeDesc = (value) =>
    String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

export const sameCalendarDay = (a, b) => {
    const da = new Date(a)
    const db = new Date(b)
    return da.getFullYear() === db.getFullYear()
        && da.getMonth() === db.getMonth()
        && da.getDate() === db.getDate()
}

export const isSimilarDescription = (a, b) => {
    const na = normalizeDesc(a)
    const nb = normalizeDesc(b)
    if (!na || !nb) return false
    if (na === nb) return true
    if (na.includes(nb) || nb.includes(na)) return true
    const wa = new Set(na.split(' ').filter(w => w.length > 2))
    const wb = nb.split(' ').filter(w => w.length > 2)
    if (!wa.size || !wb.length) return false
    const overlap = wb.filter(w => wa.has(w)).length
    return overlap >= Math.min(2, wb.length)
}

export const findDuplicateCandidates = (existing, candidate) => {
    const amount = Number(candidate.amount)
    if (!existing?.length || Number.isNaN(amount)) return []
    return existing.filter(e => {
        if (e._id && candidate.excludeId && String(e._id) === String(candidate.excludeId)) return false
        if (Math.abs(Number(e.amount) - amount) > 0.009) return false
        if (candidate.date && e.date && !sameCalendarDay(e.date, candidate.date)) return false
        return isSimilarDescription(e.description, candidate.description)
    })
}

export const applyCategoryRules = (description, rules = []) => {
    const desc = normalizeDesc(description)
    if (!desc || !rules.length) return null
    const match = rules.find(r => desc.includes(normalizeDesc(r.pattern)))
    return match?.category || null
}
