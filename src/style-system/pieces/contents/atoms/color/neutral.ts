/** 中性色阶 Variable Cluster；数字只表示已经声明的成员。 */
import { variable } from '../../../../variable'
import { variableCluster } from '../../../../variable-cluster'

const neutralColor0 = variable('var(--dye-neutral-0)', { name: 'neutral-color-0' })

export const neutralColor = variableCluster({
  default: neutralColor0,
  0: neutralColor0,
  1: variable('var(--dye-neutral-1)', { name: 'neutral-color-1' }),
  2: variable('var(--dye-neutral-2)', { name: 'neutral-color-2' }),
  3: variable('var(--dye-neutral-3)', { name: 'neutral-color-3' }),
  4: variable('var(--dye-neutral-4)', { name: 'neutral-color-4' }),
  5: variable('var(--dye-neutral-5)', { name: 'neutral-color-5' }),
  6: variable('var(--dye-neutral-6)', { name: 'neutral-color-6' }),
  7: variable('var(--dye-neutral-7)', { name: 'neutral-color-7' }),
  8: variable('var(--dye-neutral-8)', { name: 'neutral-color-8' }),
})
