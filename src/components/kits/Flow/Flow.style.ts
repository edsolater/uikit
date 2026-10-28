import { rules, stateCondition, token } from '@/style-system'
const row = stateCondition('&[data-direction="row"]')
const direction = token('column', { state: [[row, 'row']] })
const wrap = token('nowrap', { state: [[row, 'wrap']] })
const alignment = token('normal', { state: [[row, 'center']] })
rules('.Flow', {
  display: 'flex',
  'flex-direction': direction,
  'flex-wrap': wrap,
  'align-items': alignment,
  gap: '1rem',
  'min-width': '0',
})
