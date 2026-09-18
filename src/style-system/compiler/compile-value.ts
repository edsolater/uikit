/** 当前条件下的内容求值与分支展开。 */
import type { ConditionPath } from '../core/css-condition'
import type { CompileContext, Valuable } from '../core/css-valuable'
import type { ValueInput } from '../core/css-value'
import { resolveSubjectConditions } from '../subject-conditions'
import { compileVariableReference } from './compile-variable'

/** 激活的主体条件名称。 */
export type ValueConditions = string[]

/** 一个激活集合的 CSS 内容。 */
export interface ValueResult { conditions: ValueConditions; text: string }

/** 内容求值所需的消费位置与自动定义入口。 */
export interface ValueContext extends CompileContext {
  /** 激活按需依赖。 */
  activate(value: Valuable, location?: CompileContext): void
  resolving: Set<object>
  conditions?: ValueConditions
  /** 提供变量缺省赋值。 */
  defineVariable(name: string, values: ValueResult[], location: CompileContext): void
}

/** 主体条件对应的嵌套路径。 */
export function valueConditionPath(names: ValueConditions): ConditionPath {
  return resolveSubjectConditions(names).map((item) => item.condition)
}

/** 编译默认内容及可选局部分支；每个激活集合统一选择取值。 */
export function compileValue(input: ValueInput, context: ValueContext, branches: [string, ValueInput][] = []): ValueResult[] {
  const pending: string[][] = []
  const seen = new Set<string>()
  const results: ValueResult[] = []

  /** 登记尚未求值的激活集合。 */
  const enqueue = (names: string[]): void => {
    const normalized = resolveSubjectConditions(names).map((item) => item.name)
    const address = JSON.stringify(normalized)
    if (seen.has(address)) return
    seen.add(address)
    pending.push(normalized)
  }

  /** 选择当前集合中优先级最高的已有分支。 */
  const select = (base: ValueInput, branches: [string, ValueInput][], active: string[]): ValueInput => {
    const entries = new Map(branches)
    for (const { name } of resolveSubjectConditions([...entries.keys()])) enqueue([...active, name])
    const selected = resolveSubjectConditions(active).findLast(({ name }) => entries.has(name))
    return selected ? entries.get(selected.name) : base
  }

  /** 解析当前集合中的内容，拒绝递归引用。 */
  const read = (input: ValueInput, active: string[]): string | undefined => {
    if (input === undefined) return undefined
    if (typeof input === 'string' || typeof input === 'number') return String(input)
    if (input === null || Array.isArray(input) || (typeof input !== 'object' && typeof input !== 'function')) {
      throw new Error('无效的 CSS 内容。')
    }
    if (context.resolving.has(input)) throw new Error('Value 内容存在循环引用，无法生成 CSS。')
    context.resolving.add(input)
    try {
      const location = { ...context, path: [...context.path, ...valueConditionPath(active)] }
      context.activate(input, location)
      if (typeof input === 'function') return input((child) => read(child, active))
      if (input.kind === 'variable') return compileVariableReference(input, context)
      if (input.kind !== 'value') throw new Error('无效的 CSS 内容。')
      return read(select(input.default, input.conditions, active), active)
    } finally { context.resolving.delete(input) }
  }

  enqueue(context.conditions ?? [])
  for (let index = 0; index < pending.length; index++) {
    const active = pending[index]
    const text = read(select(input, branches, active), active)
    if (text !== undefined) results.push({ conditions: active, text })
  }
  return results.sort((left, right) => {
    if (left.conditions.length !== right.conditions.length) return left.conditions.length - right.conditions.length
    const a = resolveSubjectConditions(left.conditions)
    const b = resolveSubjectConditions(right.conditions)
    for (let index = 0; index < a.length; index++) {
      if (a[index].order !== b[index].order) return a[index].order - b[index].order
    }
    return 0
  })
}
