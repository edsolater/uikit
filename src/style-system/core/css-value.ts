/** 条件取值与延迟 CSS 函数。 */
import { isIterable, toCollectionIterator } from '@edsolater/fnkit'
import type { Valuable } from './css-valuable'
import type { Variable } from './css-variable'

export type { CompileContext } from './css-valuable'

/** 按需依赖配置。 */
export type ValueOptions = Valuable

/** 原始 CSS 内容。 */
export type RawValue = string | number

/** 按主体条件选择内容；未匹配时使用 default。 */
export interface Value extends Valuable {
  kind: 'value'
  default: ValueInput
  conditions: [string, ValueInput][]
}

/** 编译时生成内容；read 取得输入在当前条件下的 CSS 值。 */
export interface CSSFunction extends Valuable {
  (read: (input: ValueInput) => string | undefined): string | undefined
}

/** 可编译内容；undefined 不输出。 */
export type ValueInput = RawValue | Value | Variable | CSSFunction | undefined

/** 主体条件分支：名称对象或键值集合。 */
export type ValueBranches = Record<string, ValueInput> | Iterable<[name: string, value: ValueInput]>

/** 识别依赖配置。 */
function isValueOptions(input: ValueBranches | ValueOptions): input is ValueOptions {
  return typeof input === 'object' && input !== null && !isIterable(input)
    && 'onActive' in input && (input.onActive === undefined || typeof input.onActive === 'function')
    && Object.keys(input).every((key) => key === 'onActive')
}

/** 统一名称分支。 */
function branchEntries(input: ValueBranches): [string, ValueInput][] {
  if (typeof input !== 'object' || input === null) throw new Error('Value 分支必须是名称对象或键值 Iterable。')
  const source = isIterable(input) ? new Map(input as Iterable<[string, ValueInput]>) : input
  return Array.from(toCollectionIterator(source), ({ key, value }) => {
    if (typeof key !== 'string') throw new Error('Value 分支名称必须是字符串。')
    return [key, value]
  })
}

/** 保存默认值、主体条件分支与依赖。 */
export function value(input: ValueInput, options?: ValueOptions): Value
export function value(input: ValueInput, branches: ValueBranches, options?: ValueOptions): Value
export function value(input: ValueInput, branchesOrOptions?: ValueBranches | ValueOptions, options?: ValueOptions): Value {
  const branches = branchesOrOptions !== undefined && (options !== undefined || !isValueOptions(branchesOrOptions))
    ? branchEntries(branchesOrOptions as ValueBranches) : []
  return {
    kind: 'value', default: input, conditions: branches,
    ...(branchesOrOptions !== undefined && isValueOptions(branchesOrOptions) ? branchesOrOptions : options),
  }
}
