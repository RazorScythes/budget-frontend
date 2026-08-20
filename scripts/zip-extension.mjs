import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const extDir = join(root, 'extension')
const publicDir = join(root, 'public')
const outZip = join(publicDir, 'budget-extension.zip')
const envPath = join(root, '.env')

function loadEnvFile(path) {
    if (!existsSync(path)) return {}
    const env = {}
    for (const line of readFileSync(path, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        let val = trimmed.slice(eq + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
        }
        env[key] = val
    }
    return env
}

function resolveApiBaseUrl(env) {
    if (env.VITE_DEVELOPMENT === 'true') {
        const protocol = env.VITE_APP_PROTOCOL || 'http'
        const host = env.VITE_APP_LOCALHOST || 'localhost'
        const port = env.VITE_APP_SERVER_PORT || '5001'
        return `${protocol}://${host}:${port}`
    }
    return env.VITE_APP_BASE_URL || 'http://localhost:5001'
}

if (!existsSync(extDir)) {
    console.error('extension/ folder not found')
    process.exit(1)
}

const env = loadEnvFile(envPath)
const defaults = {
    apiBaseUrl: resolveApiBaseUrl(env).replace(/\/$/, ''),
    appId: 'budget-extension',
}

writeFileSync(join(extDir, 'config.defaults.json'), JSON.stringify(defaults, null, 2))
console.log('Wrote extension/config.defaults.json')

mkdirSync(publicDir, { recursive: true })
if (existsSync(outZip)) {
    try { execSync(`del /F /Q "${outZip}"`, { stdio: 'ignore', shell: true }) } catch { /* ok */ }
}

if (process.platform === 'win32') {
    execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${extDir.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
        { stdio: 'inherit' }
    )
} else {
    execSync(`cd "${extDir}" && zip -r "${outZip}" . -x "*.md"`, { stdio: 'inherit' })
}

console.log('Created public/budget-extension.zip')
