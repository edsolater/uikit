/**
 * Board的网格承载材质。
 *
 * 按声量与容纳尺度定义背景、边界和内部空间。
 *
 * 语义身份不复制视觉实现，上层主体可消费公开边界材料形成自身反馈。
 */
import { rules, token, stateCondition } from '@/style-system'
const soft = stateCondition('&[data-variant="soft"]')
const solid = stateCondition('&[data-variant="solid"]')
const small = stateCondition('&[data-size="small"]')
const large = stateCondition('&[data-size="large"]')
const xlarge = stateCondition('&[data-size="xlarge"]')
const background = token(
  'color-mix(in oklab, var(--color-surface) 78%, transparent)',
  {
    state: [
      [soft, 'color-mix(in oklab, var(--color-surface) 58%, transparent)'],
      [solid, 'var(--color-surface)'],
    ],
  },
)
/** 完整边界材料，允许信息主体派生自己的语义差异。 */
export const boardBorder = token(
  'var(--boundary-1) solid color-mix(in oklab, var(--color-line-soft) 72%, transparent)',
  {
    name: 'board-border',
    state: [
      [
        soft,
        'var(--boundary-1) solid color-mix(in oklab, var(--color-line-soft) 48%, transparent)',
      ],
      [solid, 'var(--boundary-1) solid var(--color-line-soft)'],
    ],
  },
)
const shadow = token('var(--shadow-card)', {
  state: [[soft, 'var(--shadow-1)']],
})
const padding = token('var(--space-6)', {
  state: [
    [small, 'var(--space-4)'],
    [large, 'var(--space-7)'],
    [xlarge, 'var(--space-8)'],
  ],
})
const gap = token('var(--space-5)', {
  state: [
    [small, 'var(--space-3)'],
    [large, 'var(--space-6)'],
    [xlarge, 'var(--space-7)'],
  ],
})
const radius = token('var(--radius-4)', { state: [[small, 'var(--radius-3)']] })
rules('.Board', {
  display: 'grid',
  'margin-trim': 'none',
  gap,
  padding,
  border: boardBorder,
  'border-radius': radius,
  background,
  'box-shadow': shadow,
  'backdrop-filter': 'saturate(1.12) brightness(1.03)',
})
