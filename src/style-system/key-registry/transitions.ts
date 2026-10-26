/**
 * CSS transitions 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- transition 属性族 ---

export const $transition = key('transition')

export const $transitionBehavior = key('transition-behavior')

export const $transitionDelay = key('transition-delay')

export const $transitionDuration = key('transition-duration')

export const $transitionProperty = key('transition-property')

export const $transitionTimingFunction = key('transition-timing-function')

/** transitions 模块的 CSS 原名与具名 Key 对应表。 */
export const transitionsKeys = {
  'transition': $transition,
  'transition-behavior': $transitionBehavior,
  'transition-delay': $transitionDelay,
  'transition-duration': $transitionDuration,
  'transition-property': $transitionProperty,
  'transition-timing-function': $transitionTimingFunction,
}
