/**
 * CSS motion-path 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- offset 属性族 ---

export const $offset = key('offset')

export const $offsetAnchor = key('offset-anchor')

export const $offsetDistance = key('offset-distance')

export const $offsetPath = key('offset-path')

export const $offsetPosition = key('offset-position')

export const $offsetRotate = key('offset-rotate')

/** motion-path 模块的 CSS 原名与具名 Key 对应表。 */
export const motionPathKeys = {
  'offset': $offset,
  'offset-anchor': $offsetAnchor,
  'offset-distance': $offsetDistance,
  'offset-path': $offsetPath,
  'offset-position': $offsetPosition,
  'offset-rotate': $offsetRotate,
}
