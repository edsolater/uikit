/**
 * CSS images 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- image 属性族 ---

export const $imageOrientation = key('image-orientation')

export const $imageRendering = key('image-rendering')

export const $imageResolution = key('image-resolution')

// --- object 属性族 ---

export const $objectFit = key('object-fit')

export const $objectPosition = key('object-position')

export const $objectViewBox = key('object-view-box')

/** images 模块的 CSS 原名与具名 Key 对应表。 */
export const imagesKeys = {
  'image-orientation': $imageOrientation,
  'image-rendering': $imageRendering,
  'image-resolution': $imageResolution,
  'object-fit': $objectFit,
  'object-position': $objectPosition,
  'object-view-box': $objectViewBox,
}
