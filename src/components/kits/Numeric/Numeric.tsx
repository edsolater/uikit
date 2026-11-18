/**
 * Numeric 是统一有效位数的数值展示组件。
 *
 * 将原值格式化为中文环境的数字文本，缺值或非有限数显示斜杠。
 *
 * 让数值表达保持一致，同时保留上游数据。
 */
import { Text } from '../Text/Text'
import { val } from '@/foundation'
import { derive } from '@/hooks'
import { kit, type KitComponent } from '../../tools/kit'

import { tabularNum } from '../../plugins/kits/tabular-num/tabular-num'
import {
  componentName,
  numericPropDefinition,
  type NumericProps,
  type NumericController,
} from './Numeric.prop'

/**
 * 固定显示指定有效位数（默认3）；缺值与非有限数显示斜杠，输入变化持续更新。
 */
export const Numeric: KitComponent<{
  props: NumericProps
  controller: NumericController
}> = kit(
  { name: componentName, propDefinition: numericPropDefinition },
  (props, { name }) => {
    const text = derive(props, s => {
      const value = val(s.value),
        digits = val(s.significantDigits) ?? 3
      return value == null || !Number.isFinite(value)
        ? '/'
        : new Intl.NumberFormat('zh-CN', {
            minimumSignificantDigits: digits,
            maximumSignificantDigits: digits,
          }).format(value)
    })
    return (
      <Text shadowProps={props} class={name} is={tabularNum()}>
        {text}
      </Text>
    )
  },
)
