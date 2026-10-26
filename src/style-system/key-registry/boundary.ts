/**
 * 盒子外框的属性目标。
 *
 * 组织 border、outline、box-shadow 与圆角/角形，支持同一外框目的下选择不同表达。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $border = key('border')

export const $borderBlock = key('border-block')

export const $borderBlockColor = key('border-block-color')

export const $borderBlockEnd = key('border-block-end')

export const $borderBlockEndColor = key('border-block-end-color')

export const $borderBlockEndStyle = key('border-block-end-style')

export const $borderBlockEndWidth = key('border-block-end-width')

export const $borderBlockStart = key('border-block-start')

export const $borderBlockStartColor = key('border-block-start-color')

export const $borderBlockStartStyle = key('border-block-start-style')

export const $borderBlockStartWidth = key('border-block-start-width')

export const $borderBlockStyle = key('border-block-style')

export const $borderBlockWidth = key('border-block-width')

export const $borderBottom = key('border-bottom')

export const $borderBottomColor = key('border-bottom-color')

export const $borderBottomLeftRadius = key('border-bottom-left-radius')

export const $borderBottomRightRadius = key('border-bottom-right-radius')

export const $borderBottomStyle = key('border-bottom-style')

export const $borderBottomWidth = key('border-bottom-width')

export const $borderColor = key('border-color')

export const $borderEndEndRadius = key('border-end-end-radius')

export const $borderEndStartRadius = key('border-end-start-radius')

export const $borderImage = key('border-image')

export const $borderImageOutset = key('border-image-outset')

export const $borderImageRepeat = key('border-image-repeat')

export const $borderImageSlice = key('border-image-slice')

export const $borderImageSource = key('border-image-source')

export const $borderImageWidth = key('border-image-width')

export const $borderInline = key('border-inline')

export const $borderInlineColor = key('border-inline-color')

export const $borderInlineEnd = key('border-inline-end')

export const $borderInlineEndColor = key('border-inline-end-color')

export const $borderInlineEndStyle = key('border-inline-end-style')

export const $borderInlineEndWidth = key('border-inline-end-width')

export const $borderInlineStart = key('border-inline-start')

export const $borderInlineStartColor = key('border-inline-start-color')

export const $borderInlineStartStyle = key('border-inline-start-style')

export const $borderInlineStartWidth = key('border-inline-start-width')

export const $borderInlineStyle = key('border-inline-style')

export const $borderInlineWidth = key('border-inline-width')

export const $borderLeft = key('border-left')

export const $borderLeftColor = key('border-left-color')

export const $borderLeftStyle = key('border-left-style')

export const $borderLeftWidth = key('border-left-width')

export const $borderRadius = key('border-radius')

export const $borderRight = key('border-right')

export const $borderRightColor = key('border-right-color')

export const $borderRightStyle = key('border-right-style')

export const $borderRightWidth = key('border-right-width')

export const $borderShape = key('border-shape')

export const $borderStartEndRadius = key('border-start-end-radius')

export const $borderStartStartRadius = key('border-start-start-radius')

export const $borderStyle = key('border-style')

export const $borderTop = key('border-top')

export const $borderTopColor = key('border-top-color')

export const $borderTopLeftRadius = key('border-top-left-radius')

export const $borderTopRightRadius = key('border-top-right-radius')

export const $borderTopStyle = key('border-top-style')

export const $borderTopWidth = key('border-top-width')

export const $borderWidth = key('border-width')

/**
 * 同址阴影声明使用默认逗号数组组合；组合值是否有效由浏览器判断。
 * @example
 * rules('.card', [[$boxShadow, '1px 2px red'], [$boxShadow, '3px 4px blue']])
 * compileCSS().includes('box-shadow: 1px 2px red, 3px 4px blue;') // true
 */
export const $boxShadow = key('box-shadow')

export const $cornerBlockEndShape = key('corner-block-end-shape')

export const $cornerBlockStartShape = key('corner-block-start-shape')

export const $cornerBottomLeftShape = key('corner-bottom-left-shape')

export const $cornerBottomRightShape = key('corner-bottom-right-shape')

export const $cornerBottomShape = key('corner-bottom-shape')

export const $cornerEndEndShape = key('corner-end-end-shape')

export const $cornerEndStartShape = key('corner-end-start-shape')

export const $cornerInlineEndShape = key('corner-inline-end-shape')

export const $cornerInlineStartShape = key('corner-inline-start-shape')

export const $cornerLeftShape = key('corner-left-shape')

export const $cornerRightShape = key('corner-right-shape')

export const $cornerShape = key('corner-shape')

export const $cornerStartEndShape = key('corner-start-end-shape')

export const $cornerStartStartShape = key('corner-start-start-shape')

export const $cornerTopLeftShape = key('corner-top-left-shape')

