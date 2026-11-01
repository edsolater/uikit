/**
 * TextArea 承载带原生字段身份的多行编辑。
 *
 * 持续消费文本、提示与禁用状态，并传回输入后的文字。
 *
 * 把字段编辑与上层标题、校验编排分开。
 */
import { kit } from '@/components/utils/kit'
import type { PropsController } from '@/components/utils/componentPropsDirector'
import type { RefReceiver } from '@/hooks/createRef'
import { textAreaPropsDefinition } from './TextArea.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './TextArea.style'
export type TextAreaProps = ComponentDescriptionProps & {
  ref?: RefReceiver<TextAreaController>
  id?: Source<string | undefined>
  name?: string
  value: Source<string>
  placeholder?: Source<string | undefined>
  disabled?: Source<boolean | undefined>
  required?: boolean
  rows?: number
  onInput?: (value: string) => void
}
/** TextArea 自有 Props 的指令式入口；ref 只从上游交付。 */
export type TextAreaController = PropsController<TextAreaProps, typeof textAreaPropsDefinition>

/**
 * 带原生字段身份的多行编辑，保留受控值与表单校验。
 */
export const TextArea = kit(
  {
    name: 'TextArea',
    description: '编辑多行文字',
    availableProps: textAreaPropsDefinition,
  },
  (props: TextAreaProps) => {
    return (
      <Piv
        as="textarea"
        class="TextArea"
        id={props.id}
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
