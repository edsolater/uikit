/** 字段帮助入口：提供可聚焦问号、说明关联与开启/退出动作。 */
import { stateView, val, type Source } from '@/foundation'
import { ComponentMarker } from '@/components/ComponentMarker/ComponentMarker'
import { Piv } from '@/components/Piv/Piv'
import './LabelHelpTrigger.style'
export function LabelHelpTrigger(props: {
  id: string
  anchor: string
  describedBy: string
  title: Source<string>
  domRef: (element: HTMLButtonElement) => void
  enter: () => void
  leave: () => void
  focus: () => void
  blur: () => void
  activate: () => void
  dismiss: () => void
}) {
  return (
    <ComponentMarker
      componentName="LabelHelpTrigger"
      defaultDescription="打开字段帮助"
    >
      <Piv
        as="button"
        class="LabelHelpTrigger"
        id={props.id}
        domRef={props.domRef}
        htmlProps={{
          type: 'button',
          'data-anchor': props.anchor,
          'aria-label': stateView(() => val(props.title) + '说明'),
          'aria-describedby': props.describedBy,
        }}
        on={{
          pointerenter: props.enter,
          pointerleave: props.leave,
          focus: props.focus,
          blur: props.blur,
          click: props.activate,
          keydown: ({ event }) => {
            if (event.key === 'Escape') props.dismiss()
          },
        }}
      >
        ?
      </Piv>
    </ComponentMarker>
  )
}
