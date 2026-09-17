/** 为主体建立决定占位与区域划分的基础结构效果。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { $minHeight } from '../properties/size'
import { $border, $borderColor, $borderRadius } from '../properties/border'
import { $outlineColor, $outlineOffset, $outlineStyle, $outlineWidth } from '../properties/outline'

/** 一次主体尺寸配置；各字段共同约束主体占据的物理空间。 */
export interface SizeMixinOptions {
  minHeight?: ValueInput
}

/** 按调用方选择的约束建立当前主体的物理尺寸，省略的尺寸不改变当前层。 */
export const size = (options: SizeMixinOptions = {}): Declarations => [
  [$minHeight, options.minHeight],
]

/** 一次边界配置；border、borderColor 与 radius 组成占位边框，outline 描述不占布局空间的外部轮廓。 */
export interface BoundaryMixinOptions {
  border?: ValueInput | ValueInput[]
  borderColor?: ValueInput
  radius?: ValueInput
  outline?: {
    width?: ValueInput
    style?: ValueInput
    color?: ValueInput
    offset?: ValueInput
  }
}

/** 按调用方选择的边缘材料划分当前主体与相邻空间，省略的边界部分不改变当前层。 */
export const boundary = (options: BoundaryMixinOptions = {}): Declarations => [
  [$border, options.border],
  [$borderColor, options.borderColor],
  [$borderRadius, options.radius],
  [$outlineWidth, options.outline?.width],
  [$outlineStyle, options.outline?.style],
  [$outlineColor, options.outline?.color],
  [$outlineOffset, options.outline?.offset],
]
