/** 将分子与分母作为百分比展示；比值计算归组件，数值格式归Numeric。 */
import { Show, stateView, val, type Source } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { Numeric } from '../Numeric/Numeric'
import { Text } from '../Text/Text'
import { Piv } from '@/components/Piv/Piv'
import { percentPropsDefinition } from './Percent.prop'

export type PercentProps = ComponentDescriptionProps & {
  numerator?: Source<number | null | undefined>
  denominator?: Source<number | null | undefined>
  significantDigits?: Source<number | undefined>
  ref?: RefReceiver<PercentController>
}
export type PercentController = KitController<
  PercentProps,
  typeof percentPropsDefinition
>

/** 内部计算分子/分母×100并加百分号；缺值、非有限数或零分母整项显示斜杠。 */
export const Percent = kit(
  { name: 'Percent', availableProps: percentPropsDefinition },
  (props: PercentProps) => {
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
      <Piv as="span">
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
