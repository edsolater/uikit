/** 分隔线与边缘色。 */
import { variable } from '../../../../variable'
import { condition } from '../../../../condition'
import { colorMix } from '../../combiners/color-mix'
import { textColor } from './text'

const softLineRatio = 0.72

const lineColorDefault = colorMix([textColor, 0.18], 'transparent')
/** 中性分隔线色，默认按根上的 textColor 求值。 */
export const lineColor = variable(lineColorDefault, {
  name: 'line-color',
  onActive: () => [[[condition(':where(:root)')], lineColor, lineColorDefault]],
})

/** 低对比度边缘色。 */
export const softLine = colorMix([lineColor, softLineRatio], 'transparent')
