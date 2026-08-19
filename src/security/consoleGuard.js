const isEnabled = (key) => import.meta.env[key] === 'true'

export const initConsoleGuard = () => {
    if (typeof window === 'undefined') return
    if (!isEnabled('VITE_DISABLE_CONSOLE')) return

    const noop = () => {}
    ;['log', 'debug', 'info', 'warn', 'error', 'trace', 'table', 'group', 'groupCollapsed', 'groupEnd'].forEach((method) => {
        if (typeof console[method] === 'function') {
            console[method] = noop
        }
    })
}
