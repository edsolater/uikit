/** 分隔线、边缘与焦点提示色。 */
import { variable } from '../../core/css-variable'
import { $colorMix } from '../functions/color-mix'
import { foreground } from './color-text'
import { accentFocus } from './color-tone'

/** 边缘混色中分隔线色的占比，范围为零至一。 */
const edgeLineRatio = 0.72

/** 中性分隔线色。 */
export const line = variable('color-line', { root: { value: $colorMix([foreground, 0.18], 'transparent') } })

/** 边框颜色 Variable，默认使用半透明分隔线色。 */
export const borderColor = variable('color-border', {
  fallback: $colorMix([line, edgeLineRatio], 'transparent'),
})

/** 轮廓颜色 Variable，默认采用强调色系。 */
export const outlineColor = variable('color-outline', { fallback: accentFocus })
