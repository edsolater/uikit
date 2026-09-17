/** 内边距按位置或方向保存，不在构造时扩写。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** padding 简写声明的属性位置。 */
export const paddingKey = key('padding')
/** padding-top 声明的属性位置。 */
export const paddingTopKey = key('padding-top')
/** padding-right 声明的属性位置。 */
export const paddingRightKey = key('padding-right')
/** padding-bottom 声明的属性位置。 */
export const paddingBottomKey = key('padding-bottom')
/** padding-left 声明的属性位置。 */
export const paddingLeftKey = key('padding-left')

/** 创建只设置顶部内边距的 Declaration，不补充其他方向。 */
export const paddingTop = (input: ValueInput) => declaration(paddingTopKey, input)

/** 创建只设置右侧内边距的 Declaration，不补充其他方向。 */
export const paddingRight = (input: ValueInput) => declaration(paddingRightKey, input)

/** 创建只设置底部内边距的 Declaration，不补充其他方向。 */
export const paddingBottom = (input: ValueInput) => declaration(paddingBottomKey, input)

/** 创建只设置左侧内边距的 Declaration，不补充其他方向。 */
export const paddingLeft = (input: ValueInput) => declaration(paddingLeftKey, input)

/** 只为指定方向生成声明的内边距输入；缺省方向不会从其他值补齐。 */
export interface PaddingSides {
  top?: ValueInput
  right?: ValueInput
  bottom?: ValueInput
  left?: ValueInput
}

/** 按 CSS 简写顺序表示一至四个内边距位置值。 */
export type PaddingPositions = [ValueInput] | [ValueInput, ValueInput] | [ValueInput, ValueInput, ValueInput] | [ValueInput, ValueInput, ValueInput, ValueInput]

/**
 * 保存一至四个位置值，或仅指定方向的值；方向扩写及内部 Value 求值留给编译器。
 * @example
 * padding('4px', '8px') // 编译为上/下 4px、右/左 8px。
 * padding({ left: '2px' }) // 只生成 padding-left: 2px，不补其他方向。
 */
export function padding(...positions: PaddingPositions): Declaration<'padding', PaddingPositions>
export function padding(sides: PaddingSides): Declaration<'padding', PaddingSides>
export function padding(...inputs: PaddingPositions | [PaddingSides]) {
  const first = inputs[0]
  const content = typeof first !== 'object' || first instanceof Map || 'kind' in first ? inputs : first
  return declaration(paddingKey, content, 'padding')
}
