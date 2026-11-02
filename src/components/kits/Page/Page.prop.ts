/** Page：标题与副标题持续消费来源，动作和正文保持 JSX 语义。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { PageProps } from './Page'

export const pagePropsDefinition = {
  ...componentDescriptionPropsDefinition,
  title: 'state-source-view',
  subtitle: 'state-source-view',
  actions: 'state-value-view',
  children: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<PageProps>
