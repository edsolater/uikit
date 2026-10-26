/**
 * 替换内容适配的属性目标。
 *
 * 控制图片、视频等替换内容的适配、位置和可视裁切区域。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $objectFit = key('object-fit')

export const $objectPosition = key('object-position')

export const $objectViewBox = key('object-view-box')

/** 替换内容适配的 CSS 原名与具名 Key 对应表。 */
export const objectFitKeys = {
  'object-fit': $objectFit,
  'object-position': $objectPosition,
  'object-view-box': $objectViewBox,
}
