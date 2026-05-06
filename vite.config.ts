import { defineConfig } from 'vite'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import solid from 'vite-plugin-solid'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'

// 排除打包的第三方库
const externalDependencies = ['solid-js', '@edsolater/fnkit']

// 路径判定为引用第三方包
function isDependency(targetPackageName: string, importPath: string): boolean {
  return importPath === targetPackageName || importPath.startsWith(`${targetPackageName}/`)
}

// 把对外可直接引用的 CSS 原子文件复制到发布目录，保持包内引入路径稳定。
function copyCss() {
  const sourceDir = resolve('src/css')
  const targetDir = resolve('dist/css')

  return {
    name: 'copy-css',
    closeBundle() {
      cpSync(sourceDir, targetDir, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [solid(), libInjectCss(), copyCss()],
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
