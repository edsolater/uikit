/**
 * 子树交互可用性的属性目标。
 *
 * 控制子树的交互可用性，不等同于指针命中或文字选择。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $interactivity = key('interactivity')

/** 子树交互可用性的 CSS 原名与具名 Key 对应表。 */
export const interactivityKeys = {
  interactivity: $interactivity,
}
