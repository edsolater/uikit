/** 字号、字重与行高比例。 */
import { value } from '../../core/css-value'

/** 固定字号阶梯，单位为像素。 */
export const fontSizes = { normal: value('14px'), large: value('16px'), xlarge: value('20px'), heading: value('24px') }

/** 常规与粗体的字重取值。 */
export const fontWeights = { normal: value(400), bold: value(700) }

/** 无单位行高倍数；单行档为字号的一倍。 */
export const lineHeights = { single: value(1) }
