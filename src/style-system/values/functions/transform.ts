/** CSS 变换函数值，不绑定 transform 属性声明。 */
import { parseValue, type Value } from '../../core/css-value'

/**
 * 纵向位移；正值向下，负值向上，距离仍是独立 Value。
 * @example translateY(value('2px')).parseCss() // translateY(2px)
 */
export function translateY(distance: Value): Value & { distance: Value } {
  return {
    kind: 'value',
    distance,
    parseCss(context) {
      return `translateY(${parseValue(this.distance, context)})`
    },
  }
}
