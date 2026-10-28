/** 字段标题与可选悬停说明；输入值及编辑行为由独立控件拥有。 */
import { onCleanup, Show, stateView, val, type Source } from '@/foundation'
import { ComponentWrapper, type ComponentDescriptionProps } from '@/components/ComponentWrapper/ComponentWrapper'
import { Piv } from '@/components/Piv/Piv'
import { createPopoverController } from '../Popover/createPopoverController'
import './Label.style'

/** 通过 for 关联独立输入；help 为空时不创建问号。 */
export type LabelProps = ComponentDescriptionProps & {
  for: Source<string>
  children: Source<string>
  help?: Source<string | undefined>
}

/** 显示标题与说明，保持原生表单关联，浮层不参与字段布局。 */
export function Label(props: LabelProps) {
  return <ComponentWrapper componentName="Label" description={props.description} descriptionDisplay={props.descriptionDisplay}>
    <Piv as="span" class="Label">
      <Piv as="label" htmlProps={{ for: props.for }}>{props.children}</Piv>
      <Show when={val(props.help)}>{help => <LabelHelp title={props.children} content={help()} />}</Show>
    </Piv>
  </ComponentWrapper>
}

/** 问号与说明共同持有悬停范围，短暂延迟关闭允许鼠标跨越定位间距。 */
function LabelHelp(props: { title: Source<string>; content: Source<string | undefined> }) {
  const controller = createPopoverController()
  const anchor = '--' + controller.triggerId
  let hovered = false
  let focused = false
  let dismissed = false
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  const cancelClose = () => clearTimeout(closeTimer)
  const open = () => {
    cancelClose()
    if (!dismissed) controller.showPopover()
  }
  const leave = () => {
    hovered = false
    if (!focused) {
      dismissed = false
      closeTimer = setTimeout(() => controller.hidePopover(false), 150)
    }
  }
  const enter = () => { hovered = true; dismissed = false; open() }
  const dismiss = () => {
    dismissed = true
    cancelClose()
    controller.hidePopover(false)
  }
  onCleanup(cancelClose)

  return <>
    <Piv as="button" class="help" id={controller.triggerId} ref={controller.setTriggerElement}
      style={{ 'anchor-name': anchor }}
      htmlProps={{ type: 'button', 'aria-label': stateView(() => val(props.title) + '说明'), 'aria-describedby': controller.popoverId }}
      on={{
        pointerenter: enter,
        pointerleave: leave,
        focus: () => { focused = true; open() },
        blur: () => { focused = false; if (!hovered) leave() },
        click: () => { dismissed = false; open() },
        keydown: ({ event }) => { if (event.key === 'Escape') dismiss() },
      }}>?</Piv>
    <Piv class="help-content" id={controller.popoverId} ref={controller.setPopoverElement}
      style={{ 'position-anchor': anchor }}
      htmlProps={{ popover: 'hint', role: 'tooltip' }}
      on={{ pointerenter: enter, pointerleave: leave }}>
      {props.content}
    </Piv>
  </>
}
