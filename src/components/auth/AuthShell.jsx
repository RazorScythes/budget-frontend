import React from 'react'
import { Link } from 'react-router-dom'

const AuthShell = ({ icon, title, subtitle, children, footer }) => (
    <div className="font-poppins min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] px-4 py-8">
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
                    {icon}
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                {subtitle && <p className="text-gray-400 text-sm mt-1.5">{subtitle}</p>}
            </div>

            <div className="bg-[#141414] border border-[#252525] rounded-2xl p-7 shadow-2xl shadow-black/40">
                {children}
            </div>

            {footer}
        </div>
    </div>
)

export const AuthLink = ({ to, children }) => (
    <Link to={to} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
        {children}
    </Link>
)

export default AuthShell
