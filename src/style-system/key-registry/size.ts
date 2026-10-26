/**
 * 占据尺寸的属性目标。
 *
 * 统一物理/逻辑宽高、上下限、比例、盒尺寸算法及内在尺寸估算，包括字段和嵌入帧的尺寸策略。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $fieldSizing = key('field-sizing')

export const $aspectRatio = key('aspect-ratio')

export const $boxSizing = key('box-sizing')

export const $containIntrinsicBlockSize = key('contain-intrinsic-block-size')

export const $containIntrinsicHeight = key('contain-intrinsic-height')

export const $containIntrinsicInlineSize = key('contain-intrinsic-inline-size')

export const $containIntrinsicSize = key('contain-intrinsic-size')

export const $containIntrinsicWidth = key('contain-intrinsic-width')

export const $frameSizing = key('frame-sizing')

export const $height = key('height')

export const $maxHeight = key('max-height')

export const $maxWidth = key('max-width')

/** min-height Key；内容仍可将元素撑高。 */
export const $minHeight = key('min-height')

export const $minWidth = key('min-width')

export const $width = key('width')

export const $blockSize = key('block-size')

export const $inlineSize = key('inline-size')

export const $maxBlockSize = key('max-block-size')

export const $maxInlineSize = key('max-inline-size')

export const $minBlockSize = key('min-block-size')

export const $minInlineSize = key('min-inline-size')

/** 占据尺寸的 CSS 原名与具名 Key 对应表。 */
export const sizeKeys = {
  'field-sizing': $fieldSizing,
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
  'block-size': $blockSize,
  'inline-size': $inlineSize,
  'max-block-size': $maxBlockSize,
  'max-inline-size': $maxInlineSize,
  'min-block-size': $minBlockSize,
  'min-inline-size': $minInlineSize,
}