export const $cornerTopRightShape = key('corner-top-right-shape')

export const $cornerTopShape = key('corner-top-shape')

export const $outline = key('outline')

/** outline-color Key，设置轮廓颜色。 */
export const $outlineColor = key('outline-color')

/** outline-offset Key；设置轮廓与元素边缘的间隔，负值向内收。 */
export const $outlineOffset = key('outline-offset')

/** outline-style Key，设置轮廓线型。 */
export const $outlineStyle = key('outline-style')

/** outline-width Key，设置轮廓线厚度。 */
export const $outlineWidth = key('outline-width')

/** 盒子外框的 CSS 原名与具名 Key 对应表。 */
export const boundaryKeys = {
  'border': $border,
  'border-block': $borderBlock,
  'border-block-color': $borderBlockColor,
  'border-block-end': $borderBlockEnd,
  'border-block-end-color': $borderBlockEndColor,
  'border-block-end-style': $borderBlockEndStyle,
  'border-block-end-width': $borderBlockEndWidth,
  'border-block-start': $borderBlockStart,
  'border-block-start-color': $borderBlockStartColor,
  'border-block-start-style': $borderBlockStartStyle,
  'border-block-start-width': $borderBlockStartWidth,
  'border-block-style': $borderBlockStyle,
  'border-block-width': $borderBlockWidth,
  'border-bottom': $borderBottom,
  'border-bottom-color': $borderBottomColor,
  'border-bottom-left-radius': $borderBottomLeftRadius,
  'border-bottom-right-radius': $borderBottomRightRadius,
  'border-bottom-style': $borderBottomStyle,
  'border-bottom-width': $borderBottomWidth,
  'border-color': $borderColor,
  'border-end-end-radius': $borderEndEndRadius,
  'border-end-start-radius': $borderEndStartRadius,
  'border-image': $borderImage,
  'border-image-outset': $borderImageOutset,
  'border-image-repeat': $borderImageRepeat,
  'border-image-slice': $borderImageSlice,
  'border-image-source': $borderImageSource,
  'border-image-width': $borderImageWidth,
  'border-inline': $borderInline,
  'border-inline-color': $borderInlineColor,
  'border-inline-end': $borderInlineEnd,
  'border-inline-end-color': $borderInlineEndColor,
  'border-inline-end-style': $borderInlineEndStyle,
  'border-inline-end-width': $borderInlineEndWidth,
  'border-inline-start': $borderInlineStart,
  'border-inline-start-color': $borderInlineStartColor,
  'border-inline-start-style': $borderInlineStartStyle,
  'border-inline-start-width': $borderInlineStartWidth,
  'border-inline-style': $borderInlineStyle,
  'border-inline-width': $borderInlineWidth,
  'border-left': $borderLeft,
  'border-left-color': $borderLeftColor,
  'border-left-style': $borderLeftStyle,
  'border-left-width': $borderLeftWidth,
  'border-radius': $borderRadius,
  'border-right': $borderRight,
  'border-right-color': $borderRightColor,
  'border-right-style': $borderRightStyle,
  'border-right-width': $borderRightWidth,
  'border-shape': $borderShape,
  'border-start-end-radius': $borderStartEndRadius,
  'border-start-start-radius': $borderStartStartRadius,
  'border-style': $borderStyle,
  'border-top': $borderTop,
  'border-top-color': $borderTopColor,
  'border-top-left-radius': $borderTopLeftRadius,
  'border-top-right-radius': $borderTopRightRadius,
  'border-top-style': $borderTopStyle,
  'border-top-width': $borderTopWidth,
  'border-width': $borderWidth,
  'box-shadow': $boxShadow,
  'corner-block-end-shape': $cornerBlockEndShape,
  'corner-block-start-shape': $cornerBlockStartShape,
  'corner-bottom-left-shape': $cornerBottomLeftShape,
  'corner-bottom-right-shape': $cornerBottomRightShape,
  'corner-bottom-shape': $cornerBottomShape,
  'corner-end-end-shape': $cornerEndEndShape,
  'corner-end-start-shape': $cornerEndStartShape,
  'corner-inline-end-shape': $cornerInlineEndShape,
  'corner-inline-start-shape': $cornerInlineStartShape,
  'corner-left-shape': $cornerLeftShape,
  'corner-right-shape': $cornerRightShape,
  'corner-shape': $cornerShape,
  'corner-start-end-shape': $cornerStartEndShape,
  'corner-start-start-shape': $cornerStartStartShape,
  'corner-top-left-shape': $cornerTopLeftShape,
  'corner-top-right-shape': $cornerTopRightShape,
  'corner-top-shape': $cornerTopShape,
  'outline': $outline,
  'outline-color': $outlineColor,
  'outline-offset': $outlineOffset,
  'outline-style': $outlineStyle,
  'outline-width': $outlineWidth,
}
