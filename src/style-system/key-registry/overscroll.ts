/**
 * 滚动边界行为的属性目标。
 *
 * 控制到达边界后的滚动传播及反馈。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $overscrollBehavior = key('overscroll-behavior')

export const $overscrollBehaviorBlock = key('overscroll-behavior-block')

export const $overscrollBehaviorInline = key('overscroll-behavior-inline')

export const $overscrollBehaviorX = key('overscroll-behavior-x')

export const $overscrollBehaviorY = key('overscroll-behavior-y')

/** 滚动边界行为的 CSS 原名与具名 Key 对应表。 */
export const overscrollKeys = {
  'overscroll-behavior': $overscrollBehavior,
  'overscroll-behavior-block': $overscrollBehaviorBlock,
  'overscroll-behavior-inline': $overscrollBehaviorInline,
  'overscroll-behavior-x': $overscrollBehaviorX,
  'overscroll-behavior-y': $overscrollBehaviorY,
}
