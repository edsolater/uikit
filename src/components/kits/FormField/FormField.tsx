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

const FieldIdentity = createContext<string | null>(null)
/** 取得最近字段身份；字段外返回空值。 */
export function useFormFieldId() {
  return useContext(FieldIdentity)
}

export type FormFieldProps = ComponentDescriptionProps & {
  ref?: RefReceiver<FormFieldController>
  id?: Source<string | undefined>
  children?: JSX.Element
}
const definition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  children: 'only-through-prop',
  ref: 'only-through-prop',
} as const
export type FormFieldController = KitController<
  FormFieldProps,
  typeof definition
>

/** 组合一个 Label 和一个控件；自定义身份应在此提供。 */
export const FormField = kit(
  {
    name: 'FormField',
    description: '组合字段标题与控件',
    availableProps: definition,
  },
  (props: FormFieldProps) => {
    const id = val(props.id) ?? crypto.randomUUID()
    return (
      <FieldIdentity value={id}>
        <Flow>{props.children}</Flow>
      </FieldIdentity>
    )
  },
)
