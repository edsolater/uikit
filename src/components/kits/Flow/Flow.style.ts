import { rules, stateCondition, token } from '@/style-system'
const row = stateCondition('&[data-direction="row"]')
const direction = token('column', { name: 'flow-direction', state: [[row, 'row']] })
const wrap = token('nowrap', { name: 'flow-wrap', state: [[row, 'wrap']] })
const alignment = token('normal', { name: 'flow-alignment', state: [[row, 'center']] })
rules('.Flow', {
  display: 'flex',
  'flex-direction': direction,
  'flex-wrap': wrap,
  'align-items': alignment,
  gap: '1rem',
  'min-width': '0',
})
