/**
 * 矢量绘制顺序的属性目标。
 *
 * 规定填充、描边和标记的绘制先后。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $paintOrder = key('paint-order')

/** 矢量绘制顺序的 CSS 原名与具名 Key 对应表。 */
export const svgPaintOrderKeys = {
  'paint-order': $paintOrder,
}
