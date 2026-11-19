/**
 * Popover 的原生定位与开关动效。
 *
 * 锚定正文位置，并使淡出与释放顶层同步。节点材料与内容布局由使用方承担。
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
    [stateCondition('&[data-anchor-gap="sm"]'), base => multiply(base, 1 / 2)],
    [stateCondition('&[data-anchor-gap="lg"]'), base => multiply(base, 2)],
  ],
})

rules('[data-plugin~="popover-body"]', {
  '--uikit-popover-duration': '160ms',
  '--uikit-popover-easing': 'ease',
  'transition-property': 'opacity, display, overlay',
  'transition-duration': 'var(--uikit-popover-duration)',
  'transition-timing-function': 'var(--uikit-popover-easing)',
  'transition-behavior': 'allow-discrete',
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
// 关闭结束必须隐藏正文，打开时沿用宿主的显示与不透明度。
rules('[data-plugin~="popover-body"]:not(:popover-open)', {
  display: 'none !important',
  opacity: '0 !important',
})
rules(['@starting-style', '[data-plugin~="popover-body"]:popover-open'], {
  opacity: '0 !important',
})
rules(
  ['@media (prefers-reduced-motion: reduce)', '[data-plugin~="popover-body"]'],
  {
    'transition-duration': '0s',
  },
)
