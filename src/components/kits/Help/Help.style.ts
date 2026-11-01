/** 帮助入口的圆圈外观与键盘焦点提示，独立于字段布局。 */
import { rules, token } from '@/style-system'

rules('.Help', {
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
    name: 'help-outline',
    state: { focus: '2px solid #93c5fd' },
  }),
  'outline-offset': token('0', {
    name: 'help-outline-offset',
    state: { focus: '2px' },
  }),
})
