/** 一项属性过渡的目标、时长、缓动与延迟；不负责 transition 声明。 */
import type { Key } from '../core/css-key'
import { parseValue, type RenderContext, type Value } from '../core/css-value'

/** 单项过渡；两个时间值分别是时长与延迟，不是分组数组。 */
export type Transition = [
  property: Key | string,
  duration: Value | string,
  easing: Value | string,
  delay?: Value | string,
]

/**
 * 解析一项过渡；不输出属性名、分号或条目间的逗号。
 * @example parseTransition(['opacity', '120ms', 'ease', '30ms']) // opacity 120ms ease 30ms
 */
export function parseTransition([property, duration, easing, delay]: Transition, context?: RenderContext): string {
  const name = typeof property === 'string' ? property : property.name
  const timing = `${name} ${parseValue(duration, context)} ${parseValue(easing, context)}`
  return delay === undefined ? timing : `${timing} ${parseValue(delay, context)}`
}
