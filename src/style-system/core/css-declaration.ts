/** CSS 属性与值的组合，负责冒号和分号。 */
import type { Key } from './css-key'
import { parseValue, type RenderContext, type Value } from './css-value'

export interface Declaration<K extends string = string> {
  readonly kind: 'declaration'
  readonly key: Key<K>
  readonly value: Value
  parseCss(context?: RenderContext): string
}

/** 复用传入的 Key 和 Value，不复制。 */
export function declaration<K extends string>(key: Key<K>, value: Value): Declaration<K> {
  return {
    kind: 'declaration', key, value,
    parseCss(context) { return `${this.key.name}: ${parseValue(this.value, context)};` },
  }
}
