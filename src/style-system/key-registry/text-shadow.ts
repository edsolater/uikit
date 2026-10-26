/**
 * 字形阴影的属性目标。
 *
 * 定义文本字形的阴影，不与盒子外框阴影混放。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textShadow = key('text-shadow')

/** 字形阴影的 CSS 原名与具名 Key 对应表。 */
export const textShadowKeys = {
  'text-shadow': $textShadow,
}
