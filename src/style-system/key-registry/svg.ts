/**
 * CSS svg 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- color 属性族 ---

export const $colorInterpolation = key('color-interpolation')

// --- cx 属性族 ---

export const $cx = key('cx')

// --- cy 属性族 ---

export const $cy = key('cy')

// --- d 属性族 ---

export const $d = key('d')

// --- fill 属性族 ---

export const $fill = key('fill')

export const $fillOpacity = key('fill-opacity')

export const $fillRule = key('fill-rule')

// --- marker 属性族 ---

export const $marker = key('marker')

export const $markerEnd = key('marker-end')

export const $markerMid = key('marker-mid')

export const $markerStart = key('marker-start')

// --- paint-order 属性族 ---

export const $paintOrder = key('paint-order')

// --- path-length 属性族 ---

export const $pathLength = key('path-length')

// --- r 属性族 ---

export const $r = key('r')

// --- rx 属性族 ---

export const $rx = key('rx')

// --- ry 属性族 ---

export const $ry = key('ry')

// --- shape 属性族 ---

export const $shapeRendering = key('shape-rendering')

// --- stop-color 属性族 ---

export const $stopColor = key('stop-color')

// --- stop-opacity 属性族 ---

export const $stopOpacity = key('stop-opacity')

// --- stroke 属性族 ---

export const $stroke = key('stroke')

export const $strokeDasharray = key('stroke-dasharray')

export const $strokeDashoffset = key('stroke-dashoffset')

export const $strokeLinecap = key('stroke-linecap')

export const $strokeLinejoin = key('stroke-linejoin')

export const $strokeMiterlimit = key('stroke-miterlimit')

export const $strokeOpacity = key('stroke-opacity')

export const $strokeWidth = key('stroke-width')

// --- text 属性族 ---

export const $textAnchor = key('text-anchor')

export const $textRendering = key('text-rendering')

// --- vector-effect 属性族 ---

export const $vectorEffect = key('vector-effect')

// --- x 属性族 ---

export const $x = key('x')

// --- y 属性族 ---

export const $y = key('y')

/** svg 模块的 CSS 原名与具名 Key 对应表。 */
export const svgKeys = {
  'color-interpolation': $colorInterpolation,
  'cx': $cx,
  'cy': $cy,
  'd': $d,
  'fill': $fill,
  'fill-opacity': $fillOpacity,
  'fill-rule': $fillRule,
  'marker': $marker,
  'marker-end': $markerEnd,
  'marker-mid': $markerMid,
  'marker-start': $markerStart,
  'paint-order': $paintOrder,
  'path-length': $pathLength,
  'r': $r,
  'rx': $rx,
  'ry': $ry,
  'shape-rendering': $shapeRendering,
  'stop-color': $stopColor,
  'stop-opacity': $stopOpacity,
  'stroke': $stroke,
  'stroke-dasharray': $strokeDasharray,
  'stroke-dashoffset': $strokeDashoffset,
  'stroke-linecap': $strokeLinecap,
  'stroke-linejoin': $strokeLinejoin,
  'stroke-miterlimit': $strokeMiterlimit,
  'stroke-opacity': $strokeOpacity,
  'stroke-width': $strokeWidth,
  'text-anchor': $textAnchor,
  'text-rendering': $textRendering,
  'vector-effect': $vectorEffect,
  'x': $x,
  'y': $y,
}
