/** 问号入口独立拥有尺寸、焦点与锚点，不依赖 Label 祖先。 */
import { rules, token } from '@/style-system'
const outline = token('none', { state: { focus: '2px solid #93c5fd' } })
const outlineOffset = token('0', { state: { focus: '2px' } })
rules('.LabelHelpTrigger', {
  display: 'inline-grid',
  'place-items': 'center',
  flex: '0 0 auto',
  width: '15px',
  height: '15px',
  padding: 0,
  border: '1px solid currentColor',
  'border-radius': '50%',
  background: 'transparent',
  color: 'inherit',
  font: '11px system-ui',
  cursor: 'help',
  outline,
  'outline-offset': outlineOffset,
  'anchor-name': 'attr(data-anchor type(<custom-ident>))',
})
