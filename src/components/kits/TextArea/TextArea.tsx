import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { type Source } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './TextArea.style'
export type TextAreaProps = ComponentDescriptionProps & {
  id?: Source<string>
  name?: string
  value: Source<string>
  placeholder?: Source<string>
  disabled?: Source<boolean>
  required?: boolean
  rows?: number
  onInput?: (value: string) => void
}
/** 带原生字段身份的多行编辑，保留受控值与表单校验。 */
export function TextArea(props: TextAreaProps) {
  return (
    <ComponentMarker
      componentName="TextArea"
      defaultDescription="编辑多行文字"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
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
    </ComponentMarker>
  )
}
