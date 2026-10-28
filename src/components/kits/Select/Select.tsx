import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { derive } from '@/hooks/stateUtils'
import { For, val, type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Select.style'
export type SelectProps = ComponentDescriptionProps & {
  id?: Source<string>
  name?: string
  value: Source<string>
  options: Source<{ value: string; label: string }[]>
  disabled?: Source<boolean>
  required?: boolean
  onChange?: (value: string) => void
}
/** 有限选项的原生单选字段，持续消费值和选项来源。 */
export function Select(props: SelectProps) {
  return (
    <ComponentWrapper
      componentName="Select"
      defaultDescription="从有限选项中选择"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv
        as="select"
        class="Select"
        id={props.id}
        htmlProps={{
          name: props.name,
          value: props.value,
          disabled: props.disabled,
          required: props.required,
        }}
        on={{
          change: ({ element }) => {
            props.onChange?.((element as HTMLSelectElement).value)
          },
        }}
      >
        <For each={val(props.options)}>
          {(option) => (
            <Piv
              as="option"
              htmlProps={{
                value: option.value,
                selected: derive(
                  props.value,
                  (value) => value === option.value,
                ),
              }}
            >
              {option.label}
            </Piv>
          )}
        </For>
      </Piv>
    </ComponentWrapper>
  )
}
