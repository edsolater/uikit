/**
 * 矢量描边的属性目标。
 *
 * 定义轮廓线的宽度、端点、连接、虚线和随变换缩放方式。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $stroke = key('stroke')

export const $strokeDasharray = key('stroke-dasharray')

export const $strokeDashoffset = key('stroke-dashoffset')

export const $strokeLinecap = key('stroke-linecap')

export const $strokeLinejoin = key('stroke-linejoin')

export const $strokeMiterlimit = key('stroke-miterlimit')

export const $strokeOpacity = key('stroke-opacity')

export const $strokeWidth = key('stroke-width')

export const $vectorEffect = key('vector-effect')

/** 矢量描边的 CSS 原名与具名 Key 对应表。 */
export const svgStrokeKeys = {
  'stroke': $stroke,
  'stroke-dasharray': $strokeDasharray,
  'stroke-dashoffset': $strokeDashoffset,
  'stroke-linecap': $strokeLinecap,
  'stroke-linejoin': $strokeLinejoin,
  'stroke-miterlimit': $strokeMiterlimit,
  'stroke-opacity': $strokeOpacity,
  'stroke-width': $strokeWidth,
  'vector-effect': $vectorEffect,
}
