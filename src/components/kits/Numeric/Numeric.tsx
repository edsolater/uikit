/**
 * Numeric 是统一有效位数的数值展示组件。
 *
 * 将原值格式化为中文环境的数字文本，缺值或非有限数显示斜杠。
 *
 * 让数值表达保持一致，同时保留上游数据。
 */
import { stateView, val, type Source } from '@/foundation'
import type { ComponentDescriptionProps } from '../../tools/KitMarker/KitMarker'
import { kit, type KitController } from '../../tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { Text } from '../Text/Text'
import { tabularNum } from '../../plugins/kits/tabular-num/tabular-num'
import { numericPropsDefinition } from './Numeric.prop'

/** 原值及有效位数输入，未指定有效位数时使用三位。 */
export type NumericProps = ComponentDescriptionProps & {
  value?: Source<number | null | undefined>
  significantDigits?: Source<number | undefined>
  ref?: RefReceiver<NumericController>
}
/** 数值展示输入的控制入口，更新后继续沿原格式规则显示。 */
export type NumericController = KitController<
  NumericProps,
  typeof numericPropsDefinition
>

/**
 * 固定显示指定有效位数（默认3）；缺值与非有限数显示斜杠，输入变化持续更新。
 */
export const Numeric = kit(
  { name: 'Numeric', propsDefinition: numericPropsDefinition },
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
