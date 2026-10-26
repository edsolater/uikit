/**
 * 视觉排列顺序的属性目标。
 *
 * 规定布局中的视觉排序，不将其冒充辅助技术的阅读顺序。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $order = key('order')

/** 视觉排列顺序的 CSS 原名与具名 Key 对应表。 */
export const orderKeys = {
  'order': $order,
}
