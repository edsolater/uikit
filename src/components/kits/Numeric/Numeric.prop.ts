/** Numeric的原始数值、有效位数及标准组件控制字段。 */
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { NumericProps } from './Numeric'

export const numericPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  value: 'state-source-view',
  significantDigits: 'state-source-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<NumericProps>
