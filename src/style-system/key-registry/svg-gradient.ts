/**
 * 渐变色标的属性目标。
 *
 * 定义渐变色标颜色和透明度。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $stopColor = key('stop-color')

export const $stopOpacity = key('stop-opacity')

/** 渐变色标的 CSS 原名与具名 Key 对应表。 */
export const svgGradientKeys = {
  'stop-color': $stopColor,
  'stop-opacity': $stopOpacity,
}
