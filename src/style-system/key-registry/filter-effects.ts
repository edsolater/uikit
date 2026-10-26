/**
 * CSS filter-effects 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- backdrop-filter 属性族 ---

export const $backdropFilter = key('backdrop-filter')

// --- color 属性族 ---

export const $colorInterpolationFilters = key('color-interpolation-filters')

// --- filter 属性族 ---

export const $filter = key('filter')

// --- flood-color 属性族 ---

export const $floodColor = key('flood-color')

// --- flood-opacity 属性族 ---

export const $floodOpacity = key('flood-opacity')

// --- lighting-color 属性族 ---

export const $lightingColor = key('lighting-color')

/** filter-effects 模块的 CSS 原名与具名 Key 对应表。 */
export const filterEffectsKeys = {
  'backdrop-filter': $backdropFilter,
  'color-interpolation-filters': $colorInterpolationFilters,
  'filter': $filter,
  'flood-color': $floodColor,
  'flood-opacity': $floodOpacity,
  'lighting-color': $lightingColor,
}
