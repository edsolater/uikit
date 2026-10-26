/**
 * 矢量文字锚定的属性目标。
 *
 * 控制文字相对于定位点的锚定关系；基线配置仍统一归 baseline。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textAnchor = key('text-anchor')

/** 矢量文字锚定的 CSS 原名与具名 Key 对应表。 */
export const svgTextKeys = {
  'text-anchor': $textAnchor,
}
