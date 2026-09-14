/** CSS 值及渲染时的激活通知。 */
import type { Rule } from './css-block'

export interface RenderContext {
  /** 每次渲染前通知，由接收方处理重复激活。 */
  activateValue(value: Value): void
}

export interface Value {
  readonly kind: 'value'
  /** 激活时同步执行；返回的规则随此值一起注册。 */
  readonly onActive?: () => Rule | void
  /** 内部 Value 须通过 parseValue 渲染并传递 context，才能参与激活。 */
  parseCss(context?: RenderContext): string
}

/**
 * 原样输出，不补单位或引号。
 * @example
 * const fadeName = value('fade', { onActive: () => fadeRules })
 */
export function value(raw: string | number, options?: Pick<Value, 'onActive'>): Value & { readonly raw: string | number } {
  return {
    kind: 'value', raw, onActive: options?.onActive,
    parseCss() { return String(this.raw) },
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
