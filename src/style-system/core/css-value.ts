/** 按 Subject Condition 名称分支的 Value 与复合值协议。 */
import { isIterable, toCollectionIterator } from '@edsolater/fnkit'
import type { ConditionPath } from './css-condition'
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
  /** 首次解析访问时产生根地址 Rules；异常终止编译。 */
  onActive?: (context: CompileContext) => Rules | Rules[] | void
}

/** 不再拆分的 CSS 值。 */
export type RawValue = string | number

/** Declaration 可消费的原始值、条件分支或复合值。 */
export type Value = RawValue | (ValueOptions & {
  kind: 'value'
  default: ValueInput
  conditions: [string, ValueInput][]
  expression?: never
}) | (ValueOptions & {
  kind: 'value'
  expression: ValueExpression
  default?: never
  conditions?: never
})

/** Value 构造器和 Declaration 的内容。 */
export type ValueInput = Value | Rules

/** Subject Condition 名称到分支值的对象或键值 Iterable。 */
export type ValueBranches = Record<string, ValueInput> | Iterable<[name: string, value: ValueInput]>

/** 保留子 Value 的复合表达。 */
export type ValueExpression =
  | { type: 'variable'; name: string; fallback?: ValueInput }
  | { type: 'list'; items: ValueInput[] }
  | { type: 'product'; amount: ValueInput; factor: ValueInput }
  | { type: 'function'; name: string; arguments: ValueInput[] }
  | { type: 'animation'; name: ValueInput; duration: ValueInput; easing?: ValueInput; delay?: ValueInput; iterations?: ValueInput; direction?: ValueInput; fillMode?: ValueInput; playState?: ValueInput }
  | { type: 'color-mix'; colors: (ValueInput | [ValueInput, ValueInput])[] }
  | { type: 'shadow'; x: ValueInput; y: ValueInput; blur?: ValueInput; spread?: ValueInput; color?: ValueInput; inset?: boolean }

/** 判断第二参数是否是按需依赖配置。 */
function isValueOptions(input: ValueBranches | ValueOptions): input is ValueOptions {
  return typeof input === 'object' && input !== null
    && !isIterable(input)
    && 'onActive' in input
    && (input.onActive === undefined || typeof input.onActive === 'function')
    && Object.keys(input).every((key) => key === 'onActive')
}

/** 把对象或键值 Iterable 转为固定分支数组。 */
function branchEntries(input: ValueBranches): [string, ValueInput][] {
  if (typeof input !== 'object' || input === null) throw new Error('Value 分支必须是名称对象或键值 Iterable。')
  const source = isIterable(input) ? new Map(input as Iterable<[string, ValueInput]>) : input
  return Array.from(toCollectionIterator(source), ({ key, value }) => {
    if (typeof key !== 'string') throw new Error('Value 分支名称必须是字符串。')
    return [key, value]
  })
}

/** 保存默认值、名称分支与按需依赖；分支接受对象或键值 Iterable。 */
export function value(input: ValueInput, options?: ValueOptions): Extract<Value, { default: ValueInput }>
export function value(input: ValueInput, branches: ValueBranches, options?: ValueOptions): Extract<Value, { default: ValueInput }>
export function value(input: ValueInput, branchesOrOptions?: ValueBranches | ValueOptions, options?: ValueOptions): Extract<Value, { default: ValueInput }> {
  const branches = branchesOrOptions !== undefined && (options !== undefined || !isValueOptions(branchesOrOptions))
    ? branchEntries(branchesOrOptions as ValueBranches)
    : []
  return {
    kind: 'value',
    default: input,
    conditions: branches,
    ...(branchesOrOptions !== undefined && isValueOptions(branchesOrOptions) ? branchesOrOptions : options),
  }
}
