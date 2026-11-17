/**
 * Page 承载当前页面的阅读根。
 *
 * 组合标题、副标题、动作与主要内容。
 *
 * 页面编排使用基础组件，不接管它们的内部样式。
 */
import { Show, val } from '@/foundation'
import { Piv } from '../../Piv/Piv'
import { Heading } from '../Heading/Heading'
import { Text } from '../Text/Text'
import { Flow } from '../Flow/Flow'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  pagePropDefinition,
  type PageProps,
  type PageController,
} from './Page.prop'

import './Page.style'

/**
 * 页面根负责阅读范围；标题、说明与动作可省略，没有这些内容时保留原正文顺序。
 */
export const Page: KitComponent<{
  props: PageProps
  controller: PageController
}> = kit(
  {
    name: componentName,
    componentDescription: '组织页面标题、说明、动作与内容',
    propDefinition: pagePropDefinition,
  },
  (props, { name }) => {
    return (
      <Piv as="main" shadowProps={props} class={name}>
        <Show when={val(props.title) || val(props.subtitle) || props.actions}>
          <Flow $direction="column">
            <Show when={val(props.title)}>
              <Heading level={1}>{props.title}</Heading>
            </Show>
            <Show when={val(props.subtitle)}>
              <Text p>{props.subtitle}</Text>
            </Show>
            <Flow>{props.actions}</Flow>
          </Flow>
        </Show>
        {props.children}
      </Piv>
    )
  },
)
