/** Percent的分子、分母、有效位数及标准组件控制字段。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { PercentProps } from './Percent'

export const percentPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  numerator: 'state-source-view',
  denominator: 'state-source-view',
  significantDigits: 'state-source-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<PercentProps>
