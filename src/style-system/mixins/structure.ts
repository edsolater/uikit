/** 主体尺寸与边界 Mixin。 */
import type { Declarations } from '../core/css-rule'
import type { ValueInput } from '../core/css-value'
import { valueSequence } from '../values/list'
import { $minHeight } from '../properties/size'
import { $border, $borderColor, $borderRadius, $cornerShape } from '../properties/border'
import { $outlineColor, $outlineOffset, $outlineStyle, $outlineWidth } from '../properties/outline'

/** 盒子尺寸配置。 */
export interface SizeMixinOptions {
  minHeight?: ValueInput
}

/** Mixin：盒子尺寸。 */
export const size = (options: SizeMixinOptions = {}): Declarations => [
  [$minHeight, options.minHeight],
]

/** 空间边界配置。 */
export interface BoundaryMixinOptions {
  border?: ValueInput | ValueInput[]
  borderColor?: ValueInput
  radius?: ValueInput
  cornerShape?: ValueInput
  outline?: {
    width?: ValueInput
    style?: ValueInput
    color?: ValueInput
    offset?: ValueInput
  }
}

/** Mixin：空间边界。 */
export const boundary = (options: BoundaryMixinOptions = {}): Declarations => [
  [$border, Array.isArray(options.border) ? valueSequence(...options.border) : options.border],
  [$borderColor, options.borderColor],
  [$borderRadius, options.radius],
  [$cornerShape, options.cornerShape],
  [$outlineWidth, options.outline?.width],
  [$outlineStyle, options.outline?.style],
  [$outlineColor, options.outline?.color],
  [$outlineOffset, options.outline?.offset],
]
