/** 标题与问号在行内排布；原生浮层独立定位，不占用字段高度。 */
import { rules } from '@/style-system'

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
rules('body:has(.StructureViewOverlay:popover-open) .Label > label', {
  visibility: 'hidden',
})
