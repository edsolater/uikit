/** 属性变化的过渡时间与缓动。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { flattenContent, type Content } from '../../core/css-block'
import { key, type Key } from '../../core/css-key'
import { joinValues, type Value } from '../../core/css-value'

export const transitionKey = key('transition')

/**
 * 单项属性过渡：属性、时长、缓动依次组合。
 * @example transitionValue(colorKey, fast, 'ease')
 */
export function transitionValue(
  property: Key | string,
  duration: Value | string,
  timingFunction: Value | string,
): Value {
  return joinValues(' ', typeof property === 'string' ? property : property.name, duration, timingFunction)
}

/**
 * 各过渡值以逗号分隔；数组仅用于分组。
 * @example transition(properties.map((property) => transitionValue(property, fast, 'ease')))
 */
export function transition(...items: Content<Value | string>[]): Declaration<'transition'> {
  return declaration(transitionKey, joinValues(', ', ...flattenContent<Value | string>(items)))
}
