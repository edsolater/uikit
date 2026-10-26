/**
 * 路径标记的属性目标。
 *
 * 定义路径起点、中点和终点上的标记引用。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $marker = key('marker')

export const $markerEnd = key('marker-end')

export const $markerMid = key('marker-mid')

export const $markerStart = key('marker-start')

/** 路径标记的 CSS 原名与具名 Key 对应表。 */
export const svgMarkerKeys = {
  'marker': $marker,
  'marker-end': $markerEnd,
  'marker-mid': $markerMid,
  'marker-start': $markerStart,
}
