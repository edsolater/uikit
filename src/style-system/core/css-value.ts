/** Condition Value 与复合值协议。 */
import { toConditionPath, type ConditionInput, type ConditionPath } from './css-condition'
import type { CSSKey } from './css-key'
import type { Rules } from './css-rule'

/** Value 的本次编译位置。 */
export interface CompileContext {
  /** 源 Rules 快照。 */
  root: Rules
  /** 完整消费路径。 */
  path: ConditionPath
  /** 当前消费 Key。 */
  key?: CSSKey
}

/** Value 的按需依赖。 */
export interface ValueOptions {
  /** 首次消费时产生本次编译的根地址 Rules；异常终止编译。 */
  onActive?: (context: CompileContext) => Rules | Rules[] | void
}

/** 不再拆分的 CSS 值。 */
export type RawValue = string | number

/** Declaration 可消费的原始值、Condition Value 或复合值。 */
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

/** Value 构造器和 Declaration 的内容。 */
export type ValueInput = Value | Rules

/** 保留子 Value 的复合表达。 */
export type ValueExpression =
  | { type: 'variable'; name: string; fallback?: ValueInput }
  | { type: 'list'; items: ValueInput[] }
  | { type: 'product'; amount: ValueInput; factor: ValueInput }
  | { type: 'function'; name: string; arguments: ValueInput[] }
  | { type: 'animation'; name: ValueInput; duration: ValueInput; easing?: ValueInput; delay?: ValueInput; iterations?: ValueInput; direction?: ValueInput; fillMode?: ValueInput; playState?: ValueInput }
  | { type: 'color-mix'; colors: (ValueInput | [ValueInput, ValueInput])[] }
  | { type: 'shadow'; x: ValueInput; y: ValueInput; blur?: ValueInput; spread?: ValueInput; color?: ValueInput; inset?: boolean }

/** 保存默认值、条件分支与按需依赖；不求值或触发依赖。 */
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
