/**
 * 链接的可辨识状态。
 *
 * 区分悬停和当前页面，同时保持内容由调用方提供。
 *
 * 导航反馈无需额外卡片皮肤。
 */
import { rules, stateCondition, token } from '@/style-system'
const decoration = token('none', {
  state: [
    [stateCondition('&:hover'), 'underline'],
    [stateCondition('&[aria-current="page"]'), 'underline'],
  ],
})
rules('.Link', {
  color: token('var(--color-link)', { state: [[stateCondition('&:hover'), 'var(--color-link-hover)']] }),
  'text-decoration': decoration,
  'text-underline-offset': '.2em',
})
