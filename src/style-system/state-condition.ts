/** 独立主体状态条件；局部创建不登记快捷名。 */
import { hasProperty, isObject, isString } from '@edsolater/fnkit'
import { condition, type Condition } from './condition'

/** 字符串只表达已登记快捷名；原始 CSS 使用 StateCondition 对象。 */
export type StateConditionInput = string | StateCondition

/** 状态与地址都描述一个 CSS 条件，使用位置决定其职责。 */
export type StateCondition = Condition

/** 创建局部主体条件，不要求全局名称；CSS 表达保留在条件结构内。 */
export function stateCondition(input: string | Condition): StateCondition {
  return isString(input) ? condition(input) : input
}

/** 识别主体状态条件，供参数与地址入口保留对象身份。 */
export const isStateCondition = (input: unknown): input is StateCondition =>
  isObject(input) && hasProperty(input, 'header', isString)
