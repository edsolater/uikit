/**
 * Field 将字段标题与单个控件关联。
 *
 * 为标题与控件分配同一 ID，并通过内容流组织它们。
 *
 * 字段关联与编排留在组件，输入值仍由调用方拥有。
 */
import { kit } from '@/components/utils/kit'
import type { PropsController } from '@/components/utils/componentPropsDirector'
import type { RefReceiver } from '@/hooks/createRef'
import { fieldPropsDefinition } from './Field.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Flow } from '../Flow/Flow'
import { Label } from '../Label/Label'
/** Field 的声明输入；初始状态通过 Props 表达。 */
export type FieldProps = ComponentDescriptionProps & {
  ref?: RefReceiver<FieldController>
  label: Source<string>
  children: (id: string) => JSX.Element
}

/** Field 自有 Props 的指令式入口；ref 只从上游交付。 */
export type FieldController = PropsController<FieldProps, typeof fieldPropsDefinition>

/**
 * 关联字段标题与单个控件。
 */
export const Field = kit(
  {
    name: 'Field',
    description: '关联字段标题与单个控件',
    availableProps: fieldPropsDefinition,
  },
  (props: FieldProps) => {
    const id = crypto.randomUUID()
    return (
      <Flow>
        <Label for={id}>{props.label}</Label>
        {props.children(id)}
      </Flow>
    )
  },
)
