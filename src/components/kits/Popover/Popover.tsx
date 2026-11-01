/**
 * 这个文件定义基础 Popover 组件。
 * 它负责触发器、原生 popover 容器和 anchor positioning 结构，不负责菜单协议、表单校验或业务弹层编排。
 */
import { kit } from '@/components/utils/kit'
import type { PropsController } from '@/components/utils/componentPropsDirector'
import type { RefReceiver } from '@/hooks/createRef'
import { popoverPropsDefinition, popoverVariantGroups, getPopoverPropsDirectorOptions } from './Popover.prop'
import { onMount, Show, type JSX } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { Piv } from '../../Piv/Piv'
import { Button } from '../Button/Button'
import { addDefaultProps } from '../../utils/defaultProps'
import {
  createVariantPropsParser,
  type VariantProps,
} from '../utils/parseVariantProps'
import {
  createPopoverVisibilityController,
  type PopoverToggleEvent,
} from '@/components/Popover/createPopoverVisibilityController'
import { PopoverSurface } from '@/components/Popover/PopoverSurface'
import './Popover.style'

/**
 * Popover 相对触发器的位置 Variant Props。
 *
 * 位置确定时优先声明 top、right、bottom 或 left；只有位置会变化时才使用 placement。
 * 省略整个分组时默认显示在 bottom。
 */
export type PopoverPlacementProps = VariantProps<
  'placement',
  'top' | 'right' | 'bottom' | 'left'
>

export type PopoverMode = 'auto' | 'hint' | 'manual'
export type PopoverAction = 'toggle' | 'show' | 'hide'
type NativeHTMLPropKey =
  | keyof JSX.IntrinsicAttributes
  | 'children'
  | 'class'
  | 'style'
  | `on${string}`
  | `on:${string}`

export interface PopoverProps
  extends PopoverPlacementProps, ComponentDescriptionProps {
  ref?: RefReceiver<PopoverController>
  class?: string
  style?: JSX.CSSProperties
  trigger: JSX.Element
  title?: JSX.Element
  children?: JSX.Element
  triggerClass?: string
  triggerStyle?: JSX.CSSProperties
  surfaceClass?: string
  /** 原生浮层宿主的布局与DOM样式；完整轮廓材质使用Popover公开Token。 */
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
  surfaceProps?: Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    NativeHTMLPropKey | 'id' | 'popover'
  >
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

/** Props 状态的指令式入口；PopoverVisibilityController 继续拥有浮层操作。 */
export type PopoverController = PropsController<PopoverProps, typeof popoverPropsDefinition>

const parsePopoverVariantProps = createVariantPropsParser(popoverVariantGroups)

/**
 * 组合触发器与浮层；挂载后的默认打开仍属于 Popover 自身业务。
 */
export const Popover = kit(
  {
    name: 'Popover',
    description: '显示补充内容',
    availableProps: popoverPropsDefinition,
    directorOptions: getPopoverPropsDirectorOptions,
  },
  (props: PopoverProps) => {
    const mergedProps = addDefaultProps(props, defaultPopoverProps)
    const { variantShadowProps, details } = parsePopoverVariantProps(props)
    // 事件发生时读取最新回调，保留原监听器的生命周期。
    const [controller, controllerBindings] = createPopoverVisibilityController({
      get onToggle() { return mergedProps.onToggle },
      get onBeforeToggle() { return mergedProps.onBeforeToggle },
    })

    onMount(() => {
      if (mergedProps.defaultOpen) {
        controller.showPopover()
      }
    })

    return (
      <Piv
        shadowProps={variantShadowProps}
        class={['Popover', mergedProps.class]}
        style={mergedProps.style}
      >
        <Button
          id={controller.triggerId}
          class={['trigger', mergedProps.triggerClass]}
          disabled={
            mergedProps.triggerProps?.disabled === '' ||
            mergedProps.triggerProps?.disabled
          }
          loading={mergedProps.triggerProps?.['aria-busy'] === 'true'}
          style={{
            ...mergedProps.triggerStyle,
            'anchor-name': `--${controller.triggerId}`,
          }}
          domRef={controllerBindings.triggerDomRef}
          htmlProps={{
            'type': 'button',
            'aria-haspopup': 'dialog',
            'aria-controls': controller.popoverId,
            'aria-expanded': controller.isOpen.map((isOpen) =>
              isOpen ? 'true' : 'false',
            ),
            'popovertarget': controller.popoverId,
            'popovertargetaction': mergedProps.triggerAction,
            ...mergedProps.triggerProps,
          }}
        >
          {mergedProps.trigger}
        </Button>

        <PopoverSurface
          id={controller.popoverId}
          anchor={`--${controller.triggerId}`}
          placement={details.placement}
          popover={mergedProps.popover}
          class={['surface', mergedProps.surfaceClass]}
          style={mergedProps.surfaceStyle}
          domRef={controllerBindings.popoverDomRef}
          htmlProps={mergedProps.surfaceProps}
        >
          <Show when={mergedProps.title}>
            <Piv class="header">{mergedProps.title}</Piv>
          </Show>
          <Piv class="body">{mergedProps.children}</Piv>
        </PopoverSurface>
      </Piv>
    )
  },
)
