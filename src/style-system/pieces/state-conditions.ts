/** 集中登记 State Condition 的名称、已有条件与嵌套顺序。 */
import { assert } from '@edsolater/fnkit'
import { condition, type Condition, type ConditionPath } from '../condition'
import { whenActive, whenDisabled, whenFocusVisible, whenFocusWithin, whenHover } from './conditions/interaction'

/** 定义者承诺条件始终约束当前主体，且与其他 State Condition 可交换。 */
export interface StateCondition {
  name: string
  condition: Condition
  order: number
}

const definitions = new Map<string, StateCondition>()

/** 登记固定名称，登记次序即嵌套顺序；空名称、default 与重复名称报错。 */
export function stateCondition(name: string, condition: Condition): StateCondition {
  assert(!!name.trim() && name !== 'default', 'State Condition 名称不能为空或 default。')
  assert(!definitions.has(name), `State Condition 名称已登记：${name}。`)
  // 状态只约束当前主体，附加条件归零权重，使中央顺序直接决定同一变量的状态优先级。
  const header = condition.header
  const normalized = header.startsWith('&') && header.length > 1 ? { header: `&:where(${header.slice(1)})` } : condition
  const definition = { name, condition: normalized, order: definitions.size }
  definitions.set(name, definition)
  return definition
}

/** 判断名称是否已登记为主体状态。
 * 内置的 `'hover'` → `true`。
 * 未登记的 `'unknownState'` → `false`。
 */
export function hasStateCondition(name: string): boolean {
  return definitions.has(name)
}

/** 创建配方时展开登记的快捷名称；其余条件原样保留，排在快捷条件之后。 */
export function resolveStateConditions(names: string[]): StateCondition[] {
  return [...new Set(names)].map((name) => definitions.get(name) ?? {
    name,
    condition: condition(name),
    order: definitions.size + names.indexOf(name),
  }).sort((left, right) => left.order - right.order)
}

/** 在原路径后接一个状态，并按登记顺序排列输出条件。 */
export function appendStateCondition(path: ConditionPath, state: StateCondition): ConditionPath {
  const states = new Map(path.stateConditionPath.map((current) => [current.name, current]))
  states.set(state.name, state)
  return {
    semanticPath: [
      ...(path.semanticPath ?? [
        ...path.targetConditionPath,
        ...path.stateConditionPath.map((state) => state.name),
      ]),
      state.name,
    ],
    targetConditionPath: [...path.targetConditionPath],
    stateConditionPath: [...states.values()].sort((left, right) => left.order - right.order),
  }
}

stateCondition('focus', whenFocusVisible)
stateCondition('focusWithin', whenFocusWithin)
stateCondition('focusVisible', whenFocusVisible)
stateCondition('hover', whenHover)
stateCondition('active', whenActive)
stateCondition('disabled', whenDisabled)
