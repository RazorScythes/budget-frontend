import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faClock, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import AuthShell from './AuthShell'

const CONFIG = {
    success: {
        icon: faCircleCheck,
        gradient: 'from-emerald-500 to-teal-600',
        title: 'Email verified!',
        message: 'Your account has been successfully verified. You can now sign in.',
        linkText: 'Go to Login',
        linkHref: '/login',
    },
    verified: {
        icon: faShieldHalved,
        gradient: 'from-blue-500 to-indigo-600',
        title: 'Already verified',
        message: 'This account is already verified. No further action is needed.',
        linkText: 'Go to Login',
        linkHref: '/login',
    },
    failed: {
        icon: faCircleXmark,
        gradient: 'from-red-500 to-rose-600',
        title: 'Verification failed',
        message: 'This verification link is invalid or has already been used.',
        linkText: 'Back to Login',
        linkHref: '/login',
    },
    expired: {
        icon: faClock,
        gradient: 'from-amber-500 to-orange-600',
        title: 'Link expired',
        message: 'This verification link has expired. Sign in and request a new verification email from settings.',
        linkText: 'Go to Login',
        linkHref: '/login',
    },
}

const VerifyEmailResult = ({ status = 'failed' }) => {
    const current = CONFIG[status] || CONFIG.failed

    return (
        <AuthShell
            icon={<FontAwesomeIcon icon={current.icon} className="text-2xl text-white" />}
            title={current.title}
            subtitle={current.message}
        >
            <div className="text-center">
                <Link
                    to={current.linkHref}
                    className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all duration-200"
                >
                    {current.linkText}
                </Link>
            </div>
        </AuthShell>
    )
}

export default VerifyEmailResult
