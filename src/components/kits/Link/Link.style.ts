/**
 * 链接的可辨识状态。
 *
 * 区分悬停和当前页面，同时保持内容由调用方提供。
 *
 * 导航反馈无需额外卡片皮肤。
 */
import { rules, stateCondition, token, brandColorTheme, oklch, add } from '@/style-system'
const decoration = token('none', {
  name: 'link-decoration',
  state: [
    [stateCondition('&:hover'), 'underline'],
    [stateCondition('&[aria-current="page"]'), 'underline'],
  ],
})
rules('.Link', {
  color: token(() => brandColorTheme, {
    name: 'link-content-color',
    state: [[stateCondition('&:hover'), oklch(brandColorTheme, {
      lightness: (current) => add(current, -0.04),
      chroma: (current) => add(current, 0.01),
    })]],
  }),
  'text-decoration': decoration,
  'text-underline-offset': '.2em',
})
