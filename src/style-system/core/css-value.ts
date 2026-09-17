/** 将原始 CSS 文本、条件取值和复合表达统一为可由 Declaration 消费的 Value，创建时不生成 CSS。 */
import { toConditionPath, type ConditionInput, type ConditionPath } from './css-condition'
import type { CSSProperty } from './css-key'
import type { Rules } from './css-rule'

/** Value 被编译器实际访问时的消费位置，供 onActive 在同一次编译中派生额外 Rules。 */
export interface CompileContext {
  /** 本次编译的源 Rules 快照，不包含 onActive 返回的派生 Rules。 */
  root: Rules
  /** 包含外层 Rule 与当前 Value 条件的完整消费路径。 */
  path: ConditionPath
  /** 当前消费属性；无属性的原文或结构内容可以缺省。 */
  property?: CSSProperty
}

/** Value 在被编译消费时可选触发的依赖激活契约。 */
export interface ValueOptions {
  /**
   * 本次编译首次访问该 Value 时触发；context 是首次消费位置，返回的 Rules 仅加入本次编译。
   * 返回的 Rules 从根地址开始解释，不自动继承消费 path；需要原位置时显式使用 context.path。
   * 再次编译会重新触发；抛错终止当前编译，不生成部分 CSS。
   * @example
   * value('red', { onActive: () => new Map([[[[condition(':root')], '--visited'], 1]]) })
   * // 即使在 .Button 消费，也额外生成 :root { --visited: 1; }，不嵌套在 .Button 内。
   * // 单独创建该 Value 不产生此声明。
   */
  onActive?: (context: CompileContext) => Rules | Rules[] | void
}

/** 编译器不再继续拆分的 CSS 原始值；最终以字符串形式写入声明。 */
export type RawValue = string | number

/**
 * Declaration 可消费的完整取值：原始值直接输出，条件 Value 按当前 Condition Path 选择值，复合 Value 由编译器组合。
 * @example value('red', [[whenHover, 'blue']]) // 默认取 red，hover 地址取 blue。
 */
export type Value = RawValue | (ValueOptions & {
  kind: 'value'
  default: ValueInput
  conditions: [ConditionPath, ValueInput][]
  expression?: never
}) | (ValueOptions & {
  kind: 'value'
  expression: ValueExpression
  default?: never
  conditions?: never
})

/** Value 构造器和 Declaration 接受的内容；Rules 可在值位置继续表达嵌套属性或 CSS 结构。 */
export type ValueInput = Value | Rules

/** 编译器能够组合的结构化 CSS 值；各分支保留子 Value，使子值的 Condition 一起传播。 */
export type ValueExpression =
  | { type: 'variable'; name: string; fallback?: ValueInput }
  | { type: 'list'; items: ValueInput[] }
  | { type: 'product'; amount: ValueInput; factor: ValueInput }
  | { type: 'function'; name: string; arguments: ValueInput[] }
  | { type: 'animation'; name: ValueInput; duration: ValueInput; easing?: ValueInput; delay?: ValueInput; iterations?: ValueInput; direction?: ValueInput; fillMode?: ValueInput; playState?: ValueInput }
  | { type: 'color-mix'; colors: (ValueInput | [ValueInput, number])[] }
  | { type: 'shadow'; x: ValueInput; y: ValueInput; blur?: ValueInput; spread?: ValueInput; color?: ValueInput; inset?: boolean }

/**
 * 保存 default、各 Condition 对应的值及可选 onActive；不取值、不检测引用环，也不触发回调。
 * 编译时有同路径 Condition 就读取最后一个对应值，否则读取 default；嵌套值继续使用同一请求路径。
 * @example
 * const foreground = value('red', [[whenHover, 'blue']])
 * // 消费 foreground 时，默认生成 red，whenHover 对应位置生成 blue。
 */
export function value(input: ValueInput, options?: ValueOptions): Extract<Value, { default: ValueInput }>
export function value(input: ValueInput, conditions: [ConditionInput, ValueInput][], options?: ValueOptions): Extract<Value, { default: ValueInput }>
export function value(input: ValueInput, conditionsOrOptions?: [ConditionInput, ValueInput][] | ValueOptions, options?: ValueOptions): Extract<Value, { default: ValueInput }> {
  return {
    kind: 'value',
    default: input,
    conditions: Array.isArray(conditionsOrOptions) ? conditionsOrOptions.map(([path, child]) => [toConditionPath(path), child]) : [],
    ...(Array.isArray(conditionsOrOptions) ? options : conditionsOrOptions),
  }
}

/** 已有 Value 对象保留身份，RawValue 与 Rules 包成 default；不读取内部内容。 */
export function toValue(input: ValueInput): Value {
  return typeof input === 'object' && !(input instanceof Map) ? input : value(input)
}
