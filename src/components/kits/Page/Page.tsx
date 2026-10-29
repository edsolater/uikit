import { Show, val, type Source, type JSX } from '@/foundation'
import {
  ComponentMarker,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import { Piv } from '@/components/Piv/Piv'
import { Heading } from '../Heading/Heading'
import { Text } from '../Text/Text'
import { Flow } from '../Flow/Flow'
import './Page.style'
/** 页面根负责阅读范围；标题、说明与动作通过基础内容流组合。 */
export function Page(
  props: ComponentDescriptionProps & {
    title: Source<string>
    /** 可见副标题，保持正文语义，不用作结构查看元数据。 */
    subtitle?: Source<string>
    actions?: JSX.Element
    children?: JSX.Element
  },
) {
  return (
    <ComponentMarker
      componentName="Page"
      defaultDescription="组织页面标题、说明、动作与内容"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
    >
      <Piv as="main" class="Page">
        <Flow>
          <Heading level={1}>{props.title}</Heading>
          <Show when={val(props.subtitle)}>
            <Text p>{props.subtitle}</Text>
          </Show>
          <Flow direction="row">{props.actions}</Flow>
        </Flow>
        {props.children}
      </Piv>
    </ComponentMarker>
  )
}
