/** Rule 登记与声明组合。 */
import { condition, type Condition, type ConditionInput } from './condition'
import { findStateCondition } from './materials/state-conditions'
import { isCSSKey, resolveCSSKey, type CSSKey } from './css-key'
import { isCSSPair, type Declaration } from './declaration'
import type { ValueInput } from './value'
import type { VariableOverrides } from './variable'
import { registerRule } from './css-root'
import type { RewriteStyleNode, StyleNode, CSSOutputContent } from './compiler/style-nodes'

/** 改写 Rule 对当前节点队列作一次同步修改。 */
export interface RewriteRuleContent {
  rewriteStyleNodes(nodes: StyleNode[], index: number, node: RewriteStyleNode): void
}

/** 待编译内容或嵌套规则。 */
export type RuleValue = ValueInput | Rules | VariableOverrides | CSSOutputContent | RewriteRuleContent

/** 路径、目标与内容；路径中的字符串是主体条件名称，空项沿用外层。 */
export type Rule = [path: (Condition | string)[] | undefined, key: CSSKey | undefined, content: RuleValue]

/** 按声明顺序保存的规则。 */
export type Rules = Rule[]

/** 以字符串名称表达的声明对象。 */
type DeclarationObject = Record<string, RuleValue>

/** 声明序列中的单项；可继续嵌套声明 Iterable。 */
export type DeclarationItem = Declaration<RuleValue> | DeclarationGroup | undefined

/** 按输入顺序提供声明条目的通用 Iterable。 */
export type DeclarationGroup = object & Iterable<DeclarationItem>

/** Mixin 与批量登记共用的声明输入。 */
export type Declarations = DeclarationGroup

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
    if (typeof item !== 'string' || findStateCondition(item)) path.push(item)
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
  return registerRule([rulePath(path), key === undefined ? undefined : resolveCSSKey(key), input])
}

/** 识别名称声明对象，不把类实例误当声明集合。 */
function isDeclarationObject(input: unknown): input is DeclarationObject {
  if (typeof input !== 'object' || input === null || isDeclarationIterable(input)) return false
  const prototype = Object.getPrototypeOf(input)
  return prototype === Object.prototype || prototype === null
}

/** 识别标准 Iterable；字符串名称不能作为声明序列逐字展开。 */
function isDeclarationIterable(input: unknown): input is Iterable<unknown> {
  if ((typeof input !== 'object' || input === null) && typeof input !== 'function') return false
  return typeof (input as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function'
}

/** 批量登记声明；无效输入整批拒绝，undefined 内容跳过。 */
export function rules(path: ConditionInput, declarations: Declarations): RulesHandle {
  const conditionPath = rulePath(path)
  const entries: Rule[] = []
  const visiting = new Set<object>()
  /** 收集有效声明，拒绝递归输入。 */
  const visit = (source: unknown): void => {
    if (source === undefined) return
    if (isCSSPair(source)) {
      if (source[1] !== undefined) entries.push([conditionPath, resolveCSSKey(source[0]), source[1] as RuleValue])
      return
    }
    if (!isDeclarationObject(source) && !isDeclarationIterable(source)) {
      throw new Error('rules() 只接受声明序列，条目为 Key／Variable 元组或其 Iterable 组合。')
    }
    if (visiting.has(source)) throw new Error('rules() 的声明输入存在递归引用。')
    visiting.add(source)
    try {
      if (isDeclarationObject(source)) {
        for (const entry of Object.entries(source)) visit(entry)
      } else {
        for (const entry of source) visit(entry)
      }
    } finally {
      visiting.delete(source)
    }
  }
  visit(declarations)
  const handles = entries.map((entry) => registerRule(entry))
  return {
    /** 删除本批登记。 */
    remove() { for (const handle of handles) handle.remove() },
  }
}
