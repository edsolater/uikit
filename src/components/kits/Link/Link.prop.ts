/** Link：href/current 保留来源身份，newTab 按当前值交给原生链接。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { LinkProps } from './Link'

export const linkPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  href: 'state-source-view',
  children: 'state-value-view',
  current: 'state-source-view',
  newTab: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<LinkProps>
