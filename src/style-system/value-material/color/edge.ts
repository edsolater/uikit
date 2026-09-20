/** 分隔线与边缘色。 */
import { variable } from '../../core/css-variable'
import { colorMix } from '../../values/functions/color-mix'
import { textColor } from './text'

const softLineRatio = 0.72

/** 中性分隔线色。 */
export const lineColor = variable(undefined, { name: 'line-color', root: { value: colorMix([textColor, 0.18], 'transparent') } })

/** 低对比度边缘色。 */
export const softLine = colorMix([lineColor, softLineRatio], 'transparent')
