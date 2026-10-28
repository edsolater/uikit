import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Checkbox.style'
/** 带可点击标题的二态表单选择。 */
export function Checkbox(
  props: ComponentDescriptionProps & {
    id?: Source<string>
    name?: string
    checked: Source<boolean>
    label: Source<string>
    disabled?: Source<boolean>
    required?: boolean
    onChange?: (checked: boolean) => void
  },
) {
  return (
    <ComponentWrapper
      componentName="Checkbox"
      defaultDescription="切换二态选项"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv as="label" class="Checkbox">
        <Piv
          as="input"
          id={props.id}
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
        <Piv as="span">{props.label}</Piv>
      </Piv>
    </ComponentWrapper>
  )
}
