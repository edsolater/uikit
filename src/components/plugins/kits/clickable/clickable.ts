/** 点击节点的交互算法。
 *
 * 在当前节点组合 hover、焦点、按压与键盘点击。
 *
 * 每次配置构建独立状态和完整功能成员；节点接入只提供元素引用。
 */
import { createToggle } from '@/hooks'
import type { State } from '@/foundation'
import type { PromiseResultProxy } from '@edsolater/fnkit'
import { defineInactivePlugin } from '@/components/plugins/tools/defineInactivePlugin'
import {
  hoverable,
  type HoverableController,
} from '@/components/plugins/kits/hoverable/hoverable'

/** 点击能力的配置。 */
export interface ClickableOptions {
  componentName?: string
  tabIndex?: number
  initialHovered?: boolean
  initialFocused?: boolean
  initialPressed?: boolean
  onClick?: (event: MouseEvent) => void
}

/** 节点点击功能。 */
export interface ClickableController extends HoverableController {
  focused: State<boolean>
  pressed: State<boolean>
  focus(): PromiseResultProxy<void>
  blur(): PromiseResultProxy<void>
  press(): void
  release(): void
  click(): PromiseResultProxy<void>
}

/**
 * 配置点击能力；悬停子能力在同一节点执行并提供同一份功能成员。
 *
 * 元素方法可等待；节点尚未接入时等待首次接入，后续节点更换暂不支持。
 * TODO：公开操作的返回值改为 Promise<boolean>。
 */
export const clickable = defineInactivePlugin<
  ClickableOptions,
  ClickableController
>({
  name: 'clickable',
  pluginCore({ pluginOptions, addProps, domProxy }): ClickableController {
    const hover = hoverable({
      componentName: pluginOptions.componentName,
      initialHovered: pluginOptions.initialHovered,
    })
    const [focused, focusControl] = createToggle(
      pluginOptions.initialFocused ?? false,
    )
    const [pressed, pressControl] = createToggle(
      pluginOptions.initialPressed ?? false,
    )
    const members: ClickableController = {
      ...hover.controller,
      focused,
      pressed,
      focus() {
        focusControl.turnOn()
        return domProxy.focus()
      },
      blur() {
        focusControl.turnOff()
        return domProxy.blur()
      },
      press: pressControl.turnOn,
      release: pressControl.turnOff,
      click() {
        return domProxy.click()
      },
    }
    addProps({ is: hover })
    addProps({
      htmlProps: {
        'tabIndex': pluginOptions.tabIndex ?? 0,
        'data-plugin': {
          mergable: pluginOptions.componentName
            ? `${pluginOptions.componentName}:clickable`
            : 'clickable',
        },
        'data-focused': focused,
        'data-pressed': pressed,
      },
      on: {
        click: ({ event }) => pluginOptions.onClick?.(event),
        focusin: focusControl.turnOn,
        focusout: focusControl.turnOff,
        pointerdown: members.press,
        pointerup: members.release,
        pointercancel: members.release,
        keyup: ({ event, element: current }) => {
          if (
            current.nodeName !== 'BUTTON' &&
            (event.key === 'Enter' || event.key === ' ')
          )
            current.click()
        },
      },
    })
    return members
  },
})
