/**
 * CSS overscroll-behavior 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- overscroll 属性族 ---

export const $overscrollBehavior = key('overscroll-behavior')

export const $overscrollBehaviorBlock = key('overscroll-behavior-block')

export const $overscrollBehaviorInline = key('overscroll-behavior-inline')

export const $overscrollBehaviorX = key('overscroll-behavior-x')

export const $overscrollBehaviorY = key('overscroll-behavior-y')

/** overscroll-behavior 模块的 CSS 原名与具名 Key 对应表。 */
export const overscrollBehaviorKeys = {
  'overscroll-behavior': $overscrollBehavior,
  'overscroll-behavior-block': $overscrollBehaviorBlock,
  'overscroll-behavior-inline': $overscrollBehaviorInline,
  'overscroll-behavior-x': $overscrollBehaviorX,
  'overscroll-behavior-y': $overscrollBehaviorY,
}
