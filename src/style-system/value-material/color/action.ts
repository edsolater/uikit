/** 实心动作配色，交互状态属于默认颜色成员。 */
import { variable } from '../../core/css-variable'
import { variableCluster } from '../../core/variable-cluster'

export const actionColor = variableCluster({
  default: variable('var(--color-action)', {
    name: 'action-color',
    states: {
      hover: 'var(--color-action-hover)',
      active: 'var(--color-action-active)',
    },
    registration: { syntax: '*', inherits: true },
  }),
  line: variable('var(--color-action-line)', { name: 'action-color-line' }),
  foreground: variable('var(--color-action-fg)', { name: 'action-color-foreground' }),
})
