/**
 * Top Layer Plugin：让一个 Piv 的原始 DOM 进入浏览器 Top Layer。
 *
 * 【职责边界】只拥有元素的 Popover 进入、退出和占用状态，不解释定位、尺寸或视觉样式。
 */
import { onCleanup, onMount } from 'solid-js'
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'

export interface TopLayerEntry {
  leave(): void
}

export interface TopLayerController {
  /** 当前元素是否已经进入 Top Layer。 */
  active: State<boolean>
  enter(): void
  leave(): void
}

/**
 * 让现有元素进入浏览器 Top Layer，并交回本次占用的退出入口。
 *
 * 调用方拥有为何进入以及怎样呈现；本函数只接管元素的 Popover 状态。
 */
export function enterTopLayer(element: HTMLElement): TopLayerEntry {
  if (element.hasAttribute('popover')) {
    throw new Error('Top Layer 元素不能同时承担 Popover')
  }

  element.setAttribute('popover', 'manual')

  try {
    element.showPopover()
  } catch (error) {
    element.removeAttribute('popover')
    throw error
  }

  let active = true

  return {
    leave() {
      if (!active) return
      active = false
      if (element.matches(':popover-open')) element.hidePopover()
      element.removeAttribute('popover')
    },
  }
}

export const topLayer = createPlugin<undefined, TopLayerController, PivTag>(() => {
  const [active, activeControl] = createToggle(false)
  let element: HTMLElement | undefined
  let entry: TopLayerEntry | undefined
  let mounted = false
  let requested = true

  const controller: TopLayerController = {
    active,
    enter() {
      requested = true
      if (!mounted || !element || entry) return
      entry = enterTopLayer(element)
      activeControl.turnOn()
    },
    leave() {
      requested = false
      entry?.leave()
      entry = undefined
      activeControl.turnOff()
    },
  }

  return {
    controller,
    plugin: ({ element: currentElement }) => {
      element = currentElement
      onMount(() => {
        mounted = true
        if (requested) controller.enter()
      })

      onCleanup(() => {
        entry?.leave()
        entry = undefined
        element = undefined
        mounted = false
        activeControl.turnOff()
      })

      return {
        htmlProps: {
          'data-plugin': { mergable: 'top-layer' },
          'data-top-layer': active,
        },
      }
    },
  }
})
