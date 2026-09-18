/** 集中登记 Subject Condition 的名称、已有条件与嵌套顺序。 */
import type { Condition } from './core/css-condition'
import { whenActive, whenDisabled, whenFocus, whenFocusVisible, whenFocusWithin, whenHover } from './selectors/interaction'

/** 定义者承诺条件始终约束当前主体，且与其他 Subject Condition 可交换。 */
export interface SubjectCondition {
  name: string
  condition: Condition
  order: number
}

const definitions = new Map<string, SubjectCondition>()

/** 登记固定名称，登记次序即嵌套顺序；空名称、default 与重复名称报错。 */
export function subjectCondition(name: string, condition: Condition): SubjectCondition {
  if (!name.trim() || name === 'default') throw new Error('Subject Condition 名称不能为空或 default。')
  if (definitions.has(name)) throw new Error(`Subject Condition 名称已登记：${name}。`)
  const definition = { name, condition, order: definitions.size }
  definitions.set(name, definition)
  return definition
}

/** 取得已安装的 Subject Condition；未安装名称不接管普通 CSS 地址。 */
export function findSubjectCondition(name: string): SubjectCondition | undefined {
  return definitions.get(name)
}

/** 按名称去重并按中央顺序取得定义；未知名称终止编译。 */
export function resolveSubjectConditions(names: string[]): SubjectCondition[] {
  return [...new Set(names)].map((name) => {
    const definition = definitions.get(name)
    if (!definition) throw new Error(`未知 Subject Condition：${name}。`)
    return definition
  }).sort((left, right) => left.order - right.order)
}

subjectCondition('focus', whenFocus)
subjectCondition('focusWithin', whenFocusWithin)
subjectCondition('focusVisible', whenFocusVisible)
subjectCondition('hover', whenHover)
subjectCondition('active', whenActive)
subjectCondition('disabled', whenDisabled)
