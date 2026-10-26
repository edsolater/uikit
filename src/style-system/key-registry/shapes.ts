/**
 * CSS shapes 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- shape 属性族 ---

export const $shapeImageThreshold = key('shape-image-threshold')

export const $shapeMargin = key('shape-margin')

export const $shapeOutside = key('shape-outside')

/** shapes 模块的 CSS 原名与具名 Key 对应表。 */
export const shapesKeys = {
  'shape-image-threshold': $shapeImageThreshold,
  'shape-margin': $shapeMargin,
  'shape-outside': $shapeOutside,
}
