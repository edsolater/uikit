/** 颜色与层级 Mixin。 */
import type { Declarations } from '../../rule'
import type { TokenInput } from '../../token'
import { valueList } from '../token-factory/list'
import {
  $backgroundColor,
  $color,
  $boxShadow,
} from '@/style-system/key-registry'

/** 内容色与背景颜色配置。 */
export interface ColorMixinOptions {
  content?: TokenInput
  background?: TokenInput
}

/**
 * 生成主体颜色声明。
 */
export const color = (options: ColorMixinOptions = {}): Declarations => [
  [$color, options.content],
  [$backgroundColor, options.background],
]

/**
 * 生成视觉层级的阴影声明。
 */
export const elevation = (level?: TokenInput | TokenInput[]): Declarations => [
  [$boxShadow, Array.isArray(level) ? valueList(...level) : level],
]
