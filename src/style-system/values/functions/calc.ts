/** CSS calc 乘法，保留操作数引用并由浏览器计算。 */
import { type Value, parseValue } from '../../core/css-value'

/**
 * CSS calc 乘法；保留两个 Value，结果由浏览器计算，而不是由 JS 立即求值。
 * @example calcMultiply(value('120ms'), value(2)).parseCss() // calc(120ms * 2)，等效于 240ms。
 * @example calcMultiply(value('120ms'), variable('scale')).parseCss() // calc(120ms * var(--scale))
 */
export function calcMultiply(amount: Value, factor: Value): Value & { amount: Value; factor: Value } {
  return {
    kind: 'value',
    amount,
    factor,
    parseCss(context) {
      return `calc(${parseValue(this.amount, context)} * ${parseValue(this.factor, context)})`
    },
  }
}
