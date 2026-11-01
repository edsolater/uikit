/** Flow：方向持续作为 Source 交给布局节点，内容保持 JSX 语义。 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { FlowProps } from './Flow'

export const flowPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  direction: 'state-source-view',
  children: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<FlowProps>
