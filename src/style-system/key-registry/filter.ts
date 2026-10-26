/**
 * 图像过滤的属性目标。
 *
 * 控制元素/背景过滤及滤镜的颜色、灯光输入。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $backdropFilter = key('backdrop-filter')

export const $colorInterpolationFilters = key('color-interpolation-filters')

export const $filter = key('filter')

export const $floodColor = key('flood-color')

export const $floodOpacity = key('flood-opacity')

export const $lightingColor = key('lighting-color')

/** 图像过滤的 CSS 原名与具名 Key 对应表。 */
export const filterKeys = {
  'backdrop-filter': $backdropFilter,
  'color-interpolation-filters': $colorInterpolationFilters,
  'filter': $filter,
  'flood-color': $floodColor,
  'flood-opacity': $floodOpacity,
  'lighting-color': $lightingColor,
}
