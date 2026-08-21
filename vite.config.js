import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'rollup-plugin-obfuscator'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  const disableConsole = env.VITE_DISABLE_CONSOLE === 'true'
  const disableDebugger = env.VITE_DISABLE_DEBUGGER === 'true'

  return {
    plugins: [
      react(),
      isProd && obfuscator({
        include: [/src\/.*\.[jt]sx?$/],
        exclude: [/node_modules/, /src\/security\//],
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.4,
          deadCodeInjection: false,
          debugProtection: disableDebugger,
          debugProtectionInterval: disableDebugger ? 3000 : 0,
          disableConsoleOutput: disableConsole,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          selfDefending: isProd,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.6,
        },
      }),
    ].filter(Boolean),
    server: {
      port: 5174,
    },
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: disableConsole,
          drop_debugger: disableDebugger,
        },
        mangle: {
          toplevel: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
            'vendor-fontawesome': ['@fortawesome/react-fontawesome', '@fortawesome/fontawesome-svg-core', '@fortawesome/free-solid-svg-icons'],
            'vendor-pdf': ['html2canvas-pro', 'jspdf'],
            'vendor-socket': ['socket.io-client'],
          },
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  }
})
