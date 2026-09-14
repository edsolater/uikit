/** 带兜底值和可选 @property 注册的 CSS 变量引用。 */
import { propertyRule } from './css-block/property'
import { declaration, type Declaration } from './css-declaration'
import { key } from './css-key'
import { parseValue, toValue, value, type RenderContext, type Value } from './css-value'

/** 调用时定义局部取值，直接作为属性输入时引用 var(...)；两种用法共享同一身份。 */
export interface Variable extends Value {
  /**
   * 在容纳此 Declaration 的规则中定义取值，不修改共享变量或 fallback。
   * @example styleRule('.Button')(paddingX(spacing), padding(paddingX))
   */
  (input: Value | string): Declaration

  /** 不包含开头的 --。 */
  readonly name: string
  /** 引用未取得有效值时使用的兜底内容。 */
  readonly fallback?: Value
}

export interface VariableOptions {
  /** var(...) 的兜底内容，不是在作用域内预先赋值。 */
  readonly fallback?: Value

  /** 可选的浏览器类型注册，首次激活时提交，不等同于局部取值定义。 */
  readonly registration?: {
    /** CSS 值语法，例如 '<length>'；'*' 不限制值语法。 */
    readonly syntax: string
    /** 是否继承父元素的取值。 */
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
  const property = key(`--${name}`)
  const registration = options?.registration
  const rule = registration
    ? propertyRule(name, [
        declaration(syntaxKey, value(JSON.stringify(registration.syntax))),
        declaration(inheritsKey, value(String(registration.inherits))),
        ...(registration.initialValue ? [declaration(initialValueKey, registration.initialValue)] : []),
      ])
    : undefined

  const reference: Variable = Object.assign(
    (input: Value | string): Declaration => {
      const assigned = toValue(input)
      return declaration(property, {
        kind: 'value',
        parseCss(context) {
          context?.activateValue(reference)
          return parseValue(assigned, context)
        },
      })
    },
    {
      kind: 'value' as const,
      fallback: options?.fallback,
      onActive: rule ? () => rule : undefined,
      parseCss(context?: RenderContext) {
        return this.fallback ? `var(--${name}, ${parseValue(this.fallback, context)})` : `var(--${name})`
      },
    },
  )

  // 函数的 name 不能直接赋值，但允许重新定义为 CSS 变量名。
  Object.defineProperty(reference, 'name', { value: name })
  return reference
}
