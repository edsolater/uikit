/** Variable 引用、来源链与自身状态声明。 */
import { variableDefinition, type Variable, type VariableInput } from '../core/css-variable'
import { resolveStateConditions } from '../state-conditions'
import { compileValue, readValue, type ValueContext, type ValueResult } from './compile-value'

/** 只收集延伸链上的状态，不遍历普通值依赖。 */
function stateNames(reference: Variable): string[] {
  const definition = variableDefinition(reference)
  return [...new Set([...(definition.inherited ? stateNames(definition.inherited) : []), ...definition.states.keys()])]
}
/** 输出 Variable 引用及来源 fallback，并按完整当前条件补充其自身状态声明。 */
export function compileVariableReference(reference: Variable, context: ValueContext): string {
  const definition = variableDefinition(reference)
  const fallback = readValue(definition.source, context)
  const states = resolveStateConditions(stateNames(reference))
  if (states.length) {
    const current = states.findLast((state) => context.conditions?.includes(state.name))
    const currentText = current && definition.states.has(current.name)
      ? readValue(definition.states.get(current.name), context) : fallback
    const values: ValueResult[] = currentText === undefined ? [] : [{ conditions: context.conditions ?? [], text: currentText }]
    // 同一 Variable 的交集保证中央优先级不被选择器特异性反转。
    const combinations: string[][] = [[]]
    for (const { name } of states) combinations.push(...combinations.map((names) => [...names, name]))
    combinations.sort((left, right) => left.length - right.length)
    for (const names of combinations.slice(1)) {
      const active = resolveStateConditions([...(context.conditions ?? []), ...names])
      const selected = active.findLast(({ name }) => states.some((state) => state.name === name))!
      const content = definition.states.has(selected.name) ? definition.states.get(selected.name) : definition.source
      const text = readValue(content, { ...context, conditions: active.map((state) => state.name) })
      if (text !== undefined) values.push({ conditions: active.map((state) => state.name), text })
    }
    context.defineVariable(reference.name, values, context)
  }
  return fallback === undefined ? `var(--${reference.name})` : `var(--${reference.name}, ${fallback})`
}
/** 编译 Variable 的局部赋值；条件覆盖与当前消费条件共同约束输出。 */
export function compileVariableDeclaration(input: VariableInput, context: ValueContext): ValueResult[] {
  if (!Array.isArray(input)) return compileValue(input, context)
  return input.flatMap(([name, content]) => compileValue(content, {
    ...context, conditions: [...(context.conditions ?? []), ...(name === undefined ? [] : [name])],
  }))
}
