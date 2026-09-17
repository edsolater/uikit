/** 内边距 CSS Key 与方向内容协议。 */
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** padding 简写 Key；数组按 CSS 位置顺序组合，对象只声明指定方向。 */
export const $padding = key('padding', 'padding')
/** padding-top Key。 */
export const $paddingTop = key('padding-top')
/** padding-right Key。 */
export const $paddingRight = key('padding-right')
/** padding-bottom Key。 */
export const $paddingBottom = key('padding-bottom')
/** padding-left Key。 */
export const $paddingLeft = key('padding-left')

/** 只为指定方向生成声明的内边距输入；缺省方向不会从其他值补齐。 */
export interface PaddingSides {
  top?: ValueInput
  right?: ValueInput
  bottom?: ValueInput
  left?: ValueInput
}

/** 按 CSS 简写顺序表示一至四个内边距位置值，作为 padding Declaration 的 content。 */
export type PaddingPositions = [ValueInput] | [ValueInput, ValueInput] | [ValueInput, ValueInput, ValueInput] | [ValueInput, ValueInput, ValueInput, ValueInput]

/** padding Key 接受的完整内容；既可整体取值，也可按位置或方向提供。 */
export type PaddingInput = ValueInput | PaddingPositions | PaddingSides
