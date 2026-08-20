import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { verifyEmail } from '../../actions/auth'
import AuthShell from './AuthShell'

const STATUS_ROUTES = {
    activated: '/verify-email/success',
    verified: '/verify-email/verified',
    expired: '/verify-email/expired',
    notFound: '/verify-email/failed',
    error: '/verify-email/failed',
}

const VerifyEmail = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { verificationStatus, isLoading } = useSelector((state) => state.auth)

    useEffect(() => {
        document.title = 'Verify Email'
        const token = searchParams.get('token')
        if (!token) {
            navigate('/verify-email/failed', { replace: true })
            return
        }
        dispatch(verifyEmail({ token }))
    }, [])

    useEffect(() => {
        if (!verificationStatus) return
        const route = STATUS_ROUTES[verificationStatus] || '/verify-email/failed'
        navigate(route, { replace: true })
    }, [verificationStatus])

    return (
        <AuthShell
            icon={<FontAwesomeIcon icon={faSpinner} className="text-xl text-white animate-spin" />}
            title="Verifying your email"
            subtitle="Please wait while we confirm your account."
        >
            <div className="flex justify-center py-2">
                <div className="w-full h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 ${isLoading ? 'w-2/3 animate-pulse' : 'w-full'}`} />
                </div>
            </div>
        </AuthShell>
    )
}

export default VerifyEmail
