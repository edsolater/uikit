/** 点击节点的交互算法。
 *
 * 在当前节点组合 hover、焦点、按压与键盘点击。
 *
 * 每个实际节点独立拥有状态和功能成员。
 */
import { createToggle } from '@/hooks'
import type { State } from '@/foundation'
import { defineInactivePlugin } from '@/components/plugins/defineInactivePlugin'
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
  focus(): void
  blur(): void
  press(): void
  release(): void
  click(): void
}

/**
 * 配置点击能力；悬停子能力在同一节点执行并提供同一份功能成员。
 */
export const clickable = defineInactivePlugin<
  ClickableOptions,
  ClickableController
>({
  name: 'clickable',
  pluginCore({
    pluginOptions,
    element,
    onCleanup,
    addProps,
  }): ClickableController {
    const hover = hoverable({
      componentName: pluginOptions.componentName,
      initialHovered: pluginOptions.initialHovered,
    })({ element, onCleanup, addProps })
    const [focused, focusControl] = createToggle(
      pluginOptions.initialFocused ?? false,
    )
    const [pressed, pressControl] = createToggle(
      pluginOptions.initialPressed ?? false,
    )
    const members: ClickableController = {
      ...hover,
      focused,
      pressed,
      focus() {
        focusControl.turnOn()
        element.focus()
      },
      blur() {
        focusControl.turnOff()
        element.blur()
      },
      press: pressControl.turnOn,
      release: pressControl.turnOff,
      click() {
        element.click()
      },
    }
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
