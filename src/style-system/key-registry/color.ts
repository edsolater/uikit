/**
 * 前景颜色的属性目标。
 *
 * 提供 color 及 currentColor 的继承来源；不包含整体透明度或颜色环境策略。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

/** color Key，可作为 Declaration 受体或过渡目标。 */
export const $color = key('color')

/** 前景颜色的 CSS 原名与具名 Key 对应表。 */
export const colorKeys = {
  'color': $color,
}
