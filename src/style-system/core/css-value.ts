/** CSS 值及渲染时的激活通知。 */
import type { Content, Rule } from './css-block'

export interface RenderContext {
  /** 每次渲染前通知，由接收方处理重复激活。 */
  activateValue(value: Value): void
}

export interface Value {
  kind: 'value'

  /** 激活时同步执行；返回的规则或递归规则集合随此值一起注册。 */
  onActive?: () => Content<Rule> | void

  /** 内部 Value 须通过 parseValue 渲染并传递 context，才能参与激活。 */
  parseCss(context?: RenderContext): string
}

/**
 * 原样输出，不补单位或引号。
 * @example
 * const fadeName = value('fade', { onActive: () => fadeRules })
 */
export function value(
  raw: string | number,
  options?: Pick<Value, 'onActive'>,
): Value & { raw: string | number } {
  return {
    kind: 'value',
    raw,
    onActive: options?.onActive,
    parseCss() {
      return String(this.raw)
    },
  }
}

/**
 * 渲染前通知 context；省略 context 时只输出文本，不触发激活。
 * @example
 * const css = parseValue(value('2px')) // '2px'，不执行 onActive
 */
export function parseValue(value: Value, context?: RenderContext): string {
  context?.activateValue(value)
  return value.parseCss(context)
}

/** 字符串原样包装；已有 Value 保留原引用。 */
export function toValue(input: Value | string): Value {
  return typeof input === 'string' ? value(input) : input
}

/** 分隔符属于语法，子值直到渲染时才解析。 */
export function joinValues(separator: string, ...parts: (Value | string)[]): Value {
  const values = parts.map(toValue)
  return {
    kind: 'value',
    parseCss(context) {
      return values.map((item) => parseValue(item, context)).join(separator)
    },
  }
}
