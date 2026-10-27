/**
 * 组件分类的共享 Condition。
 *
 * 只匹配公共 data 属性，不规定组件配方、默认分类或交互策略。
 * 组件仍可用 condition() 定义自己的分类条件，无须注册 Profile。
 */
import { condition } from '../../condition'

// 外观。
export const whenFilled = condition('&[data-appearance="filled"]')
export const whenOutlined = condition('&[data-appearance="outlined"]')
export const whenPlain = condition('&[data-appearance="plain"]')

// 语气；存在性与具体取值分别表达。
export const whenToned = condition('&[data-tone]')
export const whenDanger = condition('&[data-tone="danger"]')

// 存在感；是否受禁用影响由消费组件决定。
export const whenSoft = condition('&[data-emphasis="soft"]')
export const whenStrong = condition('&[data-emphasis="strong"]')

// 尺寸；缺省属性不额外解释成某个分类值。
export const whenSmall = condition('&[data-size="small"]')
export const whenLarge = condition('&[data-size="large"]')
export const whenXlarge = condition('&[data-size="xlarge"]')
