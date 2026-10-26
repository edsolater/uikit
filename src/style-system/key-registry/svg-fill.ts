/**
 * 矢量填充的属性目标。
 *
 * 定义封闭区域的填充颜色、透明度与填充规则。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $fill = key('fill')

export const $fillOpacity = key('fill-opacity')

export const $fillRule = key('fill-rule')

/** 矢量填充的 CSS 原名与具名 Key 对应表。 */
export const svgFillKeys = {
  'fill': $fill,
  'fill-opacity': $fillOpacity,
  'fill-rule': $fillRule,
}
