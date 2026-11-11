/** 拖动期间限制浏览器手势与过渡；位移由指针事务提供。 */
import { rules } from '@/style-system'

rules(['@layer uikit', '[data-plugin~="draggable"]'], {
  'touch-action': 'none',
})

rules(['@layer uikit', '[data-interacting="true"]'], {
  'translate': 'var(--drag-x) var(--drag-y)',
  'pointer-events': 'none',
  'transition': 'none !important',
  'will-change': 'translate',
})
