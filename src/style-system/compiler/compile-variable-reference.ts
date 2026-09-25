/** Variable 引用、来源链与自身状态声明。 */
import { isVariableSourceFunction, variableDefinition, type Variable, type VariableSource } from '../variable'
import { resolveStateConditions } from '../materials/state-conditions'
import { readValue, type ValueContext, type StateValueText } from './compile-value'

/** 只收集延伸链上的状态，不遍历普通值依赖。 */
function collectVariableStateNames(reference: Variable): string[] {
  const definition = variableDefinition(reference)
  return [...new Set([...(definition.inherited ? collectVariableStateNames(definition.inherited) : []), ...definition.states.keys()])]
}
/** source 函数只由 Variable 编译执行；返回结果继续走统一 ValueInput 读取。 */
function readVariableSource(source: VariableSource) {
  return isVariableSourceFunction(source) ? source() : source
}
/** 输出 Variable 引用及来源 fallback，并在显式消费作用域补充线性的自身状态声明。 */
export function compileVariableReference(reference: Variable, context: ValueContext): string {
  const definition = variableDefinition(reference)
  const source = readVariableSource(definition.source)
  const fallback = readValue(source, context)
  const availableStates = resolveStateConditions(collectVariableStateNames(reference))
  if (availableStates.length) {
    context.defineVariable(reference, context, (scope) => {
      const activeState = availableStates.findLast((state) => scope.stateNames?.includes(state.name))
      const activeValueText = activeState && definition.states.has(activeState.name)
        ? readValue(definition.states.get(activeState.name), scope) : fallback
      const stateValues: StateValueText[] = activeValueText === undefined ? [] : [{ stateNames: scope.stateNames ?? [], text: activeValueText }]
      for (const state of availableStates) {
        if (activeState && state.order <= activeState.order) continue
        const statePath = resolveStateConditions([...(scope.stateNames ?? []), state.name])
        const stateContent = definition.states.has(state.name) ? definition.states.get(state.name) : source
        const text = readValue(stateContent, { ...scope, stateNames: statePath.map((state) => state.name) })
        if (text !== undefined) stateValues.push({ stateNames: statePath.map((state) => state.name), text })
      }
      return stateValues
    })
  }
  return fallback === undefined ? `var(--${reference.name})` : `var(--${reference.name}, ${fallback})`
}
