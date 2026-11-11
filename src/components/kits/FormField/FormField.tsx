/** 显式字段组合：为标题和单个控件提供同一个原生身份。 */
import {
  createContext,
  useContext,
  val,
  type JSX,
  type Source,
} from '@/foundation'
import { kit, type KitController } from '@/components/tools/kit'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { RefReceiver } from '@/hooks/createRef'
import { Flow } from '../Flow/Flow'

const FormFieldIdContext = createContext<string | null>(null)
/**
 * 取得最近 FormField 的控件 ID；字段外返回 null。
 */
export function useFormFieldId() {
  return useContext(FormFieldIdContext)
}

export type FormFieldProps = ComponentDescriptionProps & {
  ref?: RefReceiver<FormFieldController>
  id?: Source<string | undefined>
  children?: JSX.Element
}
const formFieldPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  children: 'only-through-prop',
  ref: 'only-through-prop',
} as const
export type FormFieldController = KitController<
  FormFieldProps,
  typeof formFieldPropsDefinition
>

/**
 * 组合一个 Label 和一个控件，让两者共享字段 ID。
 * 需要自定义身份时，在 FormField 提供 id。
 */
export const FormField = kit(
  {
    name: 'FormField',
    description: '组合字段标题与控件',
    availableProps: formFieldPropsDefinition,
  },
  (props: FormFieldProps) => {
    const id = val(props.id) ?? crypto.randomUUID()
    return (
      <FormFieldIdContext value={id}>
        <Flow>{props.children}</Flow>
      </FormFieldIdContext>
    )
  },
)
