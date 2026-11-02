/** Field：内容工厂仅在构建时使用，标题保留响应式来源。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { FieldProps } from './Field'

export const fieldPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  label: 'state-source-view',
  tooltip: 'state-value-view',
  children: 'only-through-prop',
  ref: 'only-through-prop',
} satisfies PropsDefinition<FieldProps>
