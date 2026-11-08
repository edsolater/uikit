/**
 * Popover 的原生定位规则。
 *
 * 只控制浮层锚定和翻向，节点材料与内容布局由使用方承担。
 */
import { rules, stateCondition, token } from '@/style-system'

rules('[data-plugin~="popover-body"]', {
  'position': 'fixed',
  'inset': 'auto',
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
