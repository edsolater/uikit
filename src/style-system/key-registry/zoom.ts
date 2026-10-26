/**
 * 元素缩放的属性目标。
 *
 * 声明元素的布局缩放，不将其误称为视口配置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $zoom = key('zoom')

/** 元素缩放的 CSS 原名与具名 Key 对应表。 */
export const zoomKeys = {
  'zoom': $zoom,
}
