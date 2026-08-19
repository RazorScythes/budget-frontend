import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initClientGuard } from './security/clientGuard'
import { initConsoleGuard } from './security/consoleGuard'

initConsoleGuard()
initClientGuard()

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
