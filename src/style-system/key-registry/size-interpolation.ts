/**
 * 尺寸插值的属性目标。
 *
 * 规定内在尺寸关键字是否参与插值；不设置静态宽高，也不拥有动画时间线。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $interpolateSize = key('interpolate-size')

/** 尺寸插值的 CSS 原名与具名 Key 对应表。 */
export const sizeInterpolationKeys = {
  'interpolate-size': $interpolateSize,
}
