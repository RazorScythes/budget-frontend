import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initClientGuard } from './security/clientGuard'
import { initConsoleGuard } from './security/consoleGuard'

initConsoleGuard()
initClientGuard()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
