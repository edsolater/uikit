/**
 * Rule 登记与声明组合。
 *
 * 将多种声明写法统一为有序声明，再交给源账本登记。
 *
 * 让对象和保留目标身份的条目共享相同声明语义。
 */
import {
  assert,
  isFunction,
  isObject,
  isObjectLike,
  isString,
} from '@edsolater/fnkit'
import {
  resolveConditionPath,
  type Condition,
  type ConditionInput,
} from './condition'
import { isJSSKey, resolveJSSKey, type JSSKey } from './key'
import { declare, isCSSPair, type Declaration } from './operations/declare'
import type { TokenInput } from './token/core'
import { registerRule } from './rule-registry'

/** 待编译内容或嵌套规则。 */
export type RuleValue = TokenInput | Rules

/** 路径、目标与内容；字符串是普通 CSS 条件，空项沿用外层。 */
export type Rule = [
  path: (Condition | string)[] | undefined,
  key: JSSKey | undefined,
  content: RuleValue,
]

/** 按声明顺序保存的规则。 */
export type Rules = Rule[]

/** 以字符串名称表达的声明对象。 */
export type DeclarationObject = Record<string, RuleValue>

/** 一条声明、名称对象或嵌套集合；undefined 表示空项。 */
export type DeclarationItem =
  | Readonly<Declaration<RuleValue>>
  | DeclarationObject
  | DeclarationGroup
  | undefined

/** 按输入顺序提供声明条目的通用 Iterable。 */
export type DeclarationGroup = object & Iterable<DeclarationItem>

/** Mixin 提供的可迭代声明集合，可与其他声明输入组合。 */
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

/**
 * 检查规则路径成员的形状；符合要求则不改输入，否则抛错。
 * Condition 已由地址入口归一；校验不改变输入。
 * 运行时传入 `[undefined]` 会抛错。
 */
function assertValidConditionPath(path: Condition[]): void {
  assert(
    path.every((item) => item && isString(item.header)),
    'Rule 的 Condition Path 必须由有效 Condition 组成。',
  )
}

/**
 * 把单项或数组输入整理成普通规则地址，拒绝不合形状的成员。
 * `['.Button', '&:hover']` → 两个普通 Condition。
 * 运行时传入 `[undefined]` 会抛错。
 * `undefined` 仍返回 `undefined`，表示沿用外层路径。
 */
function rulePath(input: ConditionInput): Condition[] | undefined {
  if (input === undefined) return undefined
  const path = resolveConditionPath(input)!
  assertValidConditionPath(path)
  return path
}

/**
 * 登记一条规则；undefined 内容不输出。
 */
export function rule(
  path: ConditionInput,
  key: JSSKey | undefined,
  input: RuleValue,
): RuleHandle {
  assert(key === undefined || isJSSKey(key), 'rule() 必须提供有效 JSSKey。')
  return registerRule([
    rulePath(path),
    key === undefined ? undefined : resolveJSSKey(key),
    input,
  ])
}

/**
 * 识别名称声明对象，不把类实例误当声明集合。
 */
function isDeclarationObject(input: unknown): input is DeclarationObject {
  if (!isObject(input) || isDeclarationIterable(input)) return false
  const prototype = Object.getPrototypeOf(input)
  return prototype === Object.prototype || prototype === null
}

/**
 * 识别标准 Iterable；字符串名称不能作为声明序列逐字展开。
 */
function isDeclarationIterable(input: unknown): input is Iterable<unknown> {
  return (
    isObjectLike(input) &&
    isFunction((input as { [Symbol.iterator]?: unknown })[Symbol.iterator])
  )
}

/**
 * 展开对象与嵌套 Iterable，各条目隐式声明后整批登记；无效输入整批拒绝。
 * 空项和普通属性的 undefined 跳过，Token 的显式 undefined 保留声明身份。
 * 正常 entry 以 CSS 属性或 Key 为目标、Token 为内容；Token 目标仍允许但属于危险重声明。
 */
export function rules(
  path: ConditionInput,
  declarations: DeclarationItem,
): RulesHandle {
  const conditionPath = rulePath(path)
  const entries: Rule[] = []
  const visiting = new Set<object>()
  /**
   * 收集有效声明，拒绝递归输入。
   */
  const visit = (source: unknown): void => {
    if (source === undefined) return
    if (isCSSPair(source)) {
      const [key, content] = declare(source[0], source[1])
      if (content !== undefined)
        entries.push([conditionPath, key, content as RuleValue])
      return
    }
    assert(
      isDeclarationObject(source) || isDeclarationIterable(source),
      'rules() 只接受声明序列，条目为字符串／Key／Token 元组、名称对象或其 Iterable 组合。',
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
    /**
     * 删除本批登记。
     */
    remove() {
      for (const handle of handles) handle.remove()
    },
  }
}
