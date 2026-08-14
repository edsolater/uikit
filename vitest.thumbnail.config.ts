/** Example 缩略图只在显式生成时运行，不进入正式浏览器测试。 */
import { playwright } from '@vitest/browser-playwright'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    include: ['src/app/example-dashboard/thumbnail/**/*.thumbnail.tsx'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ launchOptions: { channel: 'msedge' } }),
      instances: [{ browser: 'chromium' }],
    },
  },
})