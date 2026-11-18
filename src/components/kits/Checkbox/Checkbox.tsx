/**
 * Checkbox 表达带可点击标题的二态选择。
 *
 * 消费选中状态并传回原生交互结果。
 *
 * 选项标题与字段状态属于组件，业务选择规则留给调用方。
 */
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  checkboxPropDefinition,
  type CheckboxProps,
  type CheckboxController,
} from './Checkbox.prop'
import { Label } from '../Label/Label'
import { Piv } from '../../Piv/Piv'
import { createFormFieldId } from '../FormField/FormField'
import './Checkbox.style'
import { derive } from '@/hooks'

/**
 * 带可点击标题的二态表单选择。
 */
export const Checkbox: KitComponent<{
  props: CheckboxProps
  controller: CheckboxController
}> = kit(
  {
    name: componentName,
    componentDescription: '切换二态选项',
    propDefinition: checkboxPropDefinition,
  },
  (props, { name }) => {
    const id = createFormFieldId(props, crypto.randomUUID())
    const label = derive(props, (s) => s.label)
    return (
      <Piv shadowProps={props} class={name}>
        <Piv
          as="input"
          id={id}
          htmlProps={{
            type: 'checkbox',
            name: props.name,
            checked: props.checked,
            disabled: props.disabled,
            required: props.required,
          }}
          on={{
            change: ({ element }) => {
              props.onChange?.((element as HTMLInputElement).checked)
            },
          }}
        />
        <Label for={id} tooltip={props.tooltip}>
          {label}
        </Label>
      </Piv>
    )
  },
)
