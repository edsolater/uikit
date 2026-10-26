/**
 * CSS positioned-layout 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- bottom 属性族 ---

export const $bottom = key('bottom')

// --- clear 属性族 ---

export const $clear = key('clear')

// --- float 属性族 ---

export const $float = key('float')

// --- inset 属性族 ---

export const $inset = key('inset')

export const $insetBlock = key('inset-block')

export const $insetBlockEnd = key('inset-block-end')

export const $insetBlockStart = key('inset-block-start')

export const $insetInline = key('inset-inline')

export const $insetInlineEnd = key('inset-inline-end')

export const $insetInlineStart = key('inset-inline-start')

// --- left 属性族 ---

export const $left = key('left')

// --- overlay 属性族 ---

export const $overlay = key('overlay')

// --- position 属性族 ---

export const $position = key('position')

// --- right 属性族 ---

export const $right = key('right')

// --- top 属性族 ---

export const $top = key('top')

// --- z-index 属性族 ---

export const $zIndex = key('z-index')

/** positioned-layout 模块的 CSS 原名与具名 Key 对应表。 */
export const positionedLayoutKeys = {
  'bottom': $bottom,
  'clear': $clear,
  'float': $float,
  'inset': $inset,
  'inset-block': $insetBlock,
  'inset-block-end': $insetBlockEnd,
  'inset-block-start': $insetBlockStart,
  'inset-inline': $insetInline,
  'inset-inline-end': $insetInlineEnd,
  'inset-inline-start': $insetInlineStart,
  'left': $left,
  'overlay': $overlay,
  'position': $position,
  'right': $right,
  'top': $top,
  'z-index': $zIndex,
}
