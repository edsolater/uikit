/**
 * Field 将字段标题与单个控件关联。
 *
 * 为标题与控件分配同一 ID，并通过内容流组织它们。
 *
 * 字段关联与编排留在组件，输入值仍由调用方拥有。
 */
import { Flow } from '../Flow/Flow'
import { Label } from '../Label/Label'
import { kit, type KitComponent } from '../../tools/kit'
import { derive } from '@/hooks'
import {
  componentName,
  fieldPropDefinition,
  type FieldProps,
  type FieldController,
} from './Field.prop'

/**
 * 关联字段标题与单个控件。
 */
export const Field: KitComponent<{
  props: FieldProps
  controller: FieldController
}> = kit(
  {
    name: componentName,
    componentDescription: '关联字段标题与单个控件',
    propDefinition: fieldPropDefinition,
  },
  (props, { name }) => {
    const id = crypto.randomUUID()
    const label = derive(props, (s) => s.label)
    return (
      <Flow shadowProps={props} class={name} $col>
        <Label for={id} tooltip={props.tooltip}>
          {label}
        </Label>
        {props.children(id)}
      </Flow>
    )
  },
)
