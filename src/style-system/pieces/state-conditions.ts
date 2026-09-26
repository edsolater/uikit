/** 集中登记 State Condition 的名称、已有条件与嵌套顺序。 */
import type { Condition } from '../condition'
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
  if (!name.trim() || name === 'default') throw new Error('State Condition 名称不能为空或 default。')
  if (definitions.has(name)) throw new Error(`State Condition 名称已登记：${name}。`)
  // 状态只约束当前主体，附加条件归零权重，使中央顺序直接决定同一变量的状态优先级。
  const header = condition.header
  const normalized = header.startsWith('&') && header.length > 1 ? { header: `&:where(${header.slice(1)})` } : condition
  const definition = { name, condition: normalized, order: definitions.size }
  definitions.set(name, definition)
  return definition
}

/** 取得已安装的 State Condition；未安装名称不接管普通 CSS 地址。 */
export function findStateCondition(name: string): StateCondition | undefined {
  return definitions.get(name)
}

/** 按名称去重并按中央顺序取得定义；未知名称终止编译。 */
export function resolveStateConditions(names: string[]): StateCondition[] {
  return [...new Set(names)].map((name) => {
    const definition = definitions.get(name)
    if (!definition) throw new Error(`未知 State Condition：${name}。`)
    return definition
  }).sort((left, right) => left.order - right.order)
}

stateCondition('focus', whenFocusVisible)
stateCondition('focusWithin', whenFocusWithin)
stateCondition('focusVisible', whenFocusVisible)
stateCondition('hover', whenHover)
stateCondition('active', whenActive)
stateCondition('disabled', whenDisabled)
