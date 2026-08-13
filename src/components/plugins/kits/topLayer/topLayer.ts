/**
 * Top Layer Plugin：保持原有几何，把一个 Piv 的原始 DOM 提升到浏览器 Top Layer。
 *
 * 【职责边界】拥有一次提升的 Anchor、基础位置、尺寸、提升视觉和完整恢复；
 * 不解释调用方为何提升，也不拥有提升后的业务位移。
 */
import { onCleanup, onMount } from 'solid-js'
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'
import { createTopLayerAnchor } from './topLayerAnchor'
import './topLayer.css'

export interface TopLayerEntry {
  leave(): void
}

export interface TopLayerController {
  /** 当前元素是否已经进入 Top Layer。 */
  active: State<boolean>
  enter(): void
  leave(): void
}

interface InlineDeclaration {
  property: string
  value: string
  priority: string
}

/** Top Layer 为保持提升前 border-box 而临时接管的 inline 声明。 */
const topLayerGeometryProperties = [
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'box-sizing',
  'inline-size',
  'block-size',
] as const

/**
 * 提升现有元素，并交回本次提升事务的退出入口。
 *
 * Anchor 留在原布局中提供尺寸；原元素保持提升瞬间的视口位置。调用方只需
 * 决定为何提升，以及是否在这个基础位置上继续施加业务位移。
 */
export function enterTopLayer(element: HTMLElement): TopLayerEntry {
  if (element.hasAttribute('popover')) {
    throw new Error('Top Layer 元素不能同时承担 Popover')
  }

  if (!element.ownerDocument.defaultView) {
    throw new Error('Top Layer 元素必须属于浏览器窗口')
  }

  const originalRect = element.getBoundingClientRect()
  const previousDeclarations = captureInlineDeclarations(element.style)
  const anchor = createTopLayerAnchor(element)

  applyTopLayerGeometry(element.style, originalRect, anchor.name)
  element.setAttribute('popover', 'manual')
  element.setAttribute('data-top-layer', 'true')

  try {
    element.showPopover()
    alignRenderedBox(element, originalRect)
  } catch (error) {
    element.removeAttribute('popover')
    element.removeAttribute('data-top-layer')
    restoreInlineDeclarations(element.style, previousDeclarations)
    anchor.remove()
    throw error
  }

  let active = true

  return {
    leave() {
      if (!active) return
      active = false
      if (element.matches(':popover-open')) element.hidePopover()
      element.removeAttribute('popover')
      element.removeAttribute('data-top-layer')
      restoreInlineDeclarations(element.style, previousDeclarations)
      anchor.remove()
    },
  }
}

function applyTopLayerGeometry(
  style: CSSStyleDeclaration,
  originalRect: DOMRect,
  anchorName: string,
): void {
  // Popover 的 UA 样式使用 inset: 0。明确保留左上起点并释放另外两侧，
  // 可以避免元素落入双边约束和自动居中。
  style.setProperty('position', 'fixed')
  style.setProperty('left', `${originalRect.left}px`)
  style.setProperty('top', `${originalRect.top}px`)
  style.setProperty('right', 'auto')
  style.setProperty('bottom', 'auto')

  // Anchor 提供原布局算出的 border-box；提升后的元素按同一盒模型消费尺寸。
  style.setProperty('box-sizing', 'border-box')
  style.setProperty('inline-size', `anchor-size(${anchorName} self-inline)`)
  style.setProperty('block-size', `anchor-size(${anchorName} self-block)`)
}

/** 升层后重新测量一次，只修正浏览器改变绘制层造成的初始视口偏移。 */
function alignRenderedBox(element: HTMLElement, originalRect: DOMRect): void {
  const renderedRect = element.getBoundingClientRect()
  element.style.left = `${originalRect.left * 2 - renderedRect.left}px`
  element.style.top = `${originalRect.top * 2 - renderedRect.top}px`
}

function captureInlineDeclarations(style: CSSStyleDeclaration): InlineDeclaration[] {
  return topLayerGeometryProperties.map(property => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }))
}

function restoreInlineDeclarations(
  style: CSSStyleDeclaration,
  declarations: InlineDeclaration[],
): void {
  for (const { property, value, priority } of declarations) {
    if (value) style.setProperty(property, value, priority)
    else style.removeProperty(property)
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
        },
      }
    },
  }
})
