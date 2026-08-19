const encoder = new TextEncoder()

const sha256Hex = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(text))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const hmacSha256Hex = async (secret, message) => {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const attachApiShield = (axiosInstance) => {
    const apiKey = import.meta.env.VITE_APP_API_KEY
    const signatureSecret = import.meta.env.VITE_APP_SIGNATURE_SECRET
    const appId = import.meta.env.VITE_APP_ID || 'budget-standalone'
    const strict = import.meta.env.VITE_ENABLE_STRICT_SECURITY === 'true'
        || import.meta.env.VITE_DEVELOPMENT !== 'true'

    axiosInstance.interceptors.request.use(async (config) => {
        config.headers['X-App-Id'] = appId

        if (apiKey) {
            config.headers['X-App-Key'] = apiKey
        }

        if (strict && signatureSecret && !['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
            const timestamp = String(Date.now())
            const path = new URL(config.url, config.baseURL).pathname
            const bodyRaw = config.data
                ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data))
                : ''
            const bodyHash = await sha256Hex(bodyRaw)
            const payload = `${timestamp}.${(config.method || 'GET').toUpperCase()}.${path}.${bodyHash}`
            const sign = await hmacSha256Hex(signatureSecret, payload)

            config.headers['X-Request-Time'] = timestamp
            config.headers['X-Request-Sign'] = sign
        }

        return config
    })

    return axiosInstance
}
