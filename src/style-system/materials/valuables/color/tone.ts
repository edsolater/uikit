/** 基础语义配色及当前作用域的语气材料。 */
import { variable } from '../../../variable'
import { variableCluster } from '../../../variable-cluster'
import { colorMix } from '../../valuable-tools/functions/color-mix'
import { surfaceColor } from './surface'

export const accentColor = variableCluster({
  default: variable('var(--color-accent)', { name: 'accent-color' }),
  soft: variable('var(--color-accent-soft)', { name: 'accent-color-soft' }),
  strong: variable('var(--color-accent-strong)', { name: 'accent-color-strong' }),
  foreground: variable('var(--color-accent-fg)', { name: 'accent-color-foreground' }),
  line: variable('var(--color-accent-focus)', { name: 'accent-color-line' }),
})

const dangerColorStrong = variable('var(--color-bad)', { name: 'danger-color-strong' })
export const dangerColor = variableCluster({
  default: dangerColorStrong,
  soft: variable('var(--color-bad-soft)', { name: 'danger-color-soft' }),
  strong: dangerColorStrong,
  foreground: variable('var(--color-bad-fg)', { name: 'danger-color-foreground' }),
  line: variable('var(--color-bad-line)', { name: 'danger-color-line' }),
})

export const toneColor = variableCluster({
  default: variable(accentColor, { name: 'tone-color' }),
  soft: variable(accentColor('soft'), { name: 'tone-color-soft' }),
  strong: variable(accentColor('strong'), { name: 'tone-color-strong' }),
  foreground: variable(accentColor('foreground'), { name: 'tone-color-foreground' }),
  line: variable(accentColor('line'), { name: 'tone-color-line' }),
})

/** 语气承载面，配方和状态留在定义端。 */
export const surfaceColorTone = variable(colorMix([surfaceColor, 0.76], toneColor('soft')), {
  name: 'surface-color-tone',
  states: {
    hover: colorMix([surfaceColor, 0.66], toneColor('soft')),
    active: colorMix([surfaceColor, 0.56], toneColor('soft')),
  },
})
