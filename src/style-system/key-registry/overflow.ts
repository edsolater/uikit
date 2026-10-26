/**
 * CSS overflow 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- line 属性族 ---

export const $lineClamp = key('line-clamp')

// --- overflow 属性族 ---

export const $overflow = key('overflow')

export const $overflowBlock = key('overflow-block')

export const $overflowClipMargin = key('overflow-clip-margin')

export const $overflowInline = key('overflow-inline')

export const $overflowX = key('overflow-x')

export const $overflowY = key('overflow-y')

// --- scroll 属性族 ---

export const $scrollBehavior = key('scroll-behavior')

export const $scrollMarkerGroup = key('scroll-marker-group')

export const $scrollTargetGroup = key('scroll-target-group')

// --- scrollbar 属性族 ---

export const $scrollbarGutter = key('scrollbar-gutter')

// --- text 属性族 ---

export const $textOverflow = key('text-overflow')

/** overflow 模块的 CSS 原名与具名 Key 对应表。 */
export const overflowKeys = {
  'line-clamp': $lineClamp,
  'overflow': $overflow,
  'overflow-block': $overflowBlock,
  'overflow-clip-margin': $overflowClipMargin,
  'overflow-inline': $overflowInline,
  'overflow-x': $overflowX,
  'overflow-y': $overflowY,
  'scroll-behavior': $scrollBehavior,
  'scroll-marker-group': $scrollMarkerGroup,
  'scroll-target-group': $scrollTargetGroup,
  'scrollbar-gutter': $scrollbarGutter,
  'text-overflow': $textOverflow,
}
