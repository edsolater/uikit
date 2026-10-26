/**
 * CSS display 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- display 属性族 ---

/** display Key，选择元素的内部布局类型及外部显示角色。 */
export const $display = key('display')

// --- order 属性族 ---

export const $order = key('order')

// --- reading-flow 属性族 ---

export const $readingFlow = key('reading-flow')

// --- reading-order 属性族 ---

export const $readingOrder = key('reading-order')

// --- visibility 属性族 ---

export const $visibility = key('visibility')

/** display 模块的 CSS 原名与具名 Key 对应表。 */
export const displayKeys = {
  'display': $display,
  'order': $order,
  'reading-flow': $readingFlow,
  'reading-order': $readingOrder,
  'visibility': $visibility,
}
