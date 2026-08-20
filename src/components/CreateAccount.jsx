import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register, googleLogin } from "../actions/auth";
import { useGoogleLogin } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

const CreateAccount = ({ path, setUser }) => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const auth = useSelector((state) => state.auth)
    const user = JSON.parse(localStorage.getItem('profile'))

    const [submitted, setSubmitted] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        document.title = "Create Account"
        if (!user) return

        if (setUser) setUser(user)
        navigate('/budget')
    }, [user])

    useEffect(() => {
        if (auth.error) {
            setSubmitted(false)
            setGoogleLoading(false)
        }
    }, [auth])

    const passwordChecks = {
        length: form.password.length >= 8,
        uppercase: /[A-Z]/.test(form.password),
        lowercase: /[a-z]/.test(form.password),
        number: /[0-9]/.test(form.password),
        special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;/'`~]/.test(form.password),
    }

    const validate = () => {
        const newErrors = {}

        if (!form.username.trim()) newErrors.username = 'Username is required'
        else if (form.username.length < 3) newErrors.username = 'At least 3 characters'
        else if (form.username.length > 24) newErrors.username = 'Maximum 24 characters'
        else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) newErrors.username = 'Letters, numbers, underscores only'
        else if (/^[0-9_]+$/.test(form.username)) newErrors.username = 'Must include at least one letter'

        if (!form.email.trim()) newErrors.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format'
        else if (form.email.length > 254) newErrors.email = 'Email is too long'

        if (!form.password) newErrors.password = 'Password is required'
        else if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number || !passwordChecks.special) {
            newErrors.password = 'Password does not meet requirements'
        }

        if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
        else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!submitted && validate()) {
            dispatch(register({
                username: form.username,
                email: form.email,
                password: form.password,
            }))
            setSubmitted(true)
        }
    }

    const handleGoogleRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true)
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();

                dispatch(googleLogin({
                    credential: tokenResponse.access_token,
                    email: userInfo.email,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    picture: userInfo.picture,
                    googleId: userInfo.sub,
                }))
            } catch {
                setGoogleLoading(false)
            }
        },
        onError: () => {
            setGoogleLoading(false)
        },
    });

    const isLoading = submitted || googleLoading
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const hasGoogleAuth = googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && googleClientId !== 'disabled'

    const PasswordCheck = ({ passed, label }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors ${passed ? 'text-emerald-400' : 'text-gray-500'}`}>
            <FontAwesomeIcon icon={passed ? faCheck : faXmark} className={`text-[10px] ${passed ? 'text-emerald-400' : 'text-gray-600'}`} />
            {label}
        </div>
    )

    return (
        <div className="font-poppins min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[100px]" />
            </div>

            {!user && (
                <div className="relative z-10 w-full max-w-md mx-4 my-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 shadow-lg shadow-indigo-500/25">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
                        <p className="text-gray-400 text-sm mt-1.5">Get started in just a few seconds</p>
                    </div>

                    <div className="bg-[#141414] border border-[#252525] rounded-2xl p-7 shadow-2xl shadow-black/40">
                        {auth.error && (
                            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-400 text-sm font-medium">
                                    {auth.error?.message || 'Registration failed. Please try again.'}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    autoComplete="username"
                                    value={form.username}
                                    onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors({ ...errors, username: '' }) }}
                                    placeholder="Choose a username"
                                    className={`w-full px-4 py-3 rounded-xl bg-[#1c1c1c] border text-white text-sm placeholder-gray-500 outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.username
                                            ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
                                            : 'border-[#2a2a2a] focus:border-blue-500/60 focus:ring-blue-500/20'
                                    }`}
                                />
                                {errors.username && <p className="mt-1.5 text-xs text-red-400">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
                                    placeholder="you@example.com"
                                    className={`w-full px-4 py-3 rounded-xl bg-[#1c1c1c] border text-white text-sm placeholder-gray-500 outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.email
                                            ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
                                            : 'border-[#2a2a2a] focus:border-blue-500/60 focus:ring-blue-500/20'
                                    }`}
                                />
                                {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={form.password}
                                        onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }) }}
                                        placeholder="Create a password"
                                        className={`w-full px-4 py-3 pr-11 rounded-xl bg-[#1c1c1c] border text-white text-sm placeholder-gray-500 outline-none focus:ring-2 transition-all duration-200 ${
                                            errors.password
                                                ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
                                                : 'border-[#2a2a2a] focus:border-blue-500/60 focus:ring-blue-500/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                                    </button>
                                </div>
                                {form.password && (
                                    <div className="mt-2.5 flex flex-col gap-1">
                                        <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                                        <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                                        <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                                        <PasswordCheck passed={passwordChecks.number} label="One number" />
                                        <PasswordCheck passed={passwordChecks.special} label="One special character" />
                                    </div>
                                )}
                                {errors.password && !form.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={form.confirmPassword}
                                        onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }) }}
                                        placeholder="Confirm your password"
                                        className={`w-full px-4 py-3 pr-11 rounded-xl bg-[#1c1c1c] border text-white text-sm placeholder-gray-500 outline-none focus:ring-2 transition-all duration-200 ${
                                            errors.confirmPassword
                                                ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
                                                : form.confirmPassword && form.password === form.confirmPassword
                                                    ? 'border-emerald-500/50 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                                                    : 'border-[#2a2a2a] focus:border-blue-500/60 focus:ring-blue-500/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="text-sm" />
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
                                {!errors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword && (
                                    <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                                        Passwords match
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2"
                            >
                                {submitted ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        Creating account...
                                    </span>
                                ) : 'Create account'}
                            </button>
                        </form>

                        {hasGoogleAuth && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[#252525]" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#141414] px-4 text-xs text-gray-500 uppercase tracking-wider">or sign up with</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleGoogleRegister()}
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#222222] text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                                >
                                    {googleLoading ? (
                                        <span className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            Connecting...
                                        </span>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                                                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-center mt-6 text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            )}
        </div>
    )
}

export default CreateAccount
