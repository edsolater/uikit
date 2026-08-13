/** Clickable Plugin：为一个 Piv 提供 hover、focus、pressed 与键盘点击能力。 */
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { hoverable, type HoverableController } from '../hoverable'
import { createPlugin } from '../../definePlugin'
import { usePlugin } from '../../usePlugin'

export interface ClickableOptions {
  componentName?: string
  tabIndex?: number
  initialHovered?: boolean
  initialFocused?: boolean
  initialPressed?: boolean
}

export interface ClickableController extends HoverableController {
  /** Controller 面板：当前是否拥有焦点。 */
  focused: State<boolean>

  /** Controller 面板：当前是否处于按压阶段。 */
  pressed: State<boolean>

  focus(): void
  blur(): void
  press(): void
  release(): void
  click(): void
}

export const clickable = createPlugin<ClickableOptions, ClickableController, PivTag>((options) => {
  const [hoverPlugin, hoverController] = usePlugin(hoverable, {
    componentName: options?.componentName,
    initialHovered: options?.initialHovered,
  })
  const [focused, focusedControl] = createToggle(options?.initialFocused ?? false)
  const [pressed, pressedControl] = createToggle(options?.initialPressed ?? false)
  let element: HTMLElement | undefined

  const controller: ClickableController = {
    ...hoverController,
    focused,
    pressed,
    focus() {
      focusedControl.turnOn()
      element?.focus()
    },
    blur() {
      focusedControl.turnOff()
      element?.blur()
    },
    press: pressedControl.turnOn,
    release: pressedControl.turnOff,
    click() {
      element?.click()
    },
  }

  return {
    controller,
    plugin: (payload) => {
      element = payload.element
      return {
        plugin: hoverPlugin,
        htmlProps: {
          tabIndex: options?.tabIndex ?? 0,
          'data-plugin': { mergable: toPluginName(options?.componentName, 'clickable') },
          'data-focused': focused,
          'data-pressed': pressed,
        },
        on: {
          focusin: focusedControl.turnOn,
          focusout: focusedControl.turnOff,
          pointerdown: controller.press,
          pointerup: controller.release,
          pointercancel: controller.release,
          keyup: ({ event, element: currentElement }) => {
            if (currentElement.nodeName === 'BUTTON') return
            if (event.key === 'Enter' || event.key === ' ') {
              currentElement.click()
            }
          },
        },
      }
    },
  }
})

function toPluginName(componentName: string | undefined, pluginName: string) {
  return componentName ? `${componentName}:${pluginName}` : pluginName
}
