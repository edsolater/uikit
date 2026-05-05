import { defineConfig } from 'vite'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import solid from 'vite-plugin-solid'

// 排除打包的第三方库
const externalDependencies = ['solid-js', '@edsolater/fnkit']

// 路径判定为引用第三方包
function isDependency(targetPackageName: string, importPath: string): boolean {
  return importPath === targetPackageName || importPath.startsWith(`${targetPackageName}/`)
}

export default defineConfig({
  plugins: [solid(), libInjectCss()],
  build: {
    target: 'esnext',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    reportCompressedSize: false,
    cssCodeSplit: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      // 当前库只把显式声明的外部依赖排除出 bundle，其余 src 内部模块都保留在产物里。
      external(importPath: string) {
        return externalDependencies.some((externalDependence) => isDependency(externalDependence, importPath))
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
