/**
 * CSS mathml 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- math 属性族 ---

export const $mathDepth = key('math-depth')

export const $mathShift = key('math-shift')

export const $mathStyle = key('math-style')

/** mathml 模块的 CSS 原名与具名 Key 对应表。 */
export const mathmlKeys = {
  'math-depth': $mathDepth,
  'math-shift': $mathShift,
  'math-style': $mathStyle,
}
