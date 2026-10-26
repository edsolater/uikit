/**
 * 矢量几何的属性目标。
 *
 * 定义路径、坐标、半径及轮廓几何。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $cx = key('cx')

export const $cy = key('cy')

export const $d = key('d')

export const $r = key('r')

export const $rx = key('rx')

export const $ry = key('ry')

export const $x = key('x')

export const $y = key('y')

/** 矢量几何的 CSS 原名与具名 Key 对应表。 */
export const svgGeometryKeys = {
  cx: $cx,
  cy: $cy,
  d: $d,
  r: $r,
  rx: $rx,
  ry: $ry,
  x: $x,
  y: $y,
}
