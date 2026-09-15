/** CSS 变量引用，以及显式可选的根默认定义和 @property 注册。 */
import type { Rule } from './css-block'
import { media } from '../css-block/media'
import { styleRule } from '../css-block/style'
import { propertyRule } from '../css-block/property'
import { declaration, type Declaration } from './css-declaration'
import { key } from './css-key'
import { parseValue, toValue, value, type Value } from './css-value'

/** CSS 变量引用；局部取值由 declareVariable 定义，引用本身不保存当前取值。 */
export interface Variable extends Value {
  /** 变量的类型注册和根默认定义在同一激活波提交。 */
  onActive?: () => Rule[]

  /** 不包含开头的 --。 */
  name: string

  /** 引用未取得有效值时使用的兜底内容。 */
  fallback?: Value
}

export interface VariableOptions {
  /** 根作用域的默认定义；省略时不生成任何根规则。 */
  root?: {
    /** :where(:root) 的默认取值，可被局部定义覆盖。 */
    value: Value | string

    /** 根元素 data-theme="dark" 时的取值。 */
    dark?: Value | string

    /** prefers-reduced-motion: reduce 时的取值。 */
    reducedMotion?: Value | string
  }

  /** var(...) 的兜底内容，不是在作用域内预先赋值。 */
  fallback?: Value

  /** 可选的浏览器类型注册，首次激活时提交，不等同于局部取值定义。 */
  registration?: {
    /** CSS 值语法，例如 '<length>'；'*' 不限制值语法。 */
    syntax: string

    /** 是否继承父元素的取值。 */
    inherits: boolean

    /** syntax 不是 '*' 时必填；必须能独立计算，不依赖其他属性值。 */
    initialValue?: Value
  }
}

const syntaxKey = key('syntax')
const inheritsKey = key('inherits')
const initialValueKey = key('initial-value')

/**
 * 声明变量引用；仅在显式提供 root 或 registration 时附带相应的激活内容。
 * @example
 * const gap = variable('gap', {
 *   registration: { syntax: '<length>', inherits: false, initialValue: value('8px') },
 * })
 * const surface = variable('surface', { root: { value: light, dark } })
 */
export function variable(name: string, options?: VariableOptions): Variable {
  const rules: Rule[] = []
  const reference: Variable = {
    kind: 'value',
    name,
    fallback: options?.fallback,
    onActive: options?.registration || options?.root ? () => rules : undefined,
    parseCss(context) {
      return this.fallback ? `var(--${name}, ${parseValue(this.fallback, context)})` : `var(--${name})`
    },
  }

  // 类型注册与根取值互相独立，也可以同时存在。
  const registration = options?.registration
  if (registration) {
    rules.push(
      propertyRule(
        name,
        declaration(syntaxKey, value(JSON.stringify(registration.syntax))),
        declaration(inheritsKey, value(String(registration.inherits))),
        registration.initialValue ? declaration(initialValueKey, registration.initialValue) : [],
      ),
    )
  }

  const root = options?.root
  if (root) {
    rules.push(
      styleRule(':where(:root)').of(
        declareVariable(reference, root.value),
        root.dark === undefined
          ? []
          : styleRule('&:where([data-theme="dark"])').of(declareVariable(reference, root.dark)),
        root.reducedMotion === undefined
          ? []
          : media(
              '(prefers-reduced-motion: reduce)',
              styleRule('&').of(declareVariable(reference, root.reducedMotion)),
            ),
      ),
    )
  }

  return reference
}

/**
 * 在接收此 Declaration 的规则内定义变量取值，不修改引用及其 fallback。
 * 定义本身也会激活变量的注册能力，不要求另有属性消费该引用。
 * @example kitRoot.attach(declareVariable(horizontalPadding, normalSpace))
 */
export function declareVariable(reference: Variable, input: Value | string): Declaration {
  const assigned = toValue(input)
  return declaration(key(`--${reference.name}`), {
    kind: 'value',
    parseCss(context) {
      context?.activateValue(reference)
      return parseValue(assigned, context)
    },
  })
}
