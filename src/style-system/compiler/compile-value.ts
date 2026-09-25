/** 稳定内容求值；状态只由 Variable 产生。 */
import type { ConditionPath } from '../condition'
import type { CompileContext, Valuable } from '../valuable'
import { isCSSContent, type ValueInput } from '../value'
import { isVariable, type Variable } from '../variable'
import { resolveStateConditions } from '../materials/state-conditions'
import { compileVariableReference } from './compile-variable-reference'

export type StateNames = string[]
export interface StateValueText { stateNames: StateNames; text: string }
export interface ValueContext extends CompileContext {
  activate(value: Valuable, location?: CompileContext): void
  resolving: Set<object>
  stateNames?: StateNames
  /** 显式 Rule 与局部声明分支的作用域，不随 Variable 状态内容求值扩展。 */
  scopeStateNames?: StateNames
  defineVariable(reference: Variable, location: ValueContext, values: (scope: ValueContext) => StateValueText[]): void
}
/** 将状态名称转换成中央顺序的条件路径；未知状态停止编译。 */
export function stateNamesToConditionPath(names: StateNames): ConditionPath {
  return resolveStateConditions(names).map((state) => state.condition)
}
/** 在当前条件下编译稳定内容；undefined 不产生声明，内部 Variable 状态不扩散。 */
export function compileValue(input: ValueInput, context: ValueContext): StateValueText[] {
  const text = readValue(input, context)
  return text === undefined ? [] : [{ stateNames: context.stateNames ?? [], text }]
}
/** 保持 Variable 引用，不把内部状态扩散到表达式。 */
export function readValue(input: ValueInput, context: ValueContext): string | undefined {
  if (input === undefined) return undefined
  if (typeof input === 'string' || typeof input === 'number') return String(input)
  if (input === null || Array.isArray(input) || (typeof input !== 'object' && typeof input !== 'function')) throw new Error('无效的 CSS 内容。')
  if (context.resolving.has(input)) throw new Error('Value 内容存在循环引用，无法生成 CSS。')
  context.resolving.add(input)
  try {
    context.activate(input, { ...context, path: [...context.path, ...stateNamesToConditionPath(context.stateNames ?? [])] })
    if (isVariable(input)) return compileVariableReference(input, context)
    if (isCSSContent(input)) return input.serializeCSS((child) => readValue(child, context))
    if (typeof input === 'object' && input.kind === 'value') return readValue(input.content, context)
    throw new Error('无效的 CSS 内容。')
  } finally { context.resolving.delete(input) }
}
