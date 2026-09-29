/** Rule 登记与声明组合。 */
import { assert, isString } from '@edsolater/fnkit'
import { condition, type Condition, type ConditionInput } from './condition'
import { hasStateCondition } from './pieces/state-conditions'
import { isJSSKey, resolveJSSKey, type JSSKey } from './key'
import { isCSSPair, type Declaration } from './declaration'
import type { ValueInput } from './value'
import { registerRule } from './css-root'

/** 待编译内容或嵌套规则。 */
export type RuleValue = ValueInput | Rules

/** 路径、目标与内容；路径中的字符串是主体条件名称，空项沿用外层。 */
export type Rule = [path: (Condition | string)[] | undefined, key: JSSKey | undefined, content: RuleValue]

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

/** 把普通 CSS 地址字符串表示为 Condition，保留已登记的状态名和现成的 Condition。
 * `'.Button'` → `{ header: '.Button' }`。
 * 已登记的 `'hover'` → 原字符串。
 * 传入 Condition → 原对象。
 * 此处只区分路径成员，不校验路径是否有效。
 */
function resolvePathCondition(item: Condition | string): Condition | string {
  if (!isString(item) || hasStateCondition(item)) return item
  return condition(item)
}

/** 检查规则路径成员的形状；符合要求则不改输入，否则抛错。
 * `['hover', condition('.Button')]` 通过，输入不变。
 * 运行时传入 `[undefined]` 会抛错。
 */
function assertValidConditionPath(path: (Condition | string)[]): void {
  assert(
    path.every((item) => item && (isString(item) || isString(item.header))),
    'Rule 的 Condition Path 必须由有效 Condition 组成。',
  )
}

/** 把单项或数组输入整理成规则地址，保留状态名并拒绝不合形状的成员。
 * 已登记 `hover` 时，`['.Button', 'hover']` → `[{ header: '.Button' }, 'hover']`。
 * 运行时传入 `[undefined]` 会抛错。
 * `undefined` 仍返回 `undefined`，表示沿用外层路径。
 */
function rulePath(input: ConditionInput): (Condition | string)[] | undefined {
  if (input === undefined) return undefined
  const path = Array.from(Array.isArray(input) ? input : [input], resolvePathCondition)
  assertValidConditionPath(path)
  return path
}

/** 登记一条规则；undefined 内容不输出。 */
export function rule(path: ConditionInput, key: JSSKey | undefined, input: RuleValue): RuleHandle {
  assert(key === undefined || isJSSKey(key), 'rule() 必须提供有效 JSSKey。')
  return registerRule([rulePath(path), key === undefined ? undefined : resolveJSSKey(key), input])
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
      if (source[1] !== undefined) entries.push([conditionPath, resolveJSSKey(source[0]), source[1] as RuleValue])
      return
    }
    assert(
      isDeclarationObject(source) || isDeclarationIterable(source),
      'rules() 只接受声明序列，条目为 Key／Variable 元组或其 Iterable 组合。',
    )
    assert(!visiting.has(source), 'rules() 的声明输入存在递归引用。')
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
