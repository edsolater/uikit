import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/index.ts', 'src/components/index.ts', 'src/hooks/index.ts'],
  sourcemap: true,
  clean: true,
  dts: true,
  format: 'esm',
  target: 'es2020',
  splitting: true,
  inject: ['./src/react-import.js']
})
