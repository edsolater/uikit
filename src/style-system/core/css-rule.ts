/** 把 Condition Path、CSS Property 与 Value 登记为待编译 Rule，并为单项或批量写入提供所有权句柄。 */
import { toConditionPath, type ConditionInput, type ConditionPath } from './css-condition'
import type { CSSProperty } from './css-key'
import type { Declaration } from './css-declaration'
import type { ValueInput } from './css-value'
import { registerRule } from './css-root'

/**
 * 一条 Rule 的二项目标地址：条件路径选择 CSS 嵌套位置，属性选择该位置中的声明左侧；两项均可继承当前位置。
 * @example [[condition('.Button')], 'color'] // 表示 .Button 中的 color 位置。
 */
export type RuleAddress = [ConditionPath | undefined, CSSProperty | undefined]

/** Rule 地址上保存的尚未编译内容，可为 Value 或带属性语法的 Declaration。 */
export type RuleValue = ValueInput | Declaration<string, unknown>

/** 一条待编译样式配置，由目标地址和该地址的内容组成。 */
export type Rule = [RuleAddress, RuleValue]

/** 按登记顺序保存多条 Rule 的账本；它也可作为嵌套 Value 或按需依赖继续被编译。 */
export type Rules = Map<RuleAddress, RuleValue>

/** rules() 接受的批量内容：Declaration、属性值对以及嵌套的同类分组。 */
export type RuleDeclarations = (Declaration<string, unknown> | [CSSProperty, ValueInput] | RuleDeclarations)[]

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

/** 区分属性值对与嵌套分组；只检验 CSSProperty 的结构，不校验浏览器支持的属性名。 */
function isProperty(input: unknown): input is CSSProperty {
  return typeof input === 'string' || (input !== null && typeof input === 'object'
    && 'name' in input && typeof input.name === 'string'
    && (!('kind' in input) || input.kind === 'value'))
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
 * 未提供值，或属性、路径结构无效时抛错；返回句柄只能更新或删除仍由本次登记拥有的条目。
 * @example
 * const handle = rule('.Button', 'color', 'red')
 * handle.replace('blue') // 下一次 compileCSS() 生成 color: blue。
 * handle.remove() // 下一次编译不再包含本条写入。
 */
export function rule(path: ConditionInput, property: CSSProperty | undefined, input: RuleValue): RuleHandle {
  if (input === undefined) throw new Error('rule() 必须明确提供 Value。')
  if (property !== undefined && !isProperty(property)) throw new Error('rule() 必须提供有效 CSSProperty。')
  return registerRule([[rulePath(path), property], input])
}

/**
 * 按输入顺序展开 Declaration、属性值对和嵌套分组，全部校验通过后批量登记，不编译或提交 CSS。
 * 无效条目或递归分组使整批登记失败，不留下半批写入；返回句柄批量删除仍由本次写入拥有的条目。
 * @example
 * const handle = rules('.Button', [['color', 'red'], [padding('8px')]])
 * // 下一次编译包含 color: red 和四个方向的 padding: 8px。
 * handle.remove() // 删除这批登记，不删除其他调用后来写入的同址条目。
 */
export function rules(path: ConditionInput, declarations: RuleDeclarations): RulesHandle {
  const conditionPath = rulePath(path)
  const entries: Rule[] = []
  const visiting = new Set<RuleDeclarations>()
  /**
   * 按深度优先的输入顺序把当前分组写入 entries；只收集待登记条目，不触碰 CSSRoot。
   * 形状错误或当前链重入同一分组时抛错，调用方必须放弃整批 entries。
   * @example
   * visit([['color', 'red'], [['opacity', 0.5]]])
   * // entries 依次增加当前 conditionPath 下的 color、opacity 两条 Rule。
   */
  const visit = (group: RuleDeclarations): void => {
    if (!Array.isArray(group)) throw new Error('rules() 必须提供声明数组。')
    if (visiting.has(group)) throw new Error('rules() 的声明分组存在递归引用。')
    visiting.add(group)
    for (const entry of group) {
      if (Array.isArray(entry)) {
        const first = entry[0]
        if (isProperty(first)) {
          if (entry.length !== 2 || entry[1] === undefined) throw new Error('rules() 的属性条目必须是 [CSSProperty, Value]。')
          entries.push([[conditionPath, first], entry[1] as ValueInput])
        } else visit(entry as RuleDeclarations)
      } else if (entry !== null && typeof entry === 'object' && entry.kind === 'declaration' && isProperty(entry.property) && entry.content !== undefined) {
        entries.push([[conditionPath, entry.property], entry])
      } else throw new Error('rules() 只接受 Declaration、属性值对或嵌套声明分组。')
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
