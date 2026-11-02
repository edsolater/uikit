/** TextArea：保留文本、提示与禁用来源，原生字段和回调按当前值消费。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { TextAreaProps } from './TextArea'

export const textAreaPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  name: 'state-value-view',
  value: 'state-source-view',
  placeholder: 'state-source-view',
  disabled: 'state-source-view',
  required: 'state-value-view',
  rows: 'state-value-view',
  onInput: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<TextAreaProps>
