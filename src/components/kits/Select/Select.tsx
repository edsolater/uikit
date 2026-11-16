/**
 * Select 表达有限选项中的单项选择。
 *
 * 保留原生字段身份，持续消费值与选项来源。
 *
 * 调用方提供选项和数据，组件保留原生选择语义。
 */
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  selectPropDefinition,
  type SelectProps,
  type SelectController,
} from './Select.prop'
import { derive } from '@/hooks/stateUtils'
import { For, val } from '@/foundation'
import { Piv } from '../../Piv/Piv'
import './Select.style'
import { createFormFieldBinding, useFormFieldId } from '../FormField/FormField'

/**
 * 有限选项的原生单选字段，持续消费值和选项来源。
 */
export const Select: KitComponent<SelectProps, SelectController> = kit(
  {
    name: componentName,
    description: '从有限选项中选择',
    propDefinition: selectPropDefinition,
  },
  (props, { name }) => {
    const { id, rootProps } = createFormFieldBinding(props, useFormFieldId())
    return (
      <Piv
        as="select"
        shadowProps={rootProps}
        class={name}
        id={id}
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
