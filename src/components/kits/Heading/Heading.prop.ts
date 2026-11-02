/** Heading：复用原生字段，level 只在创建时选择标题标签。 */
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { HeadingProps } from './Heading'

const { as: _as, id: _id, ...headingPivPropsDefinition } = pivPropsDefinition

export const headingPropsDefinition = {
  ...headingPivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  level: 'state-untracked',
  ref: 'only-through-prop',
} satisfies PropsDefinition<HeadingProps>
