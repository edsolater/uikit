/** 标题与问号在行内排布；原生浮层独立定位，不占用字段高度。 */
import { rules, token } from '@/style-system'

rules('.Label', {
  display: 'inline-flex',
  'align-items': 'center',
  gap: '4px',
  'font-size': '13px',
  'line-height': 1.2,
  'min-block-size': '1lh',
  color: '#64748b',
  'min-width': 0,
})
rules(['.Label', '> label'], { cursor: 'pointer' })
rules('.Label > .tooltipTrigger', {
  'display': 'inline-grid',
  'place-items': 'center',
  'width': '15px',
  'height': '15px',
  'padding': 0,
  'flex': 'none',
  'border': '1px solid currentColor',
  'border-radius': '50%',
  'background': 'transparent',
  'color': 'inherit',
  'font': '11px system-ui',
  'cursor': 'help',
  'outline': token('none', {
    name: 'label-tooltip-outline',
    state: { focus: '2px solid #93c5fd' },
  }),
  'outline-offset': token('0', {
    name: 'label-tooltip-outline-offset',
    state: { focus: '2px' },
  }),
})
rules('body:has(.StructureViewOverlay:popover-open) .Label > label', {
  visibility: 'hidden',
})
