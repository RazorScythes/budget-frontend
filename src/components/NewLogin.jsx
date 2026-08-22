import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, googleLogin, verifyTwoFactorLogin } from "../actions/auth";
import { useGoogleLogin } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { encryptData, decryptData } from './Tools';

const GoogleLoginButton = ({ isLoading, googleLoading, setGoogleLoading, dispatch }) => {
    const handleGoogleLogin = useGoogleLogin({
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

    return (
        <>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#252525]" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-[#141414] px-4 text-xs text-gray-500 uppercase tracking-wider">or continue with</span>
                </div>
            </div>

            <button
                onClick={() => handleGoogleLogin()}
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
    )
}

const NewLogin = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const auth = useSelector((state) => state.auth)
    const user = JSON.parse(localStorage.getItem('profile'))

    const [submitted, setSubmitted] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [save, setSave] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [form, setForm] = useState({
        username: '',
        password: ''
    })

    const [twoFactorCode, setTwoFactorCode] = useState('')

    useEffect(() => {
        document.title = "Login"

        const loadCredentials = async () => {
            if (!localStorage.getItem('credentials')) return
            try {
                const decrypt = await decryptData(localStorage.getItem('credentials'))
                const parse = JSON.parse(decrypt)
                setForm({
                    username: parse?.username ?? '',
                    password: parse?.password ?? ''
                })
                setSave(!!parse?.save)
            } catch {
                localStorage.removeItem('credentials')
            }
        }

        loadCredentials()
    }, [])

    useEffect(() => {
        if (user) {
            navigate('/budget')
        }
    }, [user])

    useEffect(() => {
        if (!auth.data?.result || auth.pending2FA) return

        const persistAndNavigate = async () => {
            if (save && form.username && form.password) {
                try {
                    const encrypt = await encryptData(JSON.stringify({
                        username: form.username,
                        password: form.password,
                        save: true
                    }))
                    localStorage.setItem('credentials', encrypt)
                } catch {
                    localStorage.removeItem('credentials')
                }
            } else {
                localStorage.removeItem('credentials')
            }
            navigate('/budget')
        }

        persistAndNavigate()
    }, [auth.data?.result, auth.pending2FA])

    const handleTwoFactorSubmit = (e) => {
        e.preventDefault()
        if (!auth.pendingToken || !twoFactorCode.trim()) return
        dispatch(verifyTwoFactorLogin({
            pendingToken: auth.pendingToken,
            code: twoFactorCode.trim(),
        }))
    }

    useEffect(() => {
        if (auth.error) {
            setSubmitted(false)
            setGoogleLoading(false)
        }
    }, [auth])

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!submitted) {
            dispatch(login(form))
            setSubmitted(true)
        }
    };

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const hasGoogleAuth = googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && googleClientId !== 'disabled'

    const isLoading = submitted || googleLoading

    return (
        <div className="font-poppins min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[600px] h-[600px] rounded-full bg-sky-600/5 blur-[100px]" />
            </div>

            {!user && (
                <div className="relative z-10 w-full max-w-md mx-4">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
                        <p className="text-gray-400 text-sm mt-1.5">Sign in to your account to continue</p>
                    </div>

                    <div className="bg-[#141414] border border-[#252525] rounded-2xl p-7 shadow-2xl shadow-black/40">
                        {auth.pending2FA ? (
                            <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                                <p className="text-sm text-gray-400">Enter the 6-digit code from your authenticator app.</p>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-white text-center text-lg tracking-[0.4em] outline-none focus:border-blue-500/60"
                                />
                                <button
                                    type="submit"
                                    disabled={twoFactorCode.length !== 6 || auth.isLoading}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
                                >
                                    Verify & Sign In
                                </button>
                            </form>
                        ) : (
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
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    required
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                />
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
                                        autoComplete="current-password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-3 pr-11 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={save}
                                            onChange={(e) => setSave(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] peer-checked:bg-blue-600 peer-checked:border-blue-500 transition-all duration-200" />
                                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-gray-400 peer-checked:bg-white peer-checked:translate-x-4 transition-all duration-200" />
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors select-none">Remember me</span>
                                </label>
                                <Link
                                    to="/forgot_password"
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {auth.error && (
                                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <p className="text-red-400 text-sm font-medium">
                                        {auth.error?.message || 'Unknown username or password'}
                                    </p>
                                    {auth.error?.reason && (
                                        <p className="text-red-400 text-sm font-medium mt-1">Reason: {auth.error.reason}</p>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2"
                            >
                                {submitted ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        Signing in...
                                    </span>
                                ) : 'Sign in'}
                            </button>
                        </form>
                        )}

                        {!auth.pending2FA && hasGoogleAuth && (
                            <GoogleLoginButton
                                isLoading={isLoading}
                                googleLoading={googleLoading}
                                setGoogleLoading={setGoogleLoading}
                                dispatch={dispatch}
                            />
                        )}
                    </div>

                    <p className="text-center mt-6 text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            )}
        </div>
    )
}

export default NewLogin
