/**
 * FormField 是标题与单个控件的字段组合。
 *
 * 为组合内的标题和控件提供同一个稳定字段 ID。
 *
 * 将原生关联身份集中在组合处，控件仍各自拥有输入状态。
 */
import { createContext, useContext, val, type Source } from '@/foundation'
import type { PivProps } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  formFieldPropDefinition,
  type FormFieldProps,
  type FormFieldController,
} from './FormField.prop'
import { Flow } from '../Flow/Flow'
import { derive } from '@/hooks'

const FormFieldIdContext = createContext<Source<string | undefined> | null>(
  null,
)
/**
 * 取得最近 FormField 的控件身份来源；字段外返回 null。
 */
export function useFormFieldId() {
  return useContext(FormFieldIdContext)
}

/**
 * 将字段身份绑定到唯一控件入口，其余公共声明交给组件根。
 * 显式 id 优先于 fallback，并沿用 Piv 的 String(ID或ID列表)语义；未提供身份时保持空值。
 * 当前层持续消费 id，尚未消费的公共声明直接沿组件 Props 交接。
 */
export function createFormFieldId<Props extends Pick<PivProps, 'id'>>(
  props: Props,
  fallback?: PivProps['id'] | null,
) {
  return derive(props, (s) => {
    const value = 'id' in s ? val(s.id) : val(fallback)
    return value == null ? undefined : String(value)
  })
}

/**
 * 组合一个 Label 和一个控件，让两者共享字段 ID。
 * 需要自定义身份时，在 FormField 提供 id。
 */
export const FormField: KitComponent<{
  props: FormFieldProps
  controller: FormFieldController
}> = kit(
  {
    name: componentName,
    componentDescription: '组合字段标题与控件',
    propDefinition: formFieldPropDefinition,
  },
  (props, { name }) => {
    const id = createFormFieldId(props, crypto.randomUUID())
    return (
      <FormFieldIdContext value={id}>
        <Flow shadowProps={props} class={name} $col>
          {props.children}
        </Flow>
      </FormFieldIdContext>
    )
  },
)
