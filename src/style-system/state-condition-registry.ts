/** 状态快捷名静态对应现成条件，查找不改变 CSS 或声明顺序。 */
import { isString, assert } from '@edsolater/fnkit'
import type { StateCondition, StateConditionInput } from './state-condition'
import { interactionStateConditions } from './pieces/conditions/interaction'
import { profileStateConditions } from './pieces/conditions/profile'
import { environmentStateConditions } from './pieces/conditions/environment'

/** 预置状态快捷名与条件对象的静态对应表。 */
export const stateConditionRegistry: Record<string, StateCondition> =
  Object.assign(Object.create(null), {
    ...interactionStateConditions,
    ...profileStateConditions,
    ...environmentStateConditions,
  })

/** Token 参数入口只把已登记字符串换成对应对象，对象直接通过。 */
export function resolveStateCondition(
  input: StateConditionInput,
): StateCondition {
  if (!isString(input)) return input
  assert(
    Object.hasOwn(stateConditionRegistry, input),
    'State Condition 快捷名未登记：' + input + '。',
  )
  return stateConditionRegistry[input]
}
