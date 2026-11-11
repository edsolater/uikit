/**
 * Popover 的原生定位规则。
 *
 * 只控制浮层锚定和翻向，节点材料与内容布局由使用方承担。
 */
import {
  baseSpace,
  multiply,
  rules,
  stateCondition,
  token,
} from '@/style-system'

/**
 * 锚点与浮层的间距档位；省略或 md 使用系统默认距离。
 */
export const popoverAnchorGap = token(multiply(baseSpace, 1 / 2), {
  name: 'popover-anchor-gap',
  state: [
    [
      stateCondition('&[data-anchor-gap="sm"]'),
      (base) => multiply(base, 1 / 2),
    ],
    [stateCondition('&[data-anchor-gap="lg"]'), (base) => multiply(base, 2)],
  ],
})

rules('[data-plugin~="popover-body"]', {
  'position': 'fixed',
  'inset': 'auto',
  'margin': popoverAnchorGap,
  'container-type': 'anchored',
  'position-try-fallbacks': token('flip-block', {
    name: 'popover-position-fallback',
    state: [
      [stateCondition('&[data-placement="left"]'), 'flip-inline'],
      [stateCondition('&[data-placement="right"]'), 'flip-inline'],
    ],
  }),
  'position-visibility': 'anchors-visible',
})
rules('[data-plugin~="popover-body"]:not(:popover-open)', { display: 'none' })
