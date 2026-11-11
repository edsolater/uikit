/** 原生控件的共享外观；行为由浏览器自身承担。 */
import { rules } from '../rule'
import { token } from '../token'
import { colorMix } from './functions/color-mix'
import { accentColorTheme } from './tokens/color/seeds'
import { valueSequence } from './token-factory/list'

const nativeControlBorder = token(colorMix([accentColorTheme, 0.1], 'gray'), {
  name: 'native-control-border',
})
const nativeControlSurface = token(
  colorMix(['Canvas', 0.96], accentColorTheme),
  {
    name: 'native-control-surface',
  },
)
const nativeControlHoverSurface = token(
  colorMix(['Canvas', 0.92], accentColorTheme),
  {
    name: 'native-control-hover-surface',
  },
)
const nativeControlFocusColor = token(
  colorMix([accentColorTheme, 0.32], 'transparent'),
  {
    name: 'native-control-focus-color',
  },
)
const controlBorder = valueSequence('1px', 'solid', nativeControlBorder)
const focusOutline = valueSequence('2px', 'solid', nativeControlFocusColor)
const textInputs =
  ':where(input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"], input[type="number"], input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"], textarea, select)'
const buttons =
  ':where(button, input[type="button"], input[type="reset"], input[type="submit"])'
const layer = '@layer controls'

rules([layer, ':where(button, input, textarea, select, progress, meter)'], {
  'font': 'inherit',
  'color': 'inherit',
  'accent-color': accentColorTheme,
})
rules([layer, textInputs], {
  'min-height': '2.25em',
  'border': controlBorder,
  'border-radius': '0.5em',
  'padding': '0.5em 0.75em',
  'color': 'CanvasText',
  'background': nativeControlSurface,
  'caret-color': accentColorTheme,
})
rules([layer, `${textInputs}:where(:hover)`], {
  background: nativeControlHoverSurface,
})
rules([layer, `${textInputs}:where(:focus-visible)`], {
  'border-color': accentColorTheme,
  'outline': focusOutline,
  'outline-offset': '2px',
})
rules([layer, ':where(input, textarea)::placeholder'], {
  color: colorMix(['currentColor', 0.48], 'transparent'),
})
rules(
  [
    layer,
    ':where(input[type="search"])::-webkit-search-decoration, :where(input[type="search"])::-webkit-search-cancel-button',
  ],
  { appearance: 'none' },
)
rules([layer, buttons], {
  'border': controlBorder,
  'border-radius': '0.5em',
  'padding': '0.5em 0.875em',
  'color': 'CanvasText',
  'background': nativeControlSurface,
  'cursor': 'pointer',
})
rules([layer, `${buttons}:where(:hover)`], {
  background: nativeControlHoverSurface,
})
rules([layer, `${buttons}:where(:focus-visible)`], {
  'outline': focusOutline,
  'outline-offset': '2px',
})
rules([layer, ':where(input[type="checkbox"], input[type="radio"])'], {
  width: '1em',
  height: '1em',
  margin: 0,
})
rules([layer, ':where(input[type="range"])'], {
  'accent-color': accentColorTheme,
})
rules([layer, ':where(input[type="color"])'], {
  'width': '2.5em',
  'height': '2.25em',
  'border': controlBorder,
  'border-radius': '0.5em',
  'padding': '0.125em',
  'background': nativeControlSurface,
})
const supportsPicker = '@supports (appearance: base-select)'
rules(
  [layer, supportsPicker, ':where(select), :where(select)::picker(select)'],
  { appearance: 'base-select' },
)
rules([layer, supportsPicker, ':where(select)::picker(select)'], {
  'border': controlBorder,
  'border-radius': '0.5em',
  'background': nativeControlSurface,
})
rules([layer, supportsPicker, ':where(option)'], { padding: '0.5em 0.75em' })
rules([layer, supportsPicker, ':where(option:checked)'], {
  background: colorMix([accentColorTheme, 0.16], 'transparent'),
})
rules([layer, ':where(dialog)'], {
  'border': controlBorder,
  'border-radius': '0.75em',
  'padding': '1em',
  'color': 'CanvasText',
  'background': nativeControlSurface,
})
rules([layer, ':where(dialog)::backdrop'], {
  background: colorMix([accentColorTheme, 0.1], 'rgb(0 0 0 / 48%)'),
})
rules([layer, ':where(button, input, textarea, select):disabled'], {
  opacity: 0.56,
  cursor: 'not-allowed',
})
