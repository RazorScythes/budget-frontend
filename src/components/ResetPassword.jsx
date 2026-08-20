import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faEye, faEyeSlash, faSpinner, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { resetPassword, clearAuthMessage } from '../actions/auth'
import AuthShell, { AuthLink } from './auth/AuthShell'

const ResetPassword = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { isLoading, message, error } = useSelector((state) => state.auth)

    const token = searchParams.get('token') || ''
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [localError, setLocalError] = useState('')
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        document.title = 'Reset Password'
        if (!token) {
            setLocalError('Invalid or missing reset link.')
        }
        return () => { dispatch(clearAuthMessage()) }
    }, [token])

    useEffect(() => {
        if (error) setSubmitted(false)
    }, [error])

    useEffect(() => {
        if (message?.includes('successfully')) {
            setTimeout(() => navigate('/login'), 2500)
        }
    }, [message])

    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    }

    const PasswordCheck = ({ passed, label }) => (
        <div className={`flex items-center gap-2 text-xs ${passed ? 'text-emerald-400' : 'text-gray-500'}`}>
            <FontAwesomeIcon icon={passed ? faCheck : faXmark} className="text-[10px]" />
            {label}
        </div>
    )

    const handleSubmit = (e) => {
        e.preventDefault()
        setLocalError('')

        if (!token) {
            setLocalError('Invalid or missing reset link.')
            return
        }
        if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number) {
            setLocalError('Password does not meet requirements.')
            return
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.')
            return
        }

        setSubmitted(true)
        dispatch(resetPassword({ token, password }))
    }

    const displayError = localError || error?.message

    return (
        <AuthShell
            icon={<FontAwesomeIcon icon={faKey} className="text-xl text-white" />}
            title="Set a new password"
            subtitle="Choose a strong password for your account."
            footer={
                <p className="text-center mt-6 text-sm text-gray-500">
                    Remember your password? <AuthLink to="/login">Sign in</AuthLink>
                </p>
            }
        >
            {message && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-sm font-medium">{message}</p>
                    <p className="text-emerald-400/70 text-xs mt-1">Redirecting to login...</p>
                </div>
            )}

            {!message && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter new password"
                                className="w-full px-4 py-3 pr-11 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                            </button>
                        </div>
                        {password && (
                            <div className="mt-2.5 flex flex-col gap-1">
                                <PasswordCheck passed={checks.length} label="At least 8 characters" />
                                <PasswordCheck passed={checks.uppercase} label="One uppercase letter" />
                                <PasswordCheck passed={checks.lowercase} label="One lowercase letter" />
                                <PasswordCheck passed={checks.number} label="One number" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm new password"
                                className="w-full px-4 py-3 pr-11 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="text-sm" />
                            </button>
                        </div>
                    </div>

                    {displayError && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm font-medium">{displayError}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || submitted || !token}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                        {(isLoading || submitted) ? (
                            <span className="flex items-center justify-center gap-2">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                Updating...
                            </span>
                        ) : 'Update password'}
                    </button>
                </form>
            )}
        </AuthShell>
    )
}

export default ResetPassword
