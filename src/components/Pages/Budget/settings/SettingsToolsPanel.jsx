import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faKey, faCopy, faTrash, faSpinner, faSyncAlt, faCheck } from '@fortawesome/free-solid-svg-icons'
import { faChrome } from '@fortawesome/free-brands-svg-icons'
import { AnimateIn, SettingsListSkeleton } from '../SharedComponents'
import { useSettings } from './SettingsContext.jsx'
import { CHROME_EXTENSION_DOWNLOAD } from '../constants'
import { getExtensionClient, createExtensionClient, revokeExtensionClient } from '../../../../endpoint'

export default function SettingsToolsPanel() {
    const { isLight, cardP, descCls, titleCls, btnPrimary, btnSecondary, setNotification } = useSettings()
    const [clientStatus, setClientStatus] = useState(null)
    const [loadingClient, setLoadingClient] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [revoking, setRevoking] = useState(false)
    const [revealedKey, setRevealedKey] = useState(null)

    const loadClientStatus = useCallback(async () => {
        setLoadingClient(true)
        try {
            const res = await getExtensionClient()
            setClientStatus(res.data?.result || { active: false })
        } catch {
            setClientStatus({ active: false })
        } finally {
            setLoadingClient(false)
        }
    }, [])

    useEffect(() => { loadClientStatus() }, [loadClientStatus])

    const handleGenerate = async () => {
        setGenerating(true)
        setRevealedKey(null)
        try {
            const res = await createExtensionClient()
            const key = res.data?.result?.clientKey
            setRevealedKey(key || null)
            await loadClientStatus()
            setNotification({ msg: 'Client key generated — copy it now', variant: 'success' })
        } catch (err) {
            setNotification({ msg: err.response?.data?.message || 'Failed to generate client key', variant: 'danger' })
        } finally {
            setGenerating(false)
        }
    }

    const handleRevoke = async () => {
        if (!window.confirm('Revoke your extension client key? The extension will stop working until you generate a new one.')) return
        setRevoking(true)
        try {
            await revokeExtensionClient()
            setRevealedKey(null)
            await loadClientStatus()
            setNotification({ msg: 'Extension client key revoked', variant: 'success' })
        } catch {
            setNotification({ msg: 'Failed to revoke client key', variant: 'danger' })
        } finally {
            setRevoking(false)
        }
    }

    const copyKey = (text, label = 'Copied') => {
        navigator.clipboard.writeText(text)
        setNotification({ msg: label, variant: 'success' })
    }

    return (
        <div className="space-y-4">
            {/* ─── Chrome Extension ─── */}
            <AnimateIn delay={680}><div className={cardP}>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-sky-50' : 'bg-sky-900/20'}`}>
                        <FontAwesomeIcon icon={faChrome} className={`text-sm ${isLight ? 'text-sky-500' : 'text-sky-400'}`} />
                    </div>
                    <div>
                        <h3 className={titleCls}>Chrome Extension</h3>
                        <p className={descCls}>Log daily expenses from your browser toolbar</p>
                    </div>
                </div>

                <p className={`text-sm mb-4 leading-relaxed ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Download the extension, generate a personal client key below, paste it in extension settings, then sign in. Expenses sync to the <strong className={isLight ? 'text-slate-600' : 'text-gray-300'}>Daily</strong> tab.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    <a
                        href={CHROME_EXTENSION_DOWNLOAD}
                        download="budget-extension.zip"
                        className={`${btnPrimary} inline-flex items-center no-underline`}
                    >
                        <FontAwesomeIcon icon={faDownload} className="mr-1.5 text-xs" />
                        Download extension
                    </a>
                    <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => {
                            const url = import.meta.env.VITE_DEVELOPMENT === 'true'
                                ? `${import.meta.env.VITE_APP_PROTOCOL || 'http'}://${import.meta.env.VITE_APP_LOCALHOST || 'localhost'}:${import.meta.env.VITE_APP_SERVER_PORT || '5001'}`
                                : (import.meta.env.VITE_APP_BASE_URL || window.location.origin)
                            copyKey(url.replace(/\/$/, ''), 'API URL copied')
                        }}
                    >
                        Copy API URL
                    </button>
                </div>

                <ol className={`space-y-2 text-sm list-decimal list-inside mb-5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    <li>Download and unzip the extension</li>
                    <li>Generate a client key below and paste it in extension options</li>
                    <li>Load unpacked in <code className={`px-1 py-0.5 rounded ${isLight ? 'bg-slate-100' : 'bg-[#111]'}`}>chrome://extensions</code></li>
                    <li>Sign in with your Budget account</li>
                </ol>

                <div className={`rounded-xl border border-solid p-4 ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#111] border-[#2B2B2B]'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                            <FontAwesomeIcon icon={faKey} className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                        </div>
                        <div>
                            <h4 className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Extension client key</h4>
                            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>Personal key — replaces shared API secrets in the extension</p>
                        </div>
                    </div>

                    {loadingClient ? (
                        <SettingsListSkeleton isLight={isLight} rows={2} />
                    ) : (
                        <>
                            {clientStatus?.active && !revealedKey && (
                                <div className={`flex flex-wrap items-center gap-2 mb-3 text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-900/20 text-emerald-400'}`}>
                                        <FontAwesomeIcon icon={faCheck} className="text-xs" /> Active
                                    </span>
                                    <code className={`px-1.5 py-0.5 rounded ${isLight ? 'bg-white border border-slate-200' : 'bg-[#0e0e0e] border border-[#333]'}`}>
                                        {clientStatus.maskedKey}
                                    </code>
                                    {clientStatus.lastUsedAt && (
                                        <span>Last used {new Date(clientStatus.lastUsedAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                            )}

                            {revealedKey && (
                                <div className={`mb-3 p-3 rounded-lg border border-solid ${isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-900/10 border-amber-800/40'}`}>
                                    <p className={`text-sm font-semibold uppercase tracking-wide mb-2 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                                        Copy now — shown once
                                    </p>
                                    <div className="flex gap-2">
                                        <code className={`flex-1 text-sm break-all px-2 py-1.5 rounded ${isLight ? 'bg-white text-slate-700' : 'bg-[#0e0e0e] text-gray-200'}`}>
                                            {revealedKey}
                                        </code>
                                        <button type="button" className={btnSecondary} onClick={() => copyKey(revealedKey, 'Client key copied')}>
                                            <FontAwesomeIcon icon={faCopy} className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={btnPrimary}
                                    disabled={generating}
                                    onClick={handleGenerate}
                                >
                                    {generating ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5 text-xs" />
                                    ) : (
                                        <FontAwesomeIcon icon={faKey} className="mr-1.5 text-xs" />
                                    )}
                                    {clientStatus?.active ? 'Regenerate key' : 'Generate client key'}
                                </button>
                                {clientStatus?.active && (
                                    <button type="button" className={btnSecondary} disabled={revoking} onClick={handleRevoke}>
                                        {revoking ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1.5 text-xs" /> : <FontAwesomeIcon icon={faTrash} className="mr-1.5 text-xs" />}
                                        Revoke
                                    </button>
                                )}
                                <button type="button" className={btnSecondary} onClick={loadClientStatus}>
                                    <FontAwesomeIcon icon={faSyncAlt} className="mr-1.5 text-xs" /> Refresh
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div></AnimateIn>
        </div>
    )
}
