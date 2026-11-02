/** PopoverSurface：复用已有宿主字段，锚点和位置保留来源。 */
import { pick } from '@edsolater/fnkit'
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { PopoverSurfaceProps } from './PopoverSurface'

export const popoverSurfacePropsDefinition = {
  ...pick(pivPropsDefinition, ['id', 'class', 'style', 'domRef', 'on', 'children']),
  ...componentDescriptionPropsDefinition,
  htmlProps: 'state-value-view',
  anchor: 'state-source-view',
  placement: 'state-source-view',
  popover: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<PopoverSurfaceProps>
