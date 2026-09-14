/** 带兜底值和可选 @property 注册的 CSS 变量引用。 */
import { propertyRule } from './css-block/property'
import { declaration } from './css-declaration'
import { key } from './css-key'
import { parseValue, value, type Value } from './css-value'

export interface Variable extends Value {
  /** 不包含开头的 --。 */
  readonly name: string
  readonly fallback?: Value
}

export interface VariableOptions {
  readonly fallback?: Value
  readonly registration?: {
    readonly syntax: string
    readonly inherits: boolean
    /** syntax 不是 '*' 时必填；必须能独立计算，不依赖其他属性值。 */
    readonly initialValue?: Value
  }
}

const syntaxKey = key('syntax')
const inheritsKey = key('inherits')
const initialValueKey = key('initial-value')

/**
 * 提供 registration 时，在首次激活时注册 @property。
 * @example
 * const gap = variable('gap', {
 *   registration: { syntax: '<length>', inherits: false, initialValue: value('8px') },
 * })
 */
export function variable(name: string, options?: VariableOptions): Variable {
  const registration = options?.registration
  const rule = registration ? propertyRule(name, [
    declaration(syntaxKey, value(JSON.stringify(registration.syntax))),
    declaration(inheritsKey, value(String(registration.inherits))),
    ...(registration.initialValue ? [declaration(initialValueKey, registration.initialValue)] : []),
  ]) : undefined

  return {
    kind: 'value', name, fallback: options?.fallback,
    onActive: rule ? () => rule : undefined,
    parseCss(context) {
      return this.fallback
        ? `var(--${this.name}, ${parseValue(this.fallback, context)})`
        : `var(--${this.name})`
    },
  }
}
