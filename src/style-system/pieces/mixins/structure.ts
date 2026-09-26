/** 主体尺寸与边界 Mixin。 */
import type { Declarations } from '../../rule'
import type { ValueInput } from '../../value'
import { valueSequence } from '../contents/atom-creators/list'
import { $minHeight } from '../keys/size'
import { $border, $borderColor, $borderRadius, $cornerShape } from '../keys/border'
import { $outlineColor, $outlineOffset, $outlineStyle, $outlineWidth } from '../keys/outline'

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
