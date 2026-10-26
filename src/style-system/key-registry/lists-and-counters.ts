/**
 * CSS lists-and-counters 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- counter 属性族 ---

export const $counterIncrement = key('counter-increment')

export const $counterReset = key('counter-reset')

export const $counterSet = key('counter-set')

// --- list 属性族 ---

export const $listStyle = key('list-style')

export const $listStyleImage = key('list-style-image')

export const $listStylePosition = key('list-style-position')

export const $listStyleType = key('list-style-type')

/** lists-and-counters 模块的 CSS 原名与具名 Key 对应表。 */
export const listsAndCountersKeys = {
  'counter-increment': $counterIncrement,
  'counter-reset': $counterReset,
  'counter-set': $counterSet,
  'list-style': $listStyle,
  'list-style-image': $listStyleImage,
  'list-style-position': $listStylePosition,
  'list-style-type': $listStyleType,
}
