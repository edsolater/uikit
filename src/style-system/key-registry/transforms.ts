/**
 * CSS transforms 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- backface-visibility 属性族 ---

export const $backfaceVisibility = key('backface-visibility')

// --- perspective 属性族 ---

export const $perspective = key('perspective')

export const $perspectiveOrigin = key('perspective-origin')

// --- rotate 属性族 ---

export const $rotate = key('rotate')

// --- scale 属性族 ---

export const $scale = key('scale')

// --- transform 属性族 ---

/** transform Key；平移、缩放等视觉变换不改变原有布局占位。 */
export const $transform = key('transform')

export const $transformBox = key('transform-box')

export const $transformOrigin = key('transform-origin')

export const $transformStyle = key('transform-style')

// --- translate 属性族 ---

export const $translate = key('translate')

/** transforms 模块的 CSS 原名与具名 Key 对应表。 */
export const transformsKeys = {
  'backface-visibility': $backfaceVisibility,
  'perspective': $perspective,
  'perspective-origin': $perspectiveOrigin,
  'rotate': $rotate,
  'scale': $scale,
  'transform': $transform,
  'transform-box': $transformBox,
  'transform-origin': $transformOrigin,
  'transform-style': $transformStyle,
  'translate': $translate,
}
