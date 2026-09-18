/** Rule 登记与所有权句柄。 */
import { condition, type ConditionInput, type ConditionPath } from './css-condition'
import { findSubjectCondition, resolveSubjectConditions } from '../subject-conditions'
import { isCSSKey, type CSSKey } from './css-key'
import { isCSSPair, type Declaration } from './css-declaration'
import type { ValueInput } from './css-value'
import { registerRule } from './css-root'

/** `[Condition Path, CSS Key]` 二项目标地址。 */
export type RuleAddress = [ConditionPath | undefined, CSSKey | undefined]

/** Rule 地址中的内容。 */
export type RuleValue = ValueInput | Declaration<unknown>

/** 一条待编译配置。 */
export type Rule = [RuleAddress, RuleValue]

/** 按登记顺序保存的 Rule 账本。 */
export type Rules = Map<RuleAddress, RuleValue>

/** `rules()` 与 Mixin 共用的嵌套声明组合。 */
export type Declarations = (Declaration<unknown> | Declarations | undefined)[]

/** 一次登记的所有权句柄。 */
export interface RulesHandle {
  /** 删除本次登记仍拥有的条目。 */
  remove(): void
}

/** 单条 Rule 句柄。 */
export interface RuleHandle extends RulesHandle {
  /** 更新当前条目；句柄失效时抛错。 */
  replace(value: RuleValue): void
}

/** 保留普通地址，并将已安装名称归一为 Subject Condition。 */
function rulePath(input: ConditionInput): ConditionPath | undefined {
  if (input === undefined) return undefined
  const ordinary: ConditionPath = []
  const subjects: string[] = []
  for (const item of Array.isArray(input) ? input : [input]) {
    if (typeof item !== 'string') ordinary.push(item)
    else if (findSubjectCondition(item)) subjects.push(item)
    else ordinary.push(condition(item))
  }
  const path = [...ordinary, ...resolveSubjectConditions(subjects).map((definition) => definition.condition)]
  if (path.some((item) => !item || typeof item.header !== 'string')) {
    throw new Error('Rule 的 Condition Path 必须由有效 Condition 组成。')
  }
  return path
}

/** 登记单条 Rule；同址后写覆盖，句柄只控制本次写入。 */
export function rule(path: ConditionInput, key: CSSKey | undefined, input: RuleValue): RuleHandle {
  if (input === undefined) throw new Error('rule() 必须明确提供 Value。')
  if (key !== undefined && !isCSSKey(key)) throw new Error('rule() 必须提供有效 CSSKey。')
  return registerRule([[rulePath(path), key], input])
}

/** 展开并批量登记声明；跳过空项与无 content 声明，无效输入使整批失败。 */
export function rules(path: ConditionInput, declarations: Declarations): RulesHandle {
  const conditionPath = rulePath(path)
  const entries: Rule[] = []
  const visiting = new Set<Declarations>()
  /** 收集一组声明；形状错误或递归引用时抛错。 */
  const visit = (group: Declarations): void => {
    if (!Array.isArray(group)) throw new Error('rules() 必须提供声明数组。')
    if (visiting.has(group)) throw new Error('rules() 的声明分组存在递归引用。')
    visiting.add(group)
    for (const entry of group) {
      if (entry === undefined) continue
      if (isCSSPair(entry)) {
        if (entry[1] === undefined) continue
        entries.push([[conditionPath, entry[0]], entry])
      } else if (Array.isArray(entry)) visit(entry as Declarations)
      else throw new Error('rules() 只接受声明二元数组或嵌套声明分组。')
    }
    visiting.delete(group)
  }
  visit(declarations)
  const handles = entries.map((entry) => registerRule(entry))
  return {
    /** 删除本批仍拥有的条目。 */
    remove() { for (const handle of handles) handle.remove() },
  }
}
