/** UIKit 真实浏览器测试配置。 */
import { playwright } from '@vitest/browser-playwright'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    include: ['src/**/*.browser.test.{ts,tsx}'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: { channel: 'msedge' },
      }),
      instances: [{ browser: 'chromium' }],
    },
  },
})
