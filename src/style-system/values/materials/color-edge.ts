/** 分隔线、边缘与焦点提示色。 */
import { variable } from '../../core/css-variable'
import { colorMix } from '../functions/color-mix'
import { defaultForegroundColor } from './color-text'
import { accentFocusColor } from './color-tone'

/** 边缘混色中分隔线色的占比，范围为零至一。 */
const edgeColorRatio = 0.72

/** 中性分隔线色。 */
export const lineColor = variable('color-line', { root: { value: colorMix([defaultForegroundColor, 0.18], 'transparent') } })

/** 边缘颜色，默认使用半透明分隔线色。 */
export const edgeColor = variable('component-border-color', {
  fallback: colorMix([lineColor, edgeColorRatio], 'transparent'),
})

/** 焦点提示色，默认采用强调色系。 */
export const focusColor = variable('component-focus-color', { fallback: accentFocusColor })
