/** 内容颜色及其交互状态。 */
import { variable, variableFrom } from '../../core/css-variable'
import { variableCluster } from '../../core/variable-cluster'

export const textColor = variableCluster({
  default: variable('var(--color-fg)', { name: 'text-color' }),
  strong: variable('var(--color-fg-strong)', { name: 'text-strong-color' }),
})

export const interactiveForegroundColor = variableFrom(textColor, {
  name: 'interactive-foreground-color',
  states: {
    hover: textColor('strong'),
    active: textColor('strong'),
    disabled: source => source,
  },
})
