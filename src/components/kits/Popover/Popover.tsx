/**
 * 这个文件定义基础 Popover 组件。
 * 它负责触发器、原生 popover 容器和 anchor positioning 结构，不负责菜单协议、表单校验或业务弹层编排。
 */
import { Show, mergeProps, onMount, type JSX } from 'solid-js'
import { Piv } from '../../Piv/Piv'
import { createBrandPropsParser, type BrandProps } from '../utils/parseBrandProps'
import { createStatusPropsParser } from '../utils/parseStatusProps'
import { createPopoverController, type PopoverToggleEvent } from './createPopoverController'
import './popover.css'

/**
 * Popover 相对触发器的位置 Brand Props。
 *
 * 位置确定时优先声明 top、right、bottom 或 left；只有位置会变化时才使用 placement。
 * 省略整个分组时默认显示在 bottom。
 */
export type PopoverPlacementProps = BrandProps<'placement', 'top' | 'right' | 'bottom' | 'left'>

export type PopoverMode = 'auto' | 'hint' | 'manual'
export type PopoverAction = 'toggle' | 'show' | 'hide'
type NativeHTMLPropKey = 'children' | 'class' | 'style' | 'ref' | `on${string}` | `on:${string}`

export interface PopoverProps extends PopoverPlacementProps {
  class?: string
  style?: JSX.CSSProperties
  trigger: JSX.Element
  title?: JSX.Element
  children?: JSX.Element
  triggerClass?: string
  triggerStyle?: JSX.CSSProperties
  surfaceClass?: string
  surfaceStyle?: JSX.CSSProperties
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

const defaultPopoverProps: {
  popover: PopoverMode
  triggerAction: PopoverAction
  defaultOpen: boolean
} = {
  popover: 'auto',
  triggerAction: 'toggle',
  defaultOpen: false,
}

const parsePopoverBrandProps = createBrandPropsParser([
  { groupName: 'placement', candidates: ['top', 'right', 'bottom', 'left'] },
])

const parsePopoverStatusProps = createStatusPropsParser({
  candidates: ['open'],
})

export function Popover(props: PopoverProps) {
  const mergedProps = mergeProps(defaultPopoverProps, props)
  const { brandShadowProps } = parsePopoverBrandProps(props)
  const controller = createPopoverController({
    onToggle: mergedProps.onToggle,
    onBeforeToggle: mergedProps.onBeforeToggle,
  })
  const { statusShadowProps } = parsePopoverStatusProps({ open: controller.isOpen })

  onMount(() => {
    if (mergedProps.defaultOpen) {
      controller.showPopover()
    }
  })

  return (
    <Piv
      shadowProps={[brandShadowProps, statusShadowProps]}
      class={joinClassName('Popover', mergedProps.class)}
      style={mergedProps.style}
    >
      <Piv
        as="button"
        id={controller.triggerId}
        class={joinClassName('trigger', mergedProps.triggerClass)}
        style={mergedProps.triggerStyle}
        ref={controller.setTriggerElement}
        htmlProps={{
          type: 'button',
          'aria-haspopup': 'dialog',
          'aria-controls': controller.popoverId,
          'aria-expanded': controller.isOpen.map((isOpen) => isOpen ? 'true' : 'false'),
          popovertarget: controller.popoverId,
          popovertargetaction: mergedProps.triggerAction,
          ...mergedProps.triggerProps,
        }}
      >
        {mergedProps.trigger}
      </Piv>

      <Piv
        id={controller.popoverId}
        class={joinClassName('surface', mergedProps.surfaceClass)}
        style={mergedProps.surfaceStyle}
        ref={controller.setPopoverElement}
        htmlProps={{
          popover: mergedProps.popover as any,
          ...mergedProps.surfaceProps,
        }}
      >
        <Show when={mergedProps.title}>
          <div class="header">{mergedProps.title}</div>
        </Show>
        <div class="body">{mergedProps.children}</div>
      </Piv>
    </Piv>
  )
}

function joinClassName(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}
