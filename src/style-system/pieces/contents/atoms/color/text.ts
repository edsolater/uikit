/** 内容颜色及其交互状态。 */
import { variable } from '../../../../variable'
import { variableCluster } from '../../../../variable-cluster'

export const textColor = variableCluster({
  default: variable('var(--color-fg)', { name: 'text-color' }),
  strong: variable('var(--color-fg-strong)', { name: 'text-color-strong' }),
})

export const foregroundColorInteractive = variable(textColor, {
  name: 'foreground-color-interactive',
  states: {
    hover: textColor('strong'),
    active: textColor('strong'),
    disabled: source => source,
  },
})
