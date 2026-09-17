/** 把 Condition Path、CSS Key 与 Value 登记为待编译 Rule，并为单项或批量写入提供所有权句柄。 */
import { toConditionPath, type ConditionInput, type ConditionPath } from './css-condition'
import { isCSSKey, type CSSKey } from './css-key'
import { isCSSPair, type Declaration } from './css-declaration'
import type { ValueInput } from './css-value'
import { registerRule } from './css-root'

/**
 * 一条 Rule 的二项目标地址：条件路径选择 CSS 嵌套位置，Key 选择该位置中的声明左侧；两项均可继承当前位置。
 * @example [[condition('.Button')], 'color'] // 表示 .Button 中的 color 位置。
 */
export type RuleAddress = [ConditionPath | undefined, CSSKey | undefined]

/** Rule 地址上保存的尚未编译内容，可为 Value 或声明二元数组。 */
export type RuleValue = ValueInput | Declaration<unknown>

/** 一条待编译样式配置，由目标地址和该地址的内容组成。 */
export type Rule = [RuleAddress, RuleValue]

/** 按登记顺序保存多条 Rule 的账本；它也可作为嵌套 Value 或按需依赖继续被编译。 */
export type Rules = Map<RuleAddress, RuleValue>

/** rules() 与 Mixin 共用的声明组合；可嵌套，空项或 content 为 undefined 的 Declaration 不登记 Rule。 */
export type Declarations = (Declaration<unknown> | Declarations | undefined)[]

/** 一次 Rule 登记的控制句柄，只能删除仍由该次登记拥有的条目。 */
export interface RulesHandle {
  /** 删除本次登记仍拥有的条目；不影响后续同址写入，也不立即更新 DOM。 */
  remove(): void
}

/** 单条 Rule 的控制句柄，在删除之外可原位替换该次登记的值。 */
export interface RuleHandle extends RulesHandle {
  /** 原位更新当前条目；句柄失效时抛错，不立即更新 DOM。 */
  replace(value: RuleValue): void
}

/** 归一化并校验登记地址；缺省路径保留 undefined，错误 Condition 在写账本前抛错。 */
function rulePath(input: ConditionInput): ConditionPath | undefined {
  if (input === undefined) return undefined
  const path = toConditionPath(input)
  if (path.some((item) => !item || typeof item.name !== 'string' || typeof item.header !== 'string')) {
    throw new Error('Rule 的 Condition Path 必须由有效 Condition 组成。')
  }
  return path
}

/**
 * 校验地址后将单条 Rule 登记到 CSSRoot；同址后写覆盖前写，不移动首次位置，不编译或提交 CSS。
 * 未提供值，或 Key、路径结构无效时抛错；返回句柄只能更新或删除仍由本次登记拥有的条目。
 * @example
 * const handle = rule('.Button', 'color', 'red')
 * handle.replace('blue') // 下一次 compileCSS() 生成 color: blue。
 * handle.remove() // 下一次编译不再包含本条写入。
 */
export function rule(path: ConditionInput, key: CSSKey | undefined, input: RuleValue): RuleHandle {
  if (input === undefined) throw new Error('rule() 必须明确提供 Value。')
  if (key !== undefined && !isCSSKey(key)) throw new Error('rule() 必须提供有效 CSSKey。')
  return registerRule([[rulePath(path), key], input])
}

/**
 * 按输入顺序展开声明二元数组和嵌套分组，忽略空项及 content 为 undefined 的声明，再批量登记。
 * 无效条目或递归分组使整批登记失败，不留下半批写入；返回句柄批量删除仍由本次写入拥有的条目。
 * @example
 * const handle = rules('.Button', [[$color, 'red'], [[$padding, ['8px']]]])
 * // 下一次编译包含 color: red 和四个方向的 padding: 8px。
 * handle.remove() // 删除这批登记，不删除其他调用后来写入的同址条目。
 */
export function rules(path: ConditionInput, declarations: Declarations): RulesHandle {
  const conditionPath = rulePath(path)
  const entries: Rule[] = []
  const visiting = new Set<Declarations>()
  /**
   * 按深度优先的输入顺序把当前分组写入 entries；只收集待登记条目，不触碰 CSSRoot。
   * 形状错误或当前链重入同一分组时抛错，调用方必须放弃整批 entries。
   * @example
   * visit([[$color, 'red'], [[$opacity, 0.5]]])
   * // entries 依次增加当前 conditionPath 下的 color、opacity 两条 Rule。
   */
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
    /** 按单条句柄的所有权规则删除本批写入；重复调用无影响。 */
    remove() { for (const handle of handles) handle.remove() },
  }
}
