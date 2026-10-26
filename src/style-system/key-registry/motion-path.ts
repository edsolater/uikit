/**
 * 运动路径的属性目标。
 *
 * 定义沿路径定位时的路径、距离、锚点和朝向。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $offset = key('offset')

export const $offsetAnchor = key('offset-anchor')

export const $offsetDistance = key('offset-distance')

export const $offsetPath = key('offset-path')

export const $offsetPosition = key('offset-position')

export const $offsetRotate = key('offset-rotate')

/** 运动路径的 CSS 原名与具名 Key 对应表。 */
export const motionPathKeys = {
  'offset': $offset,
  'offset-anchor': $offsetAnchor,
  'offset-distance': $offsetDistance,
  'offset-path': $offsetPath,
  'offset-position': $offsetPosition,
  'offset-rotate': $offsetRotate,
}
