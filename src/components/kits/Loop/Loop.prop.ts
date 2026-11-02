/** Loop：each 保留普通 Accessor；children 是构建工厂，已有 fallback 保留后续空分支读取。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { LoopProps } from './Loop'

export const loopPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  each: 'state-value-view',
  children: 'only-through-prop',
  fallback: 'state-untracked',
  ref: 'only-through-prop',
} satisfies PropsDefinition<LoopProps<unknown>>
