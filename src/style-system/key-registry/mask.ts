/**
 * 可见区域的属性目标。
 *
 * 通过几何裁剪或透明度遮罩限定元素可见部分；mask-border 是遮罩，不是边框绘制。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $clipPath = key('clip-path')

export const $clipRule = key('clip-rule')

export const $mask = key('mask')

export const $maskBorder = key('mask-border')

export const $maskBorderMode = key('mask-border-mode')

export const $maskBorderOutset = key('mask-border-outset')

export const $maskBorderRepeat = key('mask-border-repeat')

export const $maskBorderSlice = key('mask-border-slice')

export const $maskBorderSource = key('mask-border-source')

export const $maskBorderWidth = key('mask-border-width')

export const $maskClip = key('mask-clip')

export const $maskComposite = key('mask-composite')

export const $maskImage = key('mask-image')

export const $maskMode = key('mask-mode')

export const $maskOrigin = key('mask-origin')

export const $maskPosition = key('mask-position')

export const $maskRepeat = key('mask-repeat')

export const $maskSize = key('mask-size')

export const $maskType = key('mask-type')

/** 可见区域的 CSS 原名与具名 Key 对应表。 */
export const maskKeys = {
  'clip-path': $clipPath,
  'clip-rule': $clipRule,
  'mask': $mask,
  'mask-border': $maskBorder,
  'mask-border-mode': $maskBorderMode,
  'mask-border-outset': $maskBorderOutset,
  'mask-border-repeat': $maskBorderRepeat,
  'mask-border-slice': $maskBorderSlice,
  'mask-border-source': $maskBorderSource,
  'mask-border-width': $maskBorderWidth,
  'mask-clip': $maskClip,
  'mask-composite': $maskComposite,
  'mask-image': $maskImage,
  'mask-mode': $maskMode,
  'mask-origin': $maskOrigin,
  'mask-position': $maskPosition,
  'mask-repeat': $maskRepeat,
  'mask-size': $maskSize,
  'mask-type': $maskType,
}
