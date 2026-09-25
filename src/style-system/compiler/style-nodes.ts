/** 保存规则改写前的声明节点与改写后的可输出节点。 */
import type { ConditionPath } from '../condition'
import type { CSSKey } from '../css-key'
import type { StateCondition } from '../materials/state-conditions'
import type { RewriteRuleContent } from '../rule'
import type { ValueInput } from '../value'

/** 不经 Value 求值也能输出 CSS 内容的对象。 */
export interface CSSOutputContent {
  toCSSString(): string
}

/** 普通地址与当前受体状态分开保存的一项声明。 */
export interface ContentStyleNode {
  kind: 'content'
  conditionPath: ConditionPath
  stateConditionPath: StateCondition[]
  key: CSSKey | undefined
  value: ValueInput | CSSOutputContent
}

/** 内容对象拥有改写方法的特殊规则节点。 */
export interface RewriteStyleNode {
  kind: 'rewrite'
  conditionPath: ConditionPath
  stateConditionPath: StateCondition[]
  key: CSSKey | undefined
  value: RewriteRuleContent
}

/** 保留来源顺序的待改写节点队列。 */
export type StyleNode = ContentStyleNode | RewriteStyleNode

/** 状态已并入地址、内容可直接输出的一项声明。 */
export interface ParsedStyleNode {
  conditionPath: ConditionPath
  key: string | undefined
  value: string | CSSOutputContent
}

/** 识别直接输出 CSS 的内容对象。 */
export function isCSSOutputContent(input: unknown): input is CSSOutputContent {
  return input !== null && typeof input === 'object'
    && 'toCSSString' in input && typeof input.toCSSString === 'function'
}
