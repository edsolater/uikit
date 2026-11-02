/**
 * Page 承载当前页面的阅读根。
 *
 * 组合标题、副标题、动作与主要内容。
 *
 * 页面编排使用基础组件，不接管它们的内部样式。
 */
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { pagePropsDefinition } from './Page.prop'
import { Show, val, type Source, type JSX } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { Piv } from '@/components/Piv/Piv'
import { Heading } from '../Heading/Heading'
import { Text } from '../Text/Text'
import { Flow } from '../Flow/Flow'
import './Page.style'
/** Page 的声明输入；初始状态通过 Props 表达。 */
export type PageProps = ComponentDescriptionProps & {
  ref?: RefReceiver<PageController>
  title?: Source<string | undefined>
  /** 可见副标题，保持正文语义，不用作结构查看元数据。 */
  subtitle?: Source<string | undefined>
  actions?: JSX.Element
  children?: JSX.Element
}

/** Page 自有 Props 的指令式入口；ref 只从上游交付。 */
export type PageController = KitController<
  PageProps,
  typeof pagePropsDefinition
>

/**
 * 页面根负责阅读范围；标题、说明与动作可省略，没有这些内容时保留原正文顺序。
 */
export const Page = kit(
  {
    name: 'Page',
    description: '组织页面标题、说明、动作与内容',
    availableProps: pagePropsDefinition,
  },
  (props: PageProps) => {
    return (
      <Piv as="main" class="Page">
        <Show when={val(props.title) || val(props.subtitle) || props.actions}>
          <Flow>
            <Show when={val(props.title)}>
              <Heading level={1}>{props.title}</Heading>
            </Show>
            <Show when={val(props.subtitle)}>
              <Text p>{props.subtitle}</Text>
            </Show>
            <Flow direction="row">{props.actions}</Flow>
          </Flow>
        </Show>
        {props.children}
      </Piv>
    )
  },
)
