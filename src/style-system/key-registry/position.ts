/**
 * 位置的属性目标。
 *
 * 统一普通定位、各边/逻辑 inset、锚点引用和定位回退，回答盒子放在哪里。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $anchorName = key('anchor-name')

export const $anchorScope = key('anchor-scope')

export const $positionAnchor = key('position-anchor')

export const $positionArea = key('position-area')

export const $positionTry = key('position-try')

export const $positionTryFallbacks = key('position-try-fallbacks')

export const $positionTryOrder = key('position-try-order')

export const $positionVisibility = key('position-visibility')

export const $bottom = key('bottom')

export const $inset = key('inset')

export const $insetBlock = key('inset-block')

export const $insetBlockEnd = key('inset-block-end')

export const $insetBlockStart = key('inset-block-start')

export const $insetInline = key('inset-inline')

export const $insetInlineEnd = key('inset-inline-end')

export const $insetInlineStart = key('inset-inline-start')

export const $left = key('left')

export const $position = key('position')

export const $right = key('right')

export const $top = key('top')

/** 位置的 CSS 原名与具名 Key 对应表。 */
export const positionKeys = {
  'anchor-name': $anchorName,
  'anchor-scope': $anchorScope,
  'position-anchor': $positionAnchor,
  'position-area': $positionArea,
  'position-try': $positionTry,
  'position-try-fallbacks': $positionTryFallbacks,
  'position-try-order': $positionTryOrder,
  'position-visibility': $positionVisibility,
  'bottom': $bottom,
  'inset': $inset,
  'inset-block': $insetBlock,
  'inset-block-end': $insetBlockEnd,
  'inset-block-start': $insetBlockStart,
  'inset-inline': $insetInline,
  'inset-inline-end': $insetInlineEnd,
  'inset-inline-start': $insetInlineStart,
  'left': $left,
  'position': $position,
  'right': $right,
  'top': $top,
}
