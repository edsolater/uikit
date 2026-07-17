/**
 * UIKit 单元测试配置。
 *
 * 【职责边界】为 Vitest 提供 Solid JSX 转换，并关闭测试进程不需要的浏览器热更新注入。
 *
 * 【不负责】不修改 Vite 开发服务器和组件库构建配置。
 */
import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [solid({ hot: false })],
})
