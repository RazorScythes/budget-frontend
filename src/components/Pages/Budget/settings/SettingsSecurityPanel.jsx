import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faSpinner, faKey, faMobileScreen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, SettingsListSkeleton } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'
import {
    setupTwoFactor, enableTwoFactor, disableTwoFactor,
    getUserSessions, revokeAllSessions,
} from '../../../../endpoint'

export default function SettingsSecurityPanel() {
    const { isLight, cardP, descCls, titleCls, inputCls, btnPrimary, btnSecondary, setNotification } = useSettings()
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState([])
    const [setupData, setSetupData] = useState(null)
    const [enableCode, setEnableCode] = useState('')
    const [disableCode, setDisableCode] = useState('')
    const [disablePassword, setDisablePassword] = useState('')
    const [backupCodes, setBackupCodes] = useState([])
    const [busy, setBusy] = useState('')

    const notify = (msg, variant = 'success') => setNotification({ msg, variant })

    const loadSessions = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getUserSessions()
            setSessions(res.data?.result || [])
        } catch {
            setSessions([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadSessions() }, [loadSessions])

    const handleSetup2FA = async () => {
        setBusy('setup')
        try {
            const res = await setupTwoFactor()
            setSetupData(res.data?.result)
            notify('Scan the secret in your authenticator app, then enter the code below')
        } catch (err) {
            notify(err.response?.data?.message || 'Failed to start 2FA setup', 'danger')
        } finally {
            setBusy('')
        }
    }

    const handleEnable2FA = async () => {
        if (!enableCode.trim()) return
        setBusy('enable')
        try {
            const res = await enableTwoFactor({ code: enableCode.trim() })
            setBackupCodes(res.data?.backupCodes || [])
            setSetupData(null)
            setEnableCode('')
            notify('Two-factor authentication enabled')
        } catch (err) {
            notify(err.response?.data?.message || 'Invalid code', 'danger')
        } finally {
            setBusy('')
        }
    }

    const handleDisable2FA = async () => {
        setBusy('disable')
        try {
            await disableTwoFactor({ code: disableCode.trim(), password: disablePassword })
            setDisableCode('')
            setDisablePassword('')
            notify('Two-factor authentication disabled')
        } catch (err) {
            notify(err.response?.data?.message || 'Failed to disable 2FA', 'danger')
        } finally {
            setBusy('')
        }
    }

    const handleRevokeSessions = async () => {
        if (!window.confirm('Sign out all devices? You will need to log in again on this browser.')) return
        setBusy('revoke')
        try {
            await revokeAllSessions()
            notify('All sessions revoked — redirecting to login')
            setTimeout(() => { window.location.href = '/login' }, 1200)
        } catch {
            notify('Failed to revoke sessions', 'danger')
        } finally {
            setBusy('')
        }
    }

    return (
        <div className="space-y-4">
            <AnimateIn delay={400}>
                <div className={cardP}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-50' : 'bg-violet-900/20'}`}>
                            <FontAwesomeIcon icon={faShieldHalved} className={`text-sm ${isLight ? 'text-violet-500' : 'text-violet-400'}`} />
                        </div>
                        <div>
                            <h3 className={titleCls}>Two-Factor Authentication</h3>
                            <p className={descCls}>Add an extra layer of protection to your account</p>
                        </div>
                    </div>

                    {!setupData ? (
                        <button type="button" onClick={handleSetup2FA} disabled={busy === 'setup'} className={btnPrimary}>
                            {busy === 'setup' ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Set up authenticator app'}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Secret (manual entry):</p>
                            <code className={`block text-sm p-2 rounded-lg break-all ${isLight ? 'bg-slate-100' : 'bg-[#111]'}`}>{setupData.secret}</code>
                            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>URI: {setupData.otpauthUrl}</p>
                            <input
                                type="text"
                                value={enableCode}
                                onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="6-digit code"
                                className={`${inputCls} text-center tracking-widest`}
                            />
                            <button type="button" onClick={handleEnable2FA} disabled={busy === 'enable'} className={btnPrimary}>
                                Enable 2FA
                            </button>
                        </div>
                    )}

                    {backupCodes.length > 0 && (
                        <div className={`mt-4 p-3 rounded-lg ${isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-800/40'}`}>
                            <p className={`text-sm font-semibold mb-2 ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>Save these backup codes (shown once):</p>
                            <div className="grid grid-cols-2 gap-1">
                                {backupCodes.map(c => (
                                    <code key={c} className="text-sm">{c}</code>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`mt-4 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-[#1f1f1f]'}`}>
                        <p className={`text-sm mb-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Disable 2FA (requires code + password if set)</p>
                        <div className="flex flex-wrap gap-2">
                            <input type="text" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="Code" className={`${inputCls} max-w-[120px]`} />
                            <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="Password" className={`${inputCls} max-w-[160px]`} />
                            <button type="button" onClick={handleDisable2FA} disabled={busy === 'disable'} className={btnSecondary}>Disable</button>
                        </div>
                    </div>
                </div>
            </AnimateIn>

            <AnimateIn delay={520}>
                <div className={cardP}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                            <FontAwesomeIcon icon={faMobileScreen} className={`text-sm ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        </div>
                        <div>
                            <h3 className={titleCls}>Active Sessions</h3>
                            <p className={descCls}>Devices recently signed in to your account</p>
                        </div>
                    </div>

                    {loading ? (
                        <SettingsListSkeleton isLight={isLight} rows={4} className="mb-4" />
                    ) : sessions.length === 0 ? (
                        <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No session history yet</p>
                    ) : (
                        <ul className="space-y-2 mb-4">
                            {sessions.slice(0, 8).map(s => (
                                <li key={s.id} className={`text-sm px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-[#111]'}`}>
                                    <p className={isLight ? 'text-slate-700' : 'text-gray-200'}>{s.device}</p>
                                    <p className={isLight ? 'text-slate-400' : 'text-gray-500'}>{s.ip} · {new Date(s.last_active).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button type="button" onClick={handleRevokeSessions} disabled={busy === 'revoke'} className={`${btnSecondary} text-red-500`}>
                        <FontAwesomeIcon icon={faTrash} className="mr-1.5" />
                        Revoke all sessions
                    </button>
                </div>
            </AnimateIn>
        </div>
    )
}
