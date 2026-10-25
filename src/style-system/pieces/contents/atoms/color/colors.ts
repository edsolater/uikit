/** 共享主题颜色来源与线条转换；具体组件引用来源并保留自己的颜色加工。 */
import { mapVariableRules, variable, type Variable } from '../../../../variable'
import { colorMix } from '../../functions/color-mix'
import { paperColor, inkColor } from './palette'

/** 组件默认承载面的全局来源；组件可引用并保留自己的交互加工。 */
export const globalSurfaceColor = variable(paperColor, 'global-surface-color')

/** 普通文字与图标的全局内容来源；组件可在自身作用域覆盖。 */
export const globalContentColor = variable(inkColor, 'global-content-color')

/** 多个线条共用的混合强度，可在全局或具体作用域声明。 */
export const lineStrength = variable(0.18, 'line-strength')

/**
 * 将基础的默认、状态与变体最终颜色转换为线条，沿用根据地、声明等级和注册配置。
 * 基础与共享强度保留真实引用，来源本身不变。
 */
export const lineColor = (base: Variable): Variable =>
  mapVariableRules(base, current => colorMix([current, lineStrength], 'transparent'), `${base.name}-line`)
