const disableConsole = import.meta.env.VITE_DISABLE_CONSOLE === 'true'

export const initConsoleGuard = () => {
    if (typeof window === 'undefined') return
    if (!disableConsole) return

    const noop = () => {}
    ;['log', 'debug', 'info', 'warn', 'error', 'trace', 'table', 'group', 'groupCollapsed', 'groupEnd'].forEach((method) => {
        if (typeof console[method] === 'function') {
            console[method] = noop
        }
    })
}
