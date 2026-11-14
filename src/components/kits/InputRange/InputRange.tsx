/**
 * InputRange 是连续范围内的单值输入控件。
 *
 * 保留原生范围、步长、键盘和输入事件。
 *
 * 让数值调整复用浏览器行为，字段标题由上层组合提供。
 */
import type { PropsReadMode } from '../../tools/componentPropsDirector'
import { kit, type KitController } from '../../tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { pivPropsDefinition } from '../../Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '../../tools/KitMarker/KitMarker.prop'
import { Piv, type PivProps } from '../../Piv/Piv'
import type { ComponentDescriptionProps } from '../../tools/KitMarker/KitMarker'
import './InputRange.style'
import { useFormFieldId } from '../FormField/FormField'
import { val } from '@/foundation'

/** 原生范围输入声明，ref 接收当前组件的输入控制器。 */
export type InputRangeProps = PivProps<'input'> &
  ComponentDescriptionProps & { ref?: RefReceiver<InputRangeController> }
/** 原生输入字段与通用说明的读取协议，ref 只从上游交付。 */
const inputRangePropsDefinition = {
  ...pivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  ref: 'only-through-prop',
} satisfies Record<string, PropsReadMode>
/** 范围输入自身字段的运行期控制入口。 */
export type InputRangeController = KitController<
  InputRangeProps,
  typeof inputRangePropsDefinition
>

/**
 * 使用原生 min、max、step 和 value 调整连续数值。
 */
export const InputRange = kit(
  {
    name: 'InputRange',
    description: '调整范围内的数值',
    propsDefinition: inputRangePropsDefinition,
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
