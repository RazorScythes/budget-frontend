import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Provider, useSelector } from 'react-redux'
import { store } from './app/store'
import { dark, light } from './style'
import NewLogin from './components/NewLogin'
import CreateAccount from './components/CreateAccount'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import VerifyEmail from './components/auth/VerifyEmail'
import VerifyEmailResult from './components/auth/VerifyEmailResult'
import Budget from './components/Pages/Budget'
import Navbar from './components/Custom/Navbar'
import './index.css'

const RootRedirect = ({ user }) => {
    return <Navigate to={user ? '/budget' : '/login'} replace />
}

const ProtectedLayout = ({ user, theme, setTheme, setUser }) => {
    if (!user) {
        return <Navigate to="/login" replace />
    }

    return (
        <>
            <Navbar theme={theme} setTheme={setTheme} setUser={setUser} />
            <main className="min-h-[calc(100dvh-4rem)] w-full">
                <Outlet />
            </main>
        </>
    )
}

const AppRoutes = () => {
    const auth = useSelector((state) => state.auth)
    const userData = JSON.parse(localStorage.getItem('profile'))
    const [user, setUser] = useState(userData ? userData : null)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

    useEffect(() => {
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark')
    }, [theme])

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('profile'))
        setUser(profile || null)
    }, [auth.data])

    return (
        <div data-theme={theme === 'light' ? 'light' : 'dark'} className={`min-h-[100dvh] w-full ${theme === 'light' ? light.background : dark.background} ${theme === 'light' ? light.color : dark.color} text-sm`}>
            <Routes>
                <Route path="/login" element={<NewLogin />} />
                <Route path="/register" element={<CreateAccount setUser={setUser} />} />
                <Route path="/forgot_password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify-email/success" element={<VerifyEmailResult status="success" />} />
                <Route path="/verify-email/verified" element={<VerifyEmailResult status="verified" />} />
                <Route path="/verify-email/failed" element={<VerifyEmailResult status="failed" />} />
                <Route path="/verify-email/expired" element={<VerifyEmailResult status="expired" />} />
                <Route element={<ProtectedLayout user={user} theme={theme} setTheme={setTheme} setUser={setUser} />}>
                    <Route path="/budget" element={<Budget user={user} theme={theme} />} />
                </Route>
                <Route path="/" element={<RootRedirect user={user} />} />
                <Route path="*" element={<RootRedirect user={user} />} />
            </Routes>
        </div>
    )
}

const App = () => {
    return (
        <Provider store={store}>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'disabled'}>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </GoogleOAuthProvider>
        </Provider>
    )
}

export default App
