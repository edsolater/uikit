/** UIKit 真实浏览器测试配置。 */
import { playwright } from '@vitest/browser-playwright'
import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vitest/config'
import { sourceAlias } from './vite.shared'

export default defineConfig({
  resolve: { alias: sourceAlias },
  plugins: [solid()],
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
