/** Variable 引用、来源链与自身状态声明。 */
import { isVariableSourceFunction, variableDefinition, type Variable, type VariableInput, type VariableSource } from '../core/css-variable'
import { resolveStateConditions } from '../state-conditions'
import { compileValue, readValue, type ValueContext, type ValueResult } from './compile-value'

/** 只收集延伸链上的状态，不遍历普通值依赖。 */
function stateNames(reference: Variable): string[] {
  const definition = variableDefinition(reference)
  return [...new Set([...(definition.inherited ? stateNames(definition.inherited) : []), ...definition.states.keys()])]
}
/** source 函数只由 Variable 编译执行；返回结果继续走统一 ValueInput 读取。 */
function sourceContent(source: VariableSource) {
  return isVariableSourceFunction(source) ? source() : source
}
/** 输出 Variable 引用及来源 fallback，并在显式消费作用域补充线性的自身状态声明。 */
export function compileVariableReference(reference: Variable, context: ValueContext): string {
  const definition = variableDefinition(reference)
  const source = sourceContent(definition.source)
  const fallback = readValue(source, context)
  const states = resolveStateConditions(stateNames(reference))
  if (states.length) {
    context.defineVariable(reference, context, (scope) => {
      const current = states.findLast((state) => scope.conditions?.includes(state.name))
      const currentText = current && definition.states.has(current.name)
        ? readValue(definition.states.get(current.name), scope) : fallback
      const values: ValueResult[] = currentText === undefined ? [] : [{ conditions: scope.conditions ?? [], text: currentText }]
      for (const state of states) {
        if (current && state.order <= current.order) continue
        const active = resolveStateConditions([...(scope.conditions ?? []), state.name])
        const content = definition.states.has(state.name) ? definition.states.get(state.name) : source
        const text = readValue(content, { ...scope, conditions: active.map((state) => state.name) })
        if (text !== undefined) values.push({ conditions: active.map((state) => state.name), text })
      }
      return values
    })
  }
  return fallback === undefined ? `var(--${reference.name})` : `var(--${reference.name}, ${fallback})`
}
/** 编译 Variable 的局部赋值；条件覆盖与当前消费条件共同约束输出。 */
export function compileVariableDeclaration(input: VariableInput, context: ValueContext): ValueResult[] {
  if (!Array.isArray(input)) return compileValue(input, context)
  return input.flatMap(([name, content]) => compileValue(content, {
    ...context,
    conditions: [...(context.conditions ?? []), ...(name === undefined ? [] : [name])],
    scopeConditions: [...(context.scopeConditions ?? context.conditions ?? []), ...(name === undefined ? [] : [name])],
  }))
}
