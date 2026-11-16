/**
 * InputRange 是连续范围内的单值输入控件。
 *
 * 保留原生范围、步长、键盘和输入事件。
 *
 * 让数值调整复用浏览器行为，字段标题由上层组合提供。
 */
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  inputRangePropDefinition,
  type InputRangeProps,
  type InputRangeController,
} from './InputRange.prop'
import { Piv } from '../../Piv/Piv'
import './InputRange.style'
import { createFormFieldBinding, useFormFieldId } from '../FormField/FormField'

/**
 * 使用原生 min、max、step 和 value 调整连续数值。
 */
export const InputRange: KitComponent<{
  props: InputRangeProps
  controller: InputRangeController
}> = kit(
  {
    name: componentName,
    componentDescription: '调整范围内的数值',
    propDefinition: inputRangePropDefinition,
  },
  (props, { name }) => {
    const { id, rootProps } = createFormFieldBinding(props, useFormFieldId())
    return (
      <Piv
        as="input"
        shadowProps={rootProps}
        id={id}
        class={name}
        htmlProps={{ type: 'range' }}
      />
    )
  },
)
