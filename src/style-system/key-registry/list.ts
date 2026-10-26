/**
 * 列表标记的属性目标。
 *
 * 组织列表标记的内容、图像与位置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $listStyle = key('list-style')

export const $listStyleImage = key('list-style-image')

export const $listStylePosition = key('list-style-position')

export const $listStyleType = key('list-style-type')

/** 列表标记的 CSS 原名与具名 Key 对应表。 */
export const listKeys = {
  'list-style': $listStyle,
  'list-style-image': $listStyleImage,
  'list-style-position': $listStylePosition,
  'list-style-type': $listStyleType,
}
