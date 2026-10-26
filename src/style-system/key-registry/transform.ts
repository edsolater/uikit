/**
 * 空间变换的属性目标。
 *
 * 组织变换、基点、透视与三维参与方式。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $backfaceVisibility = key('backface-visibility')

export const $perspective = key('perspective')

export const $perspectiveOrigin = key('perspective-origin')

export const $rotate = key('rotate')

export const $scale = key('scale')

/** transform Key；平移、缩放等视觉变换不改变原有布局占位。 */
export const $transform = key('transform')

export const $transformBox = key('transform-box')

export const $transformOrigin = key('transform-origin')

export const $transformStyle = key('transform-style')

export const $translate = key('translate')

/** 空间变换的 CSS 原名与具名 Key 对应表。 */
export const transformKeys = {
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
