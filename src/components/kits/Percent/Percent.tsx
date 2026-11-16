/**
 * Percent 是分子与分母的百分比展示组件。
 *
 * 计算比值并组合 Numeric 显示数字和百分号，无有效比值时显示斜杠。
 *
 * 将比值语义与数字格式分别交给负责的组件。
 */
import { Show, stateView, val } from '@/foundation'
import { Numeric } from '../Numeric/Numeric'
import { Text } from '../Text/Text'
import { Piv } from '../../Piv/Piv'

import { kit, type KitComponent } from '../../tools/kit'

import {
  componentName,
  percentPropDefinition,
  type PercentProps,
  type PercentController,
} from './Percent.prop'

/**
 * 将分子与分母的比值呈现为百分数；缺值、非有限数或零分母整项显示斜杠。
 */
export const Percent: KitComponent<PercentProps, PercentController> = kit(
  { name: componentName, propDefinition: percentPropDefinition },
  (props, { name }) => {
    const percentage = stateView(() => {
      const numerator = val(props.numerator),
        denominator = val(props.denominator)
      if (
        numerator == null ||
        denominator == null ||
        !Number.isFinite(numerator) ||
        !Number.isFinite(denominator) ||
        denominator === 0
      )
        return undefined
      return (numerator / denominator) * 100
    })
    return (
      <Piv as="span" shadowProps={props} class={name}>
        <Show when={val(percentage) !== undefined} fallback={<Text>/</Text>}>
          <Numeric
            value={percentage}
            significantDigits={props.significantDigits}
          />
          <Text>%</Text>
        </Show>
      </Piv>
    )
  },
)
