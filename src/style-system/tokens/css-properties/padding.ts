/** 内边距的位置简写与按方向覆盖。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { joinValues, toValue, type Value } from '../../core/css-value'

export const paddingKey = key('padding')
export const paddingTopKey = key('padding-top')
export const paddingRightKey = key('padding-right')
export const paddingBottomKey = key('padding-bottom')
export const paddingLeftKey = key('padding-left')

/** 上内边距。 */
export const paddingTop = (input: Value | string) => declaration(paddingTopKey, toValue(input))

/** 右内边距。 */
export const paddingRight = (input: Value | string) => declaration(paddingRightKey, toValue(input))

/** 下内边距。 */
export const paddingBottom = (input: Value | string) => declaration(paddingBottomKey, toValue(input))

/** 左内边距。 */
export const paddingLeft = (input: Value | string) => declaration(paddingLeftKey, toValue(input))

export interface PaddingSides {
  top?: Value | string
  right?: Value | string
  bottom?: Value | string
  left?: Value | string
}

/**
 * 位置参数沿用 CSS 的一至四值顺序；对象只覆盖给出的方向。
 * @example
 * padding(vertical, horizontal)
 * padding({ top: spacing, bottom: spacing })
 */
export function padding(first: Value | string, ...rest: (Value | string)[]): Declaration<'padding'>
export function padding(sides: PaddingSides): readonly Declaration[]
export function padding(
  ...inputs: [Value | string | PaddingSides, ...(Value | string)[]]
): Declaration | readonly Declaration[] {
  const [first, ...rest] = inputs
  if (typeof first === 'string' || 'kind' in first) {
    return declaration(paddingKey, joinValues(' ', first, ...rest))
  }
  return [
    first.top === undefined ? [] : paddingTop(first.top),
    first.right === undefined ? [] : paddingRight(first.right),
    first.bottom === undefined ? [] : paddingBottom(first.bottom),
    first.left === undefined ? [] : paddingLeft(first.left),
  ].flat()
}
