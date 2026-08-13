/** Hoverable Plugin：感知并控制一个 Piv 的 hover 状态。 */
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'

export interface HoverableOptions {
  componentName?: string
  initialHovered?: boolean
}

export interface HoverableController {
  /** Controller 面板：当前是否处于 hover 状态。 */
  hovered: State<boolean>

  /** Controller 按钮：进入 hover 状态。 */
  hover(): void

  /** Controller 按钮：离开 hover 状态。 */
  unhover(): void

  toggleHover(): void
  resetHover(): void
}

export const hoverable = createPlugin<HoverableOptions, HoverableController, PivTag>((options) => {
  const [hovered, hoveredControl] = createToggle(options?.initialHovered ?? false)
  const controller: HoverableController = {
    hovered,
    hover: hoveredControl.turnOn,
    unhover: hoveredControl.turnOff,
    toggleHover: hoveredControl.toggle,
    resetHover: hoveredControl.reset,
  }

  return {
    controller,
    plugin: () => ({
      htmlProps: {
        'data-plugin': { mergable: toPluginName(options?.componentName, 'hoverable') },
        'data-hovered': hovered,
      },
      on: {
        pointerenter: controller.hover,
        pointerleave: controller.unhover,
      },
    }),
  }
})

function toPluginName(componentName: string | undefined, pluginName: string) {
  return componentName ? `${componentName}:${pluginName}` : pluginName
}
