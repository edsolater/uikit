/** 可被变量引用的完整值列表；列表不绑定某个 CSS 属性。 */
import { parseValue, type Value } from '../core/css-value'
import { formatCommaList } from '../formatters/comma-list'

/** 各项仍是独立 Value，列表只持有它们的引用和顺序。 */
export interface ValueList<T extends Value = Value> extends Value {
  items: T[]
}

/**
 * 将完整值组成逗号列表；不接收字符串片段或可配置分隔符。
 * @example valueList(value('first'), value('second')).parseCss() // first, second
 * @example variable('shadow', { fallback: valueList(contactShadow, diffuseShadow) })
 */
export function valueList<T extends [Value, ...Value[]]>(...items: T): ValueList<T[number]> {
  return {
    kind: 'value',
    items,
    parseCss(context) {
      return formatCommaList(this.items, parseValue, context)
    },
  }
}
