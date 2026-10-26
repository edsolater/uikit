/** 主体尺寸与边界 Mixin。 */
import type { Declarations } from '../../rule'
import type { TokenInput } from '../../token'
import { valueSequence } from '../contents/atom-creators/list'
import { $minHeight } from '../keys/size'
import {
  $border,
  $borderColor,
  $borderRadius,
  $cornerShape,
} from '../keys/border'
import {
  $outlineColor,
  $outlineOffset,
  $outlineStyle,
  $outlineWidth,
} from '../keys/outline'

/** 盒子尺寸配置。 */
export interface SizeMixinOptions {
  minHeight?: TokenInput
}

/**
 * 生成盒子尺寸声明。
 */
export const size = (options: SizeMixinOptions = {}): Declarations => [
  [$minHeight, options.minHeight],
]

/** 空间边界配置。 */
export interface BoundaryMixinOptions {
  border?: TokenInput | TokenInput[]
  borderColor?: TokenInput
  radius?: TokenInput
  cornerShape?: TokenInput
  outline?: {
    width?: TokenInput
    style?: TokenInput
    color?: TokenInput
    offset?: TokenInput
  }
}

/**
 * 生成空间边界声明。
 */
export const boundary = (options: BoundaryMixinOptions = {}): Declarations => [
  [
    $border,
    Array.isArray(options.border)
      ? valueSequence(...options.border)
      : options.border,
  ],
  [$borderColor, options.borderColor],
  [$borderRadius, options.radius],
  [$cornerShape, options.cornerShape],
  [$outlineWidth, options.outline?.width],
  [$outlineStyle, options.outline?.style],
  [$outlineColor, options.outline?.color],
  [$outlineOffset, options.outline?.offset],
]
