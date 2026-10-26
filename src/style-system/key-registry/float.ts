/**
 * 浮动绕排的属性目标。
 *
 * 共同组织 float/clear 与绕排形状，回答相邻行内容怎样绕开浮动区域。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $clear = key('clear')

export const $float = key('float')

export const $shapeImageThreshold = key('shape-image-threshold')

export const $shapeMargin = key('shape-margin')

export const $shapeOutside = key('shape-outside')

/** 浮动绕排的 CSS 原名与具名 Key 对应表。 */
export const floatKeys = {
  'clear': $clear,
  'float': $float,
  'shape-image-threshold': $shapeImageThreshold,
  'shape-margin': $shapeMargin,
  'shape-outside': $shapeOutside,
}
