/**
 * CSS anchor-positioning 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- anchor-name 属性族 ---

export const $anchorName = key('anchor-name')

// --- anchor-scope 属性族 ---

export const $anchorScope = key('anchor-scope')

// --- position 属性族 ---

export const $positionAnchor = key('position-anchor')

export const $positionArea = key('position-area')

export const $positionTry = key('position-try')

export const $positionTryFallbacks = key('position-try-fallbacks')

export const $positionTryOrder = key('position-try-order')

export const $positionVisibility = key('position-visibility')

/** anchor-positioning 模块的 CSS 原名与具名 Key 对应表。 */
export const anchorPositioningKeys = {
  'anchor-name': $anchorName,
  'anchor-scope': $anchorScope,
  'position-anchor': $positionAnchor,
  'position-area': $positionArea,
  'position-try': $positionTry,
  'position-try-fallbacks': $positionTryFallbacks,
  'position-try-order': $positionTryOrder,
  'position-visibility': $positionVisibility,
}
