/** 文档级主题、动效与滚动条外观；浏览器默认行为重置留在 reset。 */
import { rules } from '../rule'
import {
  accentColorTheme,
  canvasColorTheme,
  contentColorTheme,
} from './tokens/color/seeds'

const layer = '@layer reset'
const easing = 'cubic-bezier(0.2, 0, 0, 1)'
const dialogTransition = `opacity 180ms ${easing}, transform 180ms ${easing}, display 180ms ${easing} allow-discrete, overlay 180ms ${easing} allow-discrete`
const backdropTransition = `background 180ms ${easing}, display 180ms ${easing} allow-discrete, overlay 180ms ${easing} allow-discrete`

rules([layer, ':root'], {
  'color-scheme': 'light dark',
  'accent-color': accentColorTheme,
  'font-family': 'system-ui, sans-serif',
  'line-height': 1.5,
  'font-synthesis': 'none',
  'text-rendering': 'optimizeLegibility',
  '-webkit-font-smoothing': 'antialiased',
  'interpolate-size': 'allow-keywords',
  'transition-behavior': 'allow-discrete',
  'text-autospace': 'ideograph-alpha ideograph-numeric',
  'text-spacing-trim': 'trim-start',
  'scrollbar-gutter': 'stable',
})
rules([layer, 'html'], { 'min-block-size': '100%' })
rules([layer, 'body'], {
  'min-block-size': '100svb',
  'color': contentColorTheme,
  'background-color': canvasColorTheme,
})
rules([layer, ':where(h1, h2, h3, h4, h5, h6, p, li, figcaption)'], {
  'overflow-wrap': 'break-word',
})
rules([layer, ':where(h1, h2, h3, h4, h5, h6)'], {
  'line-height': 1.1,
  'text-wrap': 'balance',
})
rules([layer, ':where(p, li, figcaption)'], { 'text-wrap': 'pretty' })
rules(
  [
    layer,
    '@supports (text-box: trim-both cap alphabetic)',
    ':where(h1, h2, h3, h4, h5, h6, button, label)',
  ],
  { 'text-box': 'trim-both cap alphabetic' },
)
rules(
  [layer, ":where(button, [type='button'], [type='reset'], [type='submit'])"],
  { cursor: 'pointer' },
)
rules([layer, ':where(button, input, textarea, select):disabled'], {
  cursor: 'not-allowed',
})
rules([layer, ':where(textarea)'], {
  'resize': 'vertical',
  'field-sizing': 'content',
})
rules([layer, ':where(img, picture, svg, video, canvas)'], {
  'display': 'block',
  'max-inline-size': '100%',
})
rules([layer, ':where(img, svg, video, canvas)'], { 'block-size': 'auto' })
rules([layer, ':where(:focus-visible)'], {
  'outline': '2px solid currentColor',
  'outline-offset': '2px',
})
rules([layer, ':where([popover])'], { 'overscroll-behavior': 'contain' })
rules([layer, '*, *::before, *::after'], {
  'transition-property': 'opacity, transform, translate, scale, rotate',
  'transition-duration': '120ms',
  'transition-timing-function': 'ease',
})
rules([layer, 'dialog'], {
  'opacity': 0,
  'transform': 'translateY(12px) scale(0.96)',
  'overscroll-behavior': 'contain',
  'transition': dialogTransition,
})
rules([layer, 'dialog[open]'], { opacity: 1, transform: 'none' })
rules([layer, '@starting-style', 'dialog[open]'], {
  opacity: 0,
  transform: 'translateY(12px) scale(0.96)',
})
rules([layer, 'dialog::backdrop'], {
  background: 'rgb(0 0 0 / 0)',
  transition: backdropTransition,
})
rules([layer, 'dialog[open]::backdrop'], { background: 'rgb(0 0 0 / 0.42)' })
rules([layer, '@starting-style', 'dialog[open]::backdrop'], {
  background: 'rgb(0 0 0 / 0)',
})
rules([layer, 'textarea, pre'], { 'overscroll-behavior': 'contain' })
rules([layer, '*'], {
  'scrollbar-width': 'thin',
  'scrollbar-color':
    'light-dark(rgb(0 0 0 / 0.36), rgb(255 255 255 / 0.34)) transparent',
})
rules([layer, '@supports selector(::-webkit-scrollbar-thumb:hover)', '*'], {
  'scrollbar-width': 'revert',
})
rules(
  [
    layer,
    '@supports selector(::-webkit-scrollbar-thumb:hover)',
    '*::-webkit-scrollbar-thumb',
  ],
  {
    opacity: 0.8,
    width: '5px',
    transition: 'opacity 0.2s ease, width 0.2s ease',
  },
)
rules(
  [
    layer,
    '@supports selector(::-webkit-scrollbar-thumb:hover)',
    '*::-webkit-scrollbar-thumb:hover',
  ],
  { width: '10px', opacity: 1 },
)
