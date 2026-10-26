/**
 * CSS paged-media 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- page 属性族 ---

export const $page = key('page')

export const $pageBreakAfter = key('page-break-after')

export const $pageBreakBefore = key('page-break-before')

export const $pageBreakInside = key('page-break-inside')

/** paged-media 模块的 CSS 原名与具名 Key 对应表。 */
export const pagedMediaKeys = {
  'page': $page,
  'page-break-after': $pageBreakAfter,
  'page-break-before': $pageBreakBefore,
  'page-break-inside': $pageBreakInside,
}
