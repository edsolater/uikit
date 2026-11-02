/** 帮助入口的内容来源及可选实例控制字段。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { HelpProps } from './Help'

export const helpPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  tooltip: 'state-source-view',
  trigger: 'state-source-view',
  name: 'state-source-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<HelpProps>
