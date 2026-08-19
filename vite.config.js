import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'rollup-plugin-obfuscator'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'production' && obfuscator({
      include: [/src\/.*\.[jt]sx?$/],
      exclude: [/node_modules/],
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.4,
        deadCodeInjection: false,
        debugProtection: true,
        debugProtectionInterval: 3000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        selfDefending: true,
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
        drop_console: true,
        // drop_debugger: true,
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
}))
