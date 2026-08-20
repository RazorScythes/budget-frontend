import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faSpinner, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { forgotPassword, clearAuthMessage } from '../actions/auth'
import AuthShell, { AuthLink } from './auth/AuthShell'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { isLoading, message, error } = useSelector((state) => state.auth)
    const user = JSON.parse(localStorage.getItem('profile'))

    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        document.title = 'Forgot Password'
        if (user) navigate('/budget')
        return () => { dispatch(clearAuthMessage()) }
    }, [user])

    useEffect(() => {
        if (error) setSubmitted(false)
    }, [error])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!email.trim()) return
        setSubmitted(true)
        dispatch(forgotPassword({ email: email.trim() }))
    }

    return (
        <AuthShell
            icon={<FontAwesomeIcon icon={faEnvelope} className="text-xl text-white" />}
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a reset link."
            footer={
                <p className="text-center mt-6 text-sm text-gray-500">
                    <AuthLink to="/login">← Back to login</AuthLink>
                </p>
            }
        >
            {message ? (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <FontAwesomeIcon icon={faPaperPlane} className="text-emerald-400 text-xl" />
                    </div>
                    <p className="text-emerald-400 text-sm font-medium">{message}</p>
                    <p className="text-gray-500 text-xs">Check your inbox and spam folder. The link expires in 1 hour.</p>
                    <AuthLink to="/login">Return to login</AuthLink>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Email address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    {error?.message && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm font-medium">{error.message}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || submitted}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                        {(isLoading || submitted) ? (
                            <span className="flex items-center justify-center gap-2">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                Sending...
                            </span>
                        ) : 'Send reset link'}
                    </button>
                </form>
            )}
        </AuthShell>
    )
}

export default ForgotPassword
