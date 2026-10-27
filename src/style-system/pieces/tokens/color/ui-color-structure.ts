/** 将 Color System 颜色材料转换为可声明、引用的 Token。 */
import { type Token, token } from '../../../token'
import type { ColorMaterial } from '@/color-system'
import { oklch } from '../../functions/oklch'

/**
 * 将 Color System 的颜色创建为可声明、引用的 JSS Token。
 * @example
 * // 用纸色定义表面 Token，由消费处自动建立 CSS 定义。
 * const surface = toColorToken(paper, 'example-surface')
 * rules('.Paper', { 'background-color': surface })
 */
export function toColorToken(color: ColorMaterial, name: string): Token {
  return token(oklch({ ...color.base, alpha: color.alpha }), name)
}
