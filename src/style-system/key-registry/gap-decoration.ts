/**
 * 间隙分隔线的属性目标。
 *
 * 统一 column-rule、row-rule、rule 的线条、交点、端点和显隐；不接管间距或盒子外框。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $columnRule = key('column-rule')

export const $columnRuleBreak = key('column-rule-break')

export const $columnRuleColor = key('column-rule-color')

export const $columnRuleInsetCap = key('column-rule-inset-cap')

export const $columnRuleInsetCapEnd = key('column-rule-inset-cap-end')

export const $columnRuleInsetCapStart = key('column-rule-inset-cap-start')

export const $columnRuleInsetJunction = key('column-rule-inset-junction')

export const $columnRuleInsetJunctionEnd = key('column-rule-inset-junction-end')

export const $columnRuleStyle = key('column-rule-style')

export const $columnRuleVisibilityItems = key('column-rule-visibility-items')

export const $columnRuleWidth = key('column-rule-width')

export const $rowRule = key('row-rule')

export const $rowRuleBreak = key('row-rule-break')

export const $rowRuleColor = key('row-rule-color')

export const $rowRuleInsetCap = key('row-rule-inset-cap')

export const $rowRuleInsetCapEnd = key('row-rule-inset-cap-end')

export const $rowRuleInsetCapStart = key('row-rule-inset-cap-start')

export const $rowRuleInsetJunction = key('row-rule-inset-junction')

export const $rowRuleStyle = key('row-rule-style')

export const $rowRuleVisibilityItems = key('row-rule-visibility-items')

export const $rowRuleWidth = key('row-rule-width')

export const $rule = key('rule')

export const $ruleBreak = key('rule-break')

export const $ruleColor = key('rule-color')

export const $ruleInsetCap = key('rule-inset-cap')

export const $ruleInsetJunction = key('rule-inset-junction')

export const $ruleOverlap = key('rule-overlap')

export const $ruleStyle = key('rule-style')

export const $ruleVisibilityItems = key('rule-visibility-items')

export const $ruleWidth = key('rule-width')

/** 间隙分隔线的 CSS 原名与具名 Key 对应表。 */
export const gapDecorationKeys = {
  'column-rule': $columnRule,
  'column-rule-break': $columnRuleBreak,
  'column-rule-color': $columnRuleColor,
  'column-rule-inset-cap': $columnRuleInsetCap,
  'column-rule-inset-cap-end': $columnRuleInsetCapEnd,
  'column-rule-inset-cap-start': $columnRuleInsetCapStart,
  'column-rule-inset-junction': $columnRuleInsetJunction,
  'column-rule-inset-junction-end': $columnRuleInsetJunctionEnd,
  'column-rule-style': $columnRuleStyle,
  'column-rule-visibility-items': $columnRuleVisibilityItems,
  'column-rule-width': $columnRuleWidth,
  'row-rule': $rowRule,
  'row-rule-break': $rowRuleBreak,
  'row-rule-color': $rowRuleColor,
  'row-rule-inset-cap': $rowRuleInsetCap,
  'row-rule-inset-cap-end': $rowRuleInsetCapEnd,
  'row-rule-inset-cap-start': $rowRuleInsetCapStart,
  'row-rule-inset-junction': $rowRuleInsetJunction,
  'row-rule-style': $rowRuleStyle,
  'row-rule-visibility-items': $rowRuleVisibilityItems,
  'row-rule-width': $rowRuleWidth,
  'rule': $rule,
  'rule-break': $ruleBreak,
  'rule-color': $ruleColor,
  'rule-inset-cap': $ruleInsetCap,
  'rule-inset-junction': $ruleInsetJunction,
  'rule-overlap': $ruleOverlap,
  'rule-style': $ruleStyle,
  'rule-visibility-items': $ruleVisibilityItems,
  'rule-width': $ruleWidth,
}
