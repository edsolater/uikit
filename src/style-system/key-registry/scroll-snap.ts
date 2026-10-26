/**
 * 滚动吸附的属性目标。
 *
 * 声明吸附方式、对齐目标及停止策略。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $scrollSnapAlign = key('scroll-snap-align')

export const $scrollSnapStop = key('scroll-snap-stop')

export const $scrollSnapType = key('scroll-snap-type')

/** 滚动吸附的 CSS 原名与具名 Key 对应表。 */
export const scrollSnapKeys = {
  'scroll-snap-align': $scrollSnapAlign,
  'scroll-snap-stop': $scrollSnapStop,
  'scroll-snap-type': $scrollSnapType,
}
