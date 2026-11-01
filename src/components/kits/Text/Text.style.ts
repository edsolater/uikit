/** 定位框开启时只隐藏文字像素，文字继续排版与更新。 */
import { rules, token, stateCondition } from '@/style-system'

rules('.Text', {
  visibility: token('inherit', { state: [[stateCondition('body:has(.StructureViewOverlay:popover-open) &'), 'hidden']] }),
  color: token('inherit', { state: [
    [stateCondition('&[data-tone="muted"]'), 'var(--color-fg-soft)'],
    [stateCondition('&[data-tone="warning"]'), 'var(--color-warn)'],
    [stateCondition('&[data-tone="result"]'), 'var(--color-fg-strong)'],
  ] }),
  'white-space': 'normal',
  'overflow-wrap': 'anywhere',
})
