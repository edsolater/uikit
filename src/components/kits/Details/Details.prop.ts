/** Details：摘要与开关保留来源，正文沿原生 details 交互消费。 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { DetailsProps } from './Details'

export const detailsPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  summary: 'state-source-view',
  open: 'state-source-view',
  children: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<DetailsProps>
