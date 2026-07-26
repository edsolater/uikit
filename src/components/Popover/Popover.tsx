/**
 * 这个文件定义基础 Popover 组件。
 * 它负责触发器、原生 popover 容器和 anchor positioning 结构，不负责菜单协议、表单校验或业务弹层编排。
 */
import { Show, mergeProps, onMount, type JSX } from 'solid-js'
import { Piv } from '../Piv/Piv'
import { createPopoverController, type PopoverToggleEvent } from './createPopoverController'
import './popover.css'
import { val } from '../../hooks/createState'

export type PopoverPlacement = 'top' | 'right' | 'bottom' | 'left'
export type PopoverMode = 'auto' | 'hint' | 'manual'
export type PopoverAction = 'toggle' | 'show' | 'hide'
type NativeHTMLPropKey = 'children' | 'class' | 'style' | 'ref' | `on${string}` | `on:${string}`

export type PopoverProps = {
  class?: string
  style?: JSX.CSSProperties
  trigger: JSX.Element
  title?: JSX.Element
  children?: JSX.Element
  triggerClass?: string
  triggerStyle?: JSX.CSSProperties
  surfaceClass?: string
  surfaceStyle?: JSX.CSSProperties
  placement?: PopoverPlacement
  popover?: PopoverMode
  triggerAction?: PopoverAction
  defaultOpen?: boolean
  triggerProps?: Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    | NativeHTMLPropKey
    | 'type'
    | 'id'
    | 'aria-controls'
    | 'aria-expanded'
    | 'aria-haspopup'
    | 'popovertarget'
    | 'popovertargetaction'
  >
  surfaceProps?: Omit<JSX.HTMLAttributes<HTMLDivElement>, NativeHTMLPropKey | 'id' | 'popover'>
  onToggle?: (open: boolean, event: PopoverToggleEvent) => void
  onBeforeToggle?: (open: boolean, event: PopoverToggleEvent) => void
}

function joinClassName(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function Popover(inputProps: PopoverProps) {
  const props = mergeProps(
    {
      placement: 'bottom' as const,
      popover: 'auto' as const,
      triggerAction: 'toggle' as const,
      defaultOpen: false,
    },
    inputProps,
  )
  const controller = createPopoverController({
    onToggle: props.onToggle,
    onBeforeToggle: props.onBeforeToggle,
  })

  onMount(() => {
    if (props.defaultOpen) {
      controller.showPopover()
    }
  })

  const rootClassName = () =>
    joinClassName('Popover', `placement:${props.placement}`, val(controller.isOpen) && 'state:open', props.class)
  const triggerClassName = () => joinClassName('_trigger', props.triggerClass)
  const surfaceClassName = () => joinClassName('_surface', props.surfaceClass)

  return (
    <Piv class={rootClassName()} style={props.style}>
      <Piv
        as="button"
        id={controller.triggerId}
        class={triggerClassName()}
        style={props.triggerStyle}
        ref={controller.setTriggerElement}
        htmlProps={{
          type: 'button',
          'aria-haspopup': 'dialog',
          'aria-controls': controller.popoverId,
          'aria-expanded': val(controller.isOpen) ? 'true' : 'false',
          popovertarget: controller.popoverId,
          popovertargetaction: props.triggerAction,
          ...props.triggerProps,
        }}
      >
        {props.trigger}
      </Piv>

      <Piv
        id={controller.popoverId}
        class={surfaceClassName()}
        style={props.surfaceStyle}
        ref={controller.setPopoverElement}
        htmlProps={{
          popover: props.popover as any,
          ...props.surfaceProps,
        }}
      >
        <Show when={props.title}>
          <div class="_header">{props.title}</div>
        </Show>
        <div class="_body">{props.children}</div>
      </Piv>
    </Piv>
  )
}
