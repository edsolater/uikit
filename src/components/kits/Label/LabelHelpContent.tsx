/** 锚定帮助入口的非模态说明浮层；跨入口与内容的关闭策略交给组合者。 */
import type { Source } from '@/foundation'
import { ComponentMarker } from '@/components/ComponentMarker/ComponentMarker'
import { Piv } from '@/components/Piv/Piv'
import './LabelHelpContent.style'
export function LabelHelpContent(props: {
  id: string
  anchor: string
  content: Source<string | undefined>
  ref: (element: HTMLDivElement) => void
  enter: () => void
  leave: () => void
}) {
  return (
    <ComponentMarker
      componentName="LabelHelpContent"
      defaultDescription="阅读字段帮助内容"
    >
      <Piv
        as="div"
        class="LabelHelpContent"
        id={props.id}
        ref={props.ref}
        htmlProps={{
          popover: 'hint',
          role: 'tooltip',
          'data-anchor': props.anchor,
        }}
        on={{ pointerenter: props.enter, pointerleave: props.leave }}
      >
        {props.content}
      </Piv>
    </ComponentMarker>
  )
}
