/**
 * 触摸手势许可的属性目标。
 *
 * 声明触摸操作允许触发哪些浏览器手势。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $touchAction = key('touch-action')

/** 触摸手势许可的 CSS 原名与具名 Key 对应表。 */
export const touchActionKeys = {
  'touch-action': $touchAction,
}
