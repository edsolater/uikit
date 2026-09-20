/** 基础色阶由 CSS 提供，Cluster 只选择已有 Variable。 */
import { variable } from '../../core/css-variable'
import { variableCluster } from '../../core/variable-cluster'

const neutralBaseColor = variable('var(--dye-neutral-0)', { name: 'neutral-base-color' })
export const neutralColor = variableCluster({
  default: neutralBaseColor,
  0: neutralBaseColor,
  1: variable('var(--dye-neutral-1)', { name: 'neutral-1-color' }),
  2: variable('var(--dye-neutral-2)', { name: 'neutral-2-color' }),
  3: variable('var(--dye-neutral-3)', { name: 'neutral-3-color' }),
  4: variable('var(--dye-neutral-4)', { name: 'neutral-4-color' }),
  5: variable('var(--dye-neutral-5)', { name: 'neutral-5-color' }),
  6: variable('var(--dye-neutral-6)', { name: 'neutral-6-color' }),
  7: variable('var(--dye-neutral-7)', { name: 'neutral-7-color' }),
  8: variable('var(--dye-neutral-8)', { name: 'neutral-8-color' }),
})
/** 品牌身份色，基础 CSS 继续拥有主题定义。 */
export const brandColor = variable('var(--color-brand)', { name: 'brand-color' })
