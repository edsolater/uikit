/** 实心动作配色，交互状态属于默认颜色成员。 */
import { variable } from '../../core/css-variable'
import { variableCluster } from '../../core/variable-cluster'

const actionBaseColor = variable('var(--color-action)', {
  name: 'action-color',
  states: {
    hover: 'var(--color-action-hover)',
    active: 'var(--color-action-active)',
  },
  registration: { syntax: '*', inherits: true },
})

export const actionColor = variableCluster({
  default: actionBaseColor,
  line: variable('var(--color-action-line)', { name: 'action-line-color' }),
  foreground: variable('var(--color-action-fg)', { name: 'action-foreground-color' }),
})
