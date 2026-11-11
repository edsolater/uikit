/** 既有 is 功能类的样式，由 Style System 统一登记。 */
import { rules, stateCondition, token } from '@/style-system'

rules(['@layer is', '.is\\:backdrop-root'], { 'clip-path': 'inset(0)' })

const scrollOverflow = token('auto', {
  name: 'is-scroll-area-overflow',
  state: [[stateCondition('@supports (overflow: overlay)'), 'overlay']],
})
rules(['@layer is', '.is\\:scroll-area'], {
  'overflow': scrollOverflow,
  'scrollbar-gutter': 'stable',
  'overscroll-behavior': 'contain',
})
rules(['@layer is', '.is\\:scroll-area::-webkit-scrollbar'], {
  width: '10px',
  height: '10px',
})
rules(['@layer is', '.is\\:scroll-area::-webkit-scrollbar-track'], {
  background: 'transparent',
})
const scrollbarThumbColor = token('rgb(255 255 255 / 0.22)', {
  name: 'is-scroll-area-thumb-color',
  state: { hover: 'rgb(255 255 255 / 0.34)' },
})
rules(['@layer is', '.is\\:scroll-area::-webkit-scrollbar-thumb'], {
  'border': '3px solid transparent',
  'border-radius': '999px',
  'background': scrollbarThumbColor,
  'background-clip': 'content-box',
})
rules(['@layer is', '.is\\:scroll-area::-webkit-scrollbar-corner'], {
  background: 'transparent',
})
rules(['@layer is', '.is\\:self-host-scroll-behavior'], {
  'overflow-anchor': 'none',
})
