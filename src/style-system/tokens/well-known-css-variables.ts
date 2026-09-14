/** 默认、悬停和按下状态的共享颜色变量。 */
import { variable } from '../core/css-variable'
import type { Value } from '../core/css-value'
import { colorMix } from './css-color-mix'

/** 用 '*' 注册且不设初值，让未赋值的变量仍能使用 fallback。 */
function inheritedVariable(name: string, fallback: Value) {
  return variable(name, { fallback, registration: { syntax: '*', inherits: true } })
}

export const surfaceColor = Object.assign(inheritedVariable('surface-color', variable('dye-neutral-1')), {
  hover: inheritedVariable('surface-color-hover', variable('dye-neutral-2')),
  active: inheritedVariable('surface-color-active', variable('dye-neutral-3')),
})

export const bgColor = Object.assign(
  inheritedVariable('bg', colorMix([surfaceColor, 0.82], variable('color-accent-soft'))),
  {
    hover: inheritedVariable('bg-hover', colorMix([surfaceColor.hover, 0.72], variable('color-accent-soft'))),
    active: inheritedVariable('bg-active', colorMix([surfaceColor.active, 0.62], variable('color-accent-soft'))),
  },
)

export const fgColor = Object.assign(inheritedVariable('fg', variable('color-fg')), {
  hover: inheritedVariable('fg-hover', variable('color-fg-strong')),
  active: inheritedVariable('fg-active', variable('color-fg-strong')),
})
