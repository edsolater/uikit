/**
 * 滚动条呈现的属性目标。
 *
 * 统一滚动条颜色、宽度与空间预留。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $scrollbarGutter = key('scrollbar-gutter')

export const $scrollbarColor = key('scrollbar-color')

export const $scrollbarWidth = key('scrollbar-width')

/** 滚动条呈现的 CSS 原名与具名 Key 对应表。 */
export const scrollbarKeys = {
  'scrollbar-gutter': $scrollbarGutter,
  'scrollbar-color': $scrollbarColor,
  'scrollbar-width': $scrollbarWidth,
}
