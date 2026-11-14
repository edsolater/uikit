/** 数值展示：由原值和有效位数生成文本，不改写输入。 */
import { stateView, val, type Source } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { Text } from '../Text/Text'
import { tabularNum } from '@/components/plugins/kits/tabular-num/tabular-num'
import { numericPropsDefinition } from './Numeric.prop'

export type NumericProps = ComponentDescriptionProps & {
  value?: Source<number | null | undefined>
  significantDigits?: Source<number | undefined>
  ref?: RefReceiver<NumericController>
}
export type NumericController = KitController<
  NumericProps,
  typeof numericPropsDefinition
>

/** 固定显示指定有效位数（默认3）；缺值与非有限数显示斜杠，输入变化持续更新。 */
export const Numeric = kit(
  { name: 'Numeric', availableProps: numericPropsDefinition },
  (props: NumericProps) => {
    const text = stateView(() => {
      const value = val(props.value),
        digits = val(props.significantDigits) ?? 3
      return value == null || !Number.isFinite(value)
        ? '/'
        : new Intl.NumberFormat('zh-CN', {
            minimumSignificantDigits: digits,
            maximumSignificantDigits: digits,
          }).format(value)
    })
    return <Text is={tabularNum()}>{text}</Text>
  },
)
