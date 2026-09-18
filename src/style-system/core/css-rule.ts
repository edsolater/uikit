/** Rule 登记与声明组合。 */
import { condition, type Condition, type ConditionInput } from './css-condition'
import { findSubjectCondition } from '../subject-conditions'
import { isCSSKey, type CSSKey } from './css-key'
import { isCSSPair, type Declaration } from './css-declaration'
import type { ValueInput } from './css-value'
import type { VariableOverrides } from './css-variable'
import { registerRule } from './css-root'

/** 待编译内容或嵌套规则。 */
export type RuleValue = ValueInput | Rules | VariableOverrides

/** 路径、目标与内容；路径中的字符串是主体条件名称，空项沿用外层。 */
export type Rule = [path: (Condition | string)[] | undefined, key: CSSKey | undefined, content: RuleValue]

/** 按声明顺序保存的规则。 */
export type Rules = Rule[]

/** Mixin 与批量登记共用的声明组合。 */
export type Declarations = (Declaration<RuleValue> | Declarations | undefined)[]

/** 本次登记的删除入口。 */
export interface RulesHandle {
  /** 删除本次登记。 */
  remove(): void
}

/** 单条登记的更新入口。 */
export interface RuleHandle extends RulesHandle {
  /** 原位更新；删除后调用报错。 */
  replace(value: RuleValue): void
}

/** 普通地址保留 header，主体条件保留名称身份。 */
function rulePath(input: ConditionInput): (Condition | string)[] | undefined {
  if (input === undefined) return undefined
  const path: (Condition | string)[] = []
  for (const item of Array.isArray(input) ? input : [input]) {
    if (typeof item !== 'string' || findSubjectCondition(item)) path.push(item)
    else path.push(condition(item))
  }
  if (path.some((item) => !item || (typeof item !== 'string' && typeof item.header !== 'string'))) {
    throw new Error('Rule 的 Condition Path 必须由有效 Condition 组成。')
  }
  return path
}

/** 登记一条规则；undefined 内容不输出。 */
export function rule(path: ConditionInput, key: CSSKey | undefined, input: RuleValue): RuleHandle {
  if (key !== undefined && !isCSSKey(key)) throw new Error('rule() 必须提供有效 CSSKey。')
  return registerRule([rulePath(path), key, input])
}

/** 批量登记声明；无效分组整批拒绝，undefined 内容跳过。 */
export function rules(path: ConditionInput, declarations: Declarations): RulesHandle {
  const conditionPath = rulePath(path)
  const entries: Rule[] = []
  const visiting = new Set<Declarations>()
  /** 收集有效声明，拒绝递归分组。 */
  const visit = (group: Declarations): void => {
    if (!Array.isArray(group)) throw new Error('rules() 必须提供声明数组。')
    if (visiting.has(group)) throw new Error('rules() 的声明分组存在递归引用。')
    visiting.add(group)
    for (const entry of group) {
      if (entry === undefined) continue
      if (isCSSPair(entry)) {
        if (entry[1] !== undefined) entries.push([conditionPath, entry[0], entry[1] as RuleValue])
      } else if (Array.isArray(entry)) visit(entry as Declarations)
      else throw new Error('rules() 只接受声明二元数组或嵌套声明分组。')
    }
    visiting.delete(group)
  }
  visit(declarations)
  const handles = entries.map((entry) => registerRule(entry))
  return {
    /** 删除本批登记。 */
    remove() { for (const handle of handles) handle.remove() },
  }
}
