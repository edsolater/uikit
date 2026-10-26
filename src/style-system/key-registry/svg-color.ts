/**
 * 矢量颜色插值的属性目标。
 *
 * 控制矢量颜色运算所采用的插值空间。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $colorInterpolation = key('color-interpolation')

/** 矢量颜色插值的 CSS 原名与具名 Key 对应表。 */
export const svgColorKeys = {
  'color-interpolation': $colorInterpolation,
}
