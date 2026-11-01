/**
 * Select 表达有限选项中的单项选择。
 *
 * 保留原生字段身份，持续消费值与选项来源。
 *
 * 调用方提供选项和数据，组件保留原生选择语义。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { selectPropsDefinition } from './Select.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { derive } from '@/hooks/stateUtils'
import { For, val, type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Select.style'
export type SelectProps = ComponentDescriptionProps & {
  ref?: RefReceiver<SelectController>
  id?: Source<string | undefined>
  name?: string
  value: Source<string>
  options: Source<{ value: string; label: string }[]>
  disabled?: Source<boolean | undefined>
  required?: boolean
  onChange?: (value: string) => void
}
/** Select 自有 Props 的指令式入口；ref 只从上游交付。 */
export type SelectController = KitController<SelectProps, typeof selectPropsDefinition>

/**
 * 有限选项的原生单选字段，持续消费值和选项来源。
 */
export const Select = kit(
  {
    name: 'Select',
    description: '从有限选项中选择',
    availableProps: selectPropsDefinition,
  },
  (props: SelectProps) => {
    return (
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
    )
  },
)
