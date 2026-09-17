/** 分隔线与边缘色。 */
import { variable } from '../../../core/css-variable'
import { colorMix } from '../../functions/color-mix'
import { foreground } from './text'

const softLineRatio = 0.72

/** 中性分隔线色。 */
export const line = variable('color-line', { root: { value: colorMix([foreground, 0.18], 'transparent') } })

/** 低对比度边缘色。 */
export const softLine = colorMix([line, softLineRatio], 'transparent')
