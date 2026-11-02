/** Details：摘要与开关保留来源，正文沿原生 details 交互消费。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { DetailsProps } from './Details'

export const detailsPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  summary: 'state-value-view',
  open: 'state-source-view',
  children: 'state-value-view',
  domRef: 'only-through-prop',
  onToggle: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<DetailsProps>
