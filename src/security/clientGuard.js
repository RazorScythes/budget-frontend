const getAllowedHosts = () => {
    const raw = import.meta.env.VITE_ALLOWED_DOMAINS || ''
    return raw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
}

const isProd = import.meta.env.VITE_DEVELOPMENT !== 'true'
const blockDevtools = import.meta.env.VITE_BLOCK_DEVTOOLS === 'true'

export const initClientGuard = () => {
    if (typeof window === 'undefined') return

    const allowedHosts = getAllowedHosts()
    if (isProd && allowedHosts.length > 0) {
        const host = window.location.hostname.toLowerCase()
        const permitted = allowedHosts.some(d => host === d || host.includes(d) || host.endsWith(`${d}`))
        if (!permitted) {
            document.body.innerHTML = '<div style="font-family:sans-serif;padding:2rem;text-align:center">Unauthorized domain.</div>'
            throw new Error('Unauthorized domain')
        }
    }

    if (isProd && blockDevtools) {
        document.addEventListener('contextmenu', (e) => e.preventDefault())

        document.addEventListener('keydown', (e) => {
            const key = e.key?.toLowerCase()
            if (key === 'f12') e.preventDefault()
            if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) e.preventDefault()
            if (e.ctrlKey && key === 'u') e.preventDefault()
        })

        const watermark = document.createElement('div')
        watermark.setAttribute('aria-hidden', 'true')
        watermark.textContent = `© ${new Date().getFullYear()} Budget Manager · Licensed Software`
        watermark.style.cssText = 'position:fixed;bottom:6px;right:10px;font:10px/1.2 sans-serif;opacity:0.35;pointer-events:none;z-index:9998;user-select:none;'
        document.body.appendChild(watermark)
    }
}
