/** MessageBoard：语气沿来源驱动反馈语义，内容继续由 Board 承载。 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { MessageBoardProps } from './MessageBoard'

export const messageBoardPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  tone: 'state-source-view',
  children: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<MessageBoardProps>
