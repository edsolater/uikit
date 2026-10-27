/**
 * 组件分类的共享 Condition。
 *
 * 只匹配公共 data 属性，不规定组件配方、默认分类或交互策略。
 * 组件仍可用 condition() 定义自己的分类条件，无须注册 Profile。
 */
import { stateCondition } from '../../state-condition'

// 外观。
export const whenFilled = stateCondition('&[data-appearance="filled"]')
export const whenOutlined = stateCondition('&[data-appearance="outlined"]')
export const whenPlain = stateCondition('&[data-appearance="plain"]')

// 语气；存在性与具体取值分别表达。
export const whenToned = stateCondition('&[data-tone]')
export const whenDanger = stateCondition('&[data-tone="danger"]')

// 存在感；是否受禁用影响由消费组件决定。
export const whenSoft = stateCondition('&[data-emphasis="soft"]')
export const whenStrong = stateCondition('&[data-emphasis="strong"]')

// 尺寸；缺省属性不额外解释成某个分类值。
export const whenSmall = stateCondition('&[data-size="small"]')
export const whenLarge = stateCondition('&[data-size="large"]')
export const whenXlarge = stateCondition('&[data-size="xlarge"]')

/** 组件分类快捷名只对应已有条件，不携带默认取值。 */
export const profileStateConditions = {
  filled: whenFilled,
  outlined: whenOutlined,
  plain: whenPlain,
  toned: whenToned,
  danger: whenDanger,
  soft: whenSoft,
  strong: whenStrong,
  small: whenSmall,
  large: whenLarge,
  xlarge: whenXlarge,
}
