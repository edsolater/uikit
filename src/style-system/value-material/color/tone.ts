/** 基础语义配色及当前作用域的语气材料。 */
import { variable } from '../../core/css-variable'
import { variableCluster } from '../../core/variable-cluster'
import { colorMix } from '../../values/functions/color-mix'
import { surfaceColor } from './surface'

export const accentColor = variableCluster({
  default: variable('var(--color-accent)', { name: 'accent-color' }),
  soft: variable('var(--color-accent-soft)', { name: 'accent-soft-color' }),
  strong: variable('var(--color-accent-strong)', { name: 'accent-strong-color' }),
  foreground: variable('var(--color-accent-fg)', { name: 'accent-foreground-color' }),
  focus: variable('var(--color-accent-focus)', { name: 'accent-focus-color' }),
})

const dangerBaseColor = variable('var(--color-bad)', { name: 'danger-base-color' })
export const dangerColor = variableCluster({
  default: dangerBaseColor,
  soft: variable('var(--color-bad-soft)', { name: 'danger-soft-color' }),
  strong: dangerBaseColor,
  foreground: variable('var(--color-bad-fg)', { name: 'danger-foreground-color' }),
  line: variable('var(--color-bad-line)', { name: 'danger-line-color' }),
})

export const toneColor = variableCluster({
  default: variable(accentColor, { name: 'tone-color' }),
  soft: variable(accentColor('soft'), { name: 'tone-soft-color' }),
  strong: variable(accentColor('strong'), { name: 'tone-strong-color' }),
  foreground: variable(accentColor('foreground'), { name: 'tone-foreground-color' }),
})

/** 语气承载面，配方和状态留在定义端。 */
export const toneSurfaceColor = variable(colorMix([surfaceColor, 0.76], toneColor('soft')), {
  name: 'tone-surface-color',
  states: {
    hover: colorMix([surfaceColor, 0.66], toneColor('soft')),
    active: colorMix([surfaceColor, 0.56], toneColor('soft')),
  },
})
