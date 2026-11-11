/** 连续范围内的单值调整，保留原生键盘与输入事件。 */
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import './InputRange.style'
import { useFormFieldId } from '../FormField/FormField'
import { val } from '@/foundation'

export type InputRangeProps = PivProps<'input'> &
  ComponentDescriptionProps & { ref?: RefReceiver<InputRangeController> }
const inputRangePropsDefinition = {
  ...pivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  ref: 'only-through-prop',
} as const
export type InputRangeController = KitController<
  InputRangeProps,
  typeof inputRangePropsDefinition
>

/** 使用原生 min、max、step 和 value 调整连续数值。 */
export const InputRange = kit(
  {
    name: 'InputRange',
    description: '调整范围内的数值',
    availableProps: inputRangePropsDefinition,
  },
  (props: InputRangeProps) => {
    const fieldId = useFormFieldId()
    return (
      <Piv
        as="input"
        shadowProps={props}
        id={val(props.id) ?? fieldId ?? undefined}
        class="InputRange"
        htmlProps={{ type: 'range' }}
      />
    )
  },
)
