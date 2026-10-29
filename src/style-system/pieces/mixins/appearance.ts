/** 颜色与层级 Mixin。 */
import type { Declarations } from '../../rule'
import type { TokenInput } from '../../token'
import { color, type ColorInput } from '../functions/color'
import { valueList } from '../token-factory/list'
import {
  $backgroundColor,
  $color,
  $boxShadow,
} from '@/style-system/key-registry'

/** 内容色与背景颜色配置。 */
export interface ColorMixinOptions {
  content?: ColorInput
  background?: ColorInput
}

/**
 * 生成主体颜色声明。
 */
export const paint = (options: ColorMixinOptions = {}): Declarations => [
  [$color, options.content === undefined ? undefined : color(options.content)],
  [
    $backgroundColor,
    options.background === undefined ? undefined : color(options.background),
  ],
]

/**
 * 生成视觉层级的阴影声明。
 */
export const elevation = (level?: TokenInput | TokenInput[]): Declarations => [
  [$boxShadow, Array.isArray(level) ? valueList(...level) : level],
]
