/**
 * CSS backgrounds-and-borders 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- background 属性族 ---

export const $background = key('background')

export const $backgroundAttachment = key('background-attachment')

export const $backgroundBlendMode = key('background-blend-mode')

export const $backgroundClip = key('background-clip')

/** background-color Key，只对应元素底色，不影响背景图片。 */
export const $backgroundColor = key('background-color')

export const $backgroundImage = key('background-image')

export const $backgroundOrigin = key('background-origin')

export const $backgroundPosition = key('background-position')

export const $backgroundPositionX = key('background-position-x')

export const $backgroundPositionY = key('background-position-y')

export const $backgroundRepeat = key('background-repeat')

export const $backgroundRepeatX = key('background-repeat-x')

export const $backgroundRepeatY = key('background-repeat-y')

export const $backgroundSize = key('background-size')

// --- border 属性族 ---

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

// --- box 属性族 ---

/**
 * 同址阴影声明使用默认逗号数组组合；组合值是否有效由浏览器判断。
 * @example
 * rules('.card', [[$boxShadow, '1px 2px red'], [$boxShadow, '3px 4px blue']])
 * compileCSS().includes('box-shadow: 1px 2px red, 3px 4px blue;') // true
 */
export const $boxShadow = key('box-shadow')

// --- corner 属性族 ---

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

/** backgrounds-and-borders 模块的 CSS 原名与具名 Key 对应表。 */
export const backgroundsAndBordersKeys = {
  'background': $background,
  'background-attachment': $backgroundAttachment,
  'background-blend-mode': $backgroundBlendMode,
  'background-clip': $backgroundClip,
  'background-color': $backgroundColor,
  'background-image': $backgroundImage,
  'background-origin': $backgroundOrigin,
  'background-position': $backgroundPosition,
  'background-position-x': $backgroundPositionX,
  'background-position-y': $backgroundPositionY,
  'background-repeat': $backgroundRepeat,
  'background-repeat-x': $backgroundRepeatX,
  'background-repeat-y': $backgroundRepeatY,
  'background-size': $backgroundSize,
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
}
