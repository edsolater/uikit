/** Checkbox：勾选与标题保留来源，onChange 保留回调身份。 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { CheckboxProps } from './Checkbox'

export const checkboxPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  name: 'state-value-view',
  checked: 'state-source-view',
  label: 'state-source-view',
  tooltip: 'state-value-view',
  disabled: 'state-source-view',
  required: 'state-value-view',
  onChange: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<CheckboxProps>
