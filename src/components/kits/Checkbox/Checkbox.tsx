/**
 * Checkbox 表达带可点击标题的二态选择。
 *
 * 消费选中状态并传回原生交互结果。
 *
 * 选项标题与字段状态属于组件，业务选择规则留给调用方。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { checkboxPropsDefinition } from './Checkbox.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { stateView, val, type Source } from '@/foundation'
import { Label, type LabelProps } from '../Label/Label'
import { Piv } from '@/components/Piv/Piv'
import './Checkbox.style'
/** Checkbox 的声明输入；初始状态通过 Props 表达。 */
export type CheckboxProps = ComponentDescriptionProps & {
  ref?: RefReceiver<CheckboxController>
  id?: Source<string | undefined>
  name?: string
  checked: Source<boolean>
  label: Source<string>
  tooltip?: LabelProps['tooltip']
  disabled?: Source<boolean | undefined>
  required?: boolean
  onChange?: (checked: boolean) => void
}

/** Checkbox 自有 Props 的指令式入口；ref 只从上游交付。 */
export type CheckboxController = KitController<
  CheckboxProps,
  typeof checkboxPropsDefinition
>

/**
 * 带可点击标题的二态表单选择。
 */
export const Checkbox = kit(
  {
    name: 'Checkbox',
    description: '切换二态选项',
    availableProps: checkboxPropsDefinition,
  },
  (props: CheckboxProps) => {
    const generatedId = crypto.randomUUID()
    const id = stateView(() => val(props.id) ?? generatedId)
    return (
      <Piv class="Checkbox">
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
          {props.label}
        </Label>
      </Piv>
    )
  },
)
