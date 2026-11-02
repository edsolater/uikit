/** Input：组合 Piv、用途说明与有效性字段，不重复维护其定义。 */
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { InputProps } from './Input'
import { inputValidityPropsDefinition } from './createInputValidity.prop'

export const inputPropsDefinition = {
  ...pivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  ...inputValidityPropsDefinition,
  type: 'state-value-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<InputProps>
