import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'
import { type Source, type JSX } from '@/foundation'
import { Flow } from '../Flow/Flow'
import { Label } from '../Label/Label'
/** 关联字段标题与单个控件。 */
export function Field(
  props: ComponentDescriptionProps & {
    label: Source<string>
    children: (id: string) => JSX.Element
  },
) {
  const id = crypto.randomUUID()
  return (
    <ComponentWrapper
      componentName="Field"
      defaultDescription="关联字段标题与单个控件"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Flow>
        <Label for={id}>{props.label}</Label>
        {props.children(id)}
      </Flow>
    </ComponentWrapper>
  )
}
