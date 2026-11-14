/** Grid：按当前列数取值，保留未声明时的一列默认值。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { GridProps } from './Grid'

export const gridPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  columns: 'state-value-view',
  columnSpan: 'state-value-view',
  responsive: 'state-value-view',
  gap: 'state-value-view',
  columnRule: 'state-value-view',
  rowRule: 'state-value-view',
  grow: 'state-value-view',
  label: 'state-source-view',
  children: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<GridProps>
