/**
 * FormField 是标题与单个控件的字段组合。
 *
 * 为组合内的标题和控件提供同一个稳定字段 ID。
 *
 * 将原生关联身份集中在组合处，控件仍各自拥有输入状态。
 */
import type { PropsReadMode } from '../../tools/componentPropsDirector'
import {
  createContext,
  useContext,
  val,
  type JSX,
  type Source,
} from '@/foundation'
import { kit, type KitController } from '../../tools/kit'
import type { ComponentDescriptionProps } from '../../tools/KitMarker/KitMarker'
import { componentDescriptionPropsDefinition } from '../../tools/KitMarker/KitMarker.prop'
import type { RefReceiver } from '@/hooks/createRef'
import { Flow } from '../Flow/Flow'

const FormFieldIdContext = createContext<string | null>(null)
/**
 * 取得最近 FormField 的控件 ID；字段外返回 null。
 */
export function useFormFieldId() {
  return useContext(FormFieldIdContext)
}

/** 字段身份与组合内容；未提供 id 时，每个实例生成稳定身份。 */
export type FormFieldProps = ComponentDescriptionProps & {
  ref?: RefReceiver<FormFieldController>
  id?: Source<string | undefined>
  children?: JSX.Element
}
/** 字段输入保留 ID 来源，组合内容只通过声明传入。 */
const formFieldPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  id: 'state-source-view',
  children: 'only-through-prop',
  ref: 'only-through-prop',
} satisfies Record<string, PropsReadMode>
/** 字段自身输入的控制入口，不接管内部控件值。 */
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
    propsDefinition: formFieldPropsDefinition,
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
