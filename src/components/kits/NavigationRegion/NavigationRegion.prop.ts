/** NavigationRegion：区域名称保留来源，内容交给原有 nav 结构。 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { NavigationRegionProps } from './NavigationRegion'

export const navigationRegionPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  label: 'state-source-view',
  children: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<NavigationRegionProps>
