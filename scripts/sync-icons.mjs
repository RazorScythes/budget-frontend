import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import decodeIco from 'decode-ico'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const favicon = join(root, 'public', 'favicon.ico')
const extIconsDir = join(root, 'extension', 'icons')
const publicDir = join(root, 'public')

if (!existsSync(favicon)) {
    console.warn('public/favicon.ico not found — skipping icon sync')
    process.exit(0)
}

mkdirSync(extIconsDir, { recursive: true })

const images = decodeIco(readFileSync(favicon))
const best = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height))[0]

if (!best?.data) {
    console.error('Could not decode public/favicon.ico')
    process.exit(1)
}

const sizes = [
    { size: 16, dir: extIconsDir, name: 'icon16.png' },
    { size: 32, dir: extIconsDir, name: 'icon32.png' },
    { size: 48, dir: extIconsDir, name: 'icon48.png' },
    { size: 128, dir: extIconsDir, name: 'icon128.png' },
    { size: 192, dir: publicDir, name: 'icon-192.png' },
    { size: 512, dir: publicDir, name: 'icon-512.png' },
]

for (const { size, dir, name } of sizes) {
    const out = join(dir, name)
    const png = await sharp(best.data)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    writeFileSync(out, png)
    console.log(`Wrote ${out}`)
}

console.log('Synced extension icons and PWA icons from public/favicon.ico')
