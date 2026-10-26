/**
 * 属性过渡的属性目标。
 *
 * 定义属性值变化时的自动过渡。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $transition = key('transition')

export const $transitionBehavior = key('transition-behavior')

export const $transitionDelay = key('transition-delay')

export const $transitionDuration = key('transition-duration')

export const $transitionProperty = key('transition-property')

export const $transitionTimingFunction = key('transition-timing-function')

/** 属性过渡的 CSS 原名与具名 Key 对应表。 */
export const transitionKeys = {
  'transition': $transition,
  'transition-behavior': $transitionBehavior,
  'transition-delay': $transitionDelay,
  'transition-duration': $transitionDuration,
  'transition-property': $transitionProperty,
  'transition-timing-function': $transitionTimingFunction,
}
