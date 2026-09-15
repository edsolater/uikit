/** 内边距的位置简写与按方向覆盖。 */
import { declaration, type Declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { parseValue, toValue, type Value } from '../core/css-value'

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

/** 按 CSS 顺序分别为四边、纵横、上横下或上右下左。 */
export type PaddingPositions =
  | [Value | string]
  | [Value | string, Value | string]
  | [Value | string, Value | string, Value | string]
  | [Value | string, Value | string, Value | string, Value | string]

/**
 * 位置参数沿用 CSS 的一至四值顺序；对象只覆盖给出的方向。
 * @example
 * padding('4px', '8px').parseCss() // padding: 4px 8px;
 * padding({ top: '4px', bottom: '4px' }).parseCss() // padding-top: 4px; padding-bottom: 4px;
 */
export function padding(...positions: PaddingPositions): Declaration<'padding', PaddingPositions>
export function padding(sides: PaddingSides): Declaration<'padding', PaddingSides>
export function padding(...inputs: PaddingPositions | [PaddingSides]) {
  const first = inputs[0]
  if (typeof first === 'string' || 'kind' in first) {
    return declaration(paddingKey, inputs as PaddingPositions, (positions, context) =>
      positions.map((position) => parseValue(position, context)).join(' '),
    )
  }
  return declaration(paddingKey, first, {
    parseCss(_name, sides, context) {
      return [
        sides.top === undefined ? [] : paddingTop(sides.top),
        sides.right === undefined ? [] : paddingRight(sides.right),
        sides.bottom === undefined ? [] : paddingBottom(sides.bottom),
        sides.left === undefined ? [] : paddingLeft(sides.left),
      ].flat().map((node) => node.parseCss(context)).join('\n')
    },
  })
}
