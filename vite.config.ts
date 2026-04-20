import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
  plugins: [react(), libInjectCss()],
  build: {
    target: 'esnext',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    reportCompressedSize: false,
    cssCodeSplit: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
