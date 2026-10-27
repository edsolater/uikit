/**
 * 颜色材料的 JSS 转换与用途成员构造。
 *
 * 转换材料，并按来源 Token 创建颜色族成员及可读内容色。
 *
 * 共用构造依赖颜色与样式基础能力，各用途定义可单向复用。
 */
import type { TokenInput } from '../../../token'
import { type Token, token } from '../../../token'
import { colorMix } from '../../functions/color-mix'
import type { ColorMaterial } from '@/color-system'
import { oklch } from '../../functions/oklch'

/**
 * 将 Color System 的颜色创建为可声明、引用的 JSS Token。
 * @example
 * // 用纸色定义表面变量；样式可局部声明另一颜色。
 * const surface = toColorToken(paper, 'example-surface')
 * declare(surface, 'white')
 */
export function toColorToken(color: ColorMaterial, name: string): Token {
  return token(oklch({ ...color.base, alpha: color.alpha }), name)
}

/**
 * 由当前底色求可读内容色，并按原配方保留少量底色气息。
 */
export function readableContent(base: TokenInput) {
  const contrast = token<TokenInput>(base, {
    toCSSString: (base, resolve) => {
      const source = resolve(base)
      return source === undefined ? undefined : `contrast-color(${source})`
    },
  })
  return colorMix([contrast, 0.8], [base, 0.2])
}
