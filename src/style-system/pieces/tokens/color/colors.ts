/** 共享主题颜色来源与线条转换；具体组件引用来源并保留自己的颜色加工。 */
import { token, type Token, type TokenInput } from '../../../token'
import { colorMix } from '../../functions/color-mix'
import { paperColor, inkColor } from './palette'

/** 组件默认承载面的全局来源；组件可引用并保留自己的交互加工。 */
export const globalSurfaceColor = token(paperColor, 'global-surface-color')

/** 普通文字与图标的全局内容来源；组件可在自身作用域覆盖。 */
export const contentColor = token(inkColor, 'global-content-color')

/** 多个线条共用的混合强度，可在全局或具体作用域声明。 */
export const lineStrength = token(0.18, 'line-strength')

/**
 * 在基础颜色的根据地读取当前 CSS 值，并与共享强度组合为线条。
 * 状态、主题与按需资源通过真实内容引用取得，来源本身不变。
 */
export const lineColor = (base: Token<TokenInput>): Token =>
  token(colorMix([base, lineStrength], 'transparent'), {
    name: base.name ? `${base.name}-line` : undefined,
    address: base.address,
    registration: base.registration,
  })
