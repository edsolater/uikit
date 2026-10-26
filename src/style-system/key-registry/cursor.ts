/**
 * 指针外观的属性目标。
 *
 * 控制鼠标指针图形，不决定事件命中。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

/** cursor Key，描述鼠标经过元素时的指针形态。 */
export const $cursor = key('cursor')

/** 指针外观的 CSS 原名与具名 Key 对应表。 */
export const cursorKeys = {
  cursor: $cursor,
}
