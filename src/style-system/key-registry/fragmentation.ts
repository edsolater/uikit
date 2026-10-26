/**
 * 内容断片的属性目标。
 *
 * 约束内容在页、栏等片段间的断开位置及孤行寡行。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $breakAfter = key('break-after')

export const $breakBefore = key('break-before')

export const $breakInside = key('break-inside')

export const $orphans = key('orphans')

export const $widows = key('widows')

/** 内容断片的 CSS 原名与具名 Key 对应表。 */
export const fragmentationKeys = {
  'break-after': $breakAfter,
  'break-before': $breakBefore,
  'break-inside': $breakInside,
  'orphans': $orphans,
  'widows': $widows,
}
