/**
 * CSS box-sizing 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- aspect-ratio 属性族 ---

export const $aspectRatio = key('aspect-ratio')

// --- box 属性族 ---

export const $boxSizing = key('box-sizing')

// --- contain 属性族 ---

export const $containIntrinsicBlockSize = key('contain-intrinsic-block-size')

export const $containIntrinsicHeight = key('contain-intrinsic-height')

export const $containIntrinsicInlineSize = key('contain-intrinsic-inline-size')

export const $containIntrinsicSize = key('contain-intrinsic-size')

export const $containIntrinsicWidth = key('contain-intrinsic-width')

// --- frame-sizing 属性族 ---

export const $frameSizing = key('frame-sizing')

// --- height 属性族 ---

export const $height = key('height')

// --- max 属性族 ---

export const $maxHeight = key('max-height')

export const $maxWidth = key('max-width')

// --- min 属性族 ---

/** min-height Key；内容仍可将元素撑高。 */
export const $minHeight = key('min-height')

export const $minWidth = key('min-width')

// --- width 属性族 ---

export const $width = key('width')

/** box-sizing 模块的 CSS 原名与具名 Key 对应表。 */
export const boxSizingKeys = {
  'aspect-ratio': $aspectRatio,
  'box-sizing': $boxSizing,
  'contain-intrinsic-block-size': $containIntrinsicBlockSize,
  'contain-intrinsic-height': $containIntrinsicHeight,
  'contain-intrinsic-inline-size': $containIntrinsicInlineSize,
  'contain-intrinsic-size': $containIntrinsicSize,
  'contain-intrinsic-width': $containIntrinsicWidth,
  'frame-sizing': $frameSizing,
  'height': $height,
  'max-height': $maxHeight,
  'max-width': $maxWidth,
  'min-height': $minHeight,
  'min-width': $minWidth,
  'width': $width,
}
