/**
 * TextArea 承载带原生字段身份的多行编辑。
 *
 * 持续消费文本、提示与禁用状态，并传回输入后的文字。
 *
 * 把字段编辑与上层标题、校验编排分开。
 */
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  textAreaPropDefinition,
  type TextAreaProps,
  type TextAreaController,
} from './TextArea.prop'
import { Piv } from '../../Piv/Piv'
import { createFormFieldId, useFormFieldId } from '../FormField/FormField'
import './TextArea.style'

/**
 * 带原生字段身份的多行编辑，保留受控值与表单校验。
 */
export const TextArea: KitComponent<{
  props: TextAreaProps
  controller: TextAreaController
}> = kit(
  {
    name: componentName,
    componentDescription: '编辑多行文字',
    propDefinition: textAreaPropDefinition,
  },
  (props, { name }) => {
    const id = createFormFieldId(props, useFormFieldId())
    return (
      <Piv
        as="textarea"
        shadowProps={props}
        class={name}
        id={id}
        htmlProps={{
          name: props.name,
          value: props.value,
          placeholder: props.placeholder,
          disabled: props.disabled,
          required: props.required,
          rows: props.rows ?? 3,
        }}
        on={{
          input: ({ element }) => {
            props.onInput?.((element as HTMLTextAreaElement).value)
          },
        }}
      />
    )
  },
)
