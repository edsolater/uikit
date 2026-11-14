/**
 * 顺序内容流的排列样式。
 *
 * 保持实例指定间距，按自身方向与伸展状态安排空间。
 *
 * 分栏和子组件外观由各自主体负责。
 */
import { rules, stateCondition, token } from '@/style-system'
const row = stateCondition('&[data-direction="row"]')
const direction = token('column', {
  name: 'flow-direction',
  state: [[row, 'row']],
})
const wrap = token('nowrap', { name: 'flow-wrap', state: [[row, 'wrap']] })
const alignment = token('normal', {
  name: 'flow-alignment',
  state: [[row, 'center']],
})
const flex = token('initial', {
  name: 'flow-flex',
  state: [[stateCondition('&[data-grow="true"]'), '1']],
})
rules('.Flow', {
  'display': 'flex',
  'flex-direction': direction,
  'flex-wrap': wrap,
  'align-items': alignment,
  'gap': 'var(--flow-gap)',
  'min-width': '0',
  'width': 'var(--flow-width)',
  flex,
})
