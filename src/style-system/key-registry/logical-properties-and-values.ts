/**
 * CSS logical-properties-and-values 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- block-size 属性族 ---

export const $blockSize = key('block-size')

// --- inline-size 属性族 ---

export const $inlineSize = key('inline-size')

// --- max 属性族 ---

export const $maxBlockSize = key('max-block-size')

export const $maxInlineSize = key('max-inline-size')

// --- min 属性族 ---

export const $minBlockSize = key('min-block-size')

export const $minInlineSize = key('min-inline-size')

/** logical-properties-and-values 模块的 CSS 原名与具名 Key 对应表。 */
export const logicalPropertiesAndValuesKeys = {
  'block-size': $blockSize,
  'inline-size': $inlineSize,
  'max-block-size': $maxBlockSize,
  'max-inline-size': $maxInlineSize,
  'min-block-size': $minBlockSize,
  'min-inline-size': $minInlineSize,
}
