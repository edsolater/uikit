/** 按钮浮层的标题与正文编排；触发器外观由Button拥有。 */
import { rules } from '@/style-system'

rules('.Popover', { display: 'inline-flex' })
rules('.Popover > .surface > .header', {
  'margin-bottom': '10px',
  'font-size': '13px',
  'font-weight': 700,
  'letter-spacing': '.08em',
  'text-transform': 'uppercase',
  'color': 'rgba(255,216,187,.84)',
})
rules('.Popover > .surface > .body', {
  'display': 'grid',
  'gap': '10px',
  'font-size': '14px',
  'line-height': 1.55,
  'color': 'rgba(248,244,238,.92)',
})
