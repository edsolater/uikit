/**
 * UIKit 单元测试配置。
 *
 * 【职责边界】为 Vitest 提供 Solid JSX 转换，并关闭测试进程不需要的浏览器热更新注入。
 *
 * 【不负责】不修改 Vite 开发服务器和组件库构建配置。
 */
import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vitest/config'
import { sourceAlias } from './vite.shared'

export default defineConfig({
  resolve: { alias: sourceAlias, conditions: ['browser'] },
  ssr: {
    resolve: { conditions: ['browser'] },
    noExternal: ['solid-js', '@solidjs/web'],
  },
  plugins: [solid()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.browser.test.{ts,tsx}'],
  },
})
