/**
 * Help 的独立帮助入口样式。
 *
 * 绘制圆形问号入口与键盘焦点提示，并沿用所在文字的颜色。
 *
 * 使辅助说明入口可以在字段与其他内容旁直接识别，提示正文由浮层设施呈现。
 */
import { componentName } from './Help.prop'
import { rules, token } from '@/style-system'

rules(`.${componentName}`, {
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
