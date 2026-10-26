/**
 * 程序滚动方式的属性目标。
 *
 * 规定滚动操作采用平滑还是即时方式。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $scrollBehavior = key('scroll-behavior')

/** 程序滚动方式的 CSS 原名与具名 Key 对应表。 */
export const scrollBehaviorKeys = {
  'scroll-behavior': $scrollBehavior,
}
