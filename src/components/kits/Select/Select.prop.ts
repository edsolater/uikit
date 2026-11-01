/** Select：值与选项保留来源，回调由原生 change 事件读取。 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { SelectProps } from './Select'

export const selectPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  name: 'state-value-view',
  value: 'state-source-view',
  options: 'state-source-view',
  disabled: 'state-source-view',
  required: 'state-value-view',
  onChange: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<SelectProps>
