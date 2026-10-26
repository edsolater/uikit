/**
 * 背景绘制的属性目标。
 *
 * 组织背景各层的材料、位置、铺排及层内混合；不接管外框。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

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

export const $backgroundSize = key('background-size')

/** 背景绘制的 CSS 原名与具名 Key 对应表。 */
export const backgroundKeys = {
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
  'background-size': $backgroundSize,
}
