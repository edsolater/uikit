/**
 * Top Layer：保持原有几何，把一个原始 DOM 提升到浏览器 Top Layer。
 *
 * 【职责边界】拥有一次提升的 Anchor、基础位置、尺寸、提升视觉和完整恢复；
 * 不解释调用方为何提升，也不拥有提升后的业务位移。
 */
import { onCleanup, onMount } from 'solid-js'
import { createToggle, type State } from '../../../../hooks'
import type { PivTag } from '../../../Piv/domMap'
import { createPlugin } from '../../definePlugin'
import { registerCSS } from '../../utils/cssRegisterer'
import { createTopLayerAnchor } from './topLayerAnchor'
import topLayerCSS from './topLayer.css?raw'

const topLayerClass = 'top-layer'
const topLayerCSSPath = 'components/plugins/kits/topLayer/topLayer.css'

export interface TopLayerController {
  /** 当前元素是否已经进入 Top Layer。 */
  active: State<boolean>
  /** 进入 Top Layer；重复调用不会创建第二次提升事务。 */
  enter(): void
  /** 退出 Top Layer 并恢复原状态；尚未进入时调用没有副作用。 */
  leave(): void
}

interface TopLayerSession {
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
]

/**
 * 为现有元素创建一个独立的 Top Layer 控制器。
 *
 * 控制器创建时不改变元素；调用 enter() 才开始完整提升事务。Drag 等原子
 * 能力直接使用此入口，Plugin 只在它外面增加 Piv 生命周期包装。
 */
export function createTopLayerController(element: HTMLElement): TopLayerController {
  registerCSS(element.ownerDocument, topLayerCSSPath, topLayerCSS)

  const [active, activeControl] = createToggle(false)
  let session: TopLayerSession | undefined

  return {
    active,
    enter() {
      if (session) return
      session = startTopLayerSession(element)
      activeControl.turnOn()
    },
    leave() {
      session?.leave()
      session = undefined
      activeControl.turnOff()
    },
  }
}

/** 开始一次不可重入的提升事务；公开调用统一经过 TopLayerController。 */
function startTopLayerSession(element: HTMLElement): TopLayerSession {
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
  element.classList.add(topLayerClass)

  try {
    element.showPopover()
    alignRenderedBox(element, originalRect)
  } catch (error) {
    element.removeAttribute('popover')
    element.classList.remove(topLayerClass)
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
      element.classList.remove(topLayerClass)
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
  let elementController: TopLayerController | undefined
  let requested = true

  // Plugin Controller 是纯控制器的生命周期适配层。它只记住挂载前的调用意图，
  // 元素可用后，所有实际提升操作都转发给 createTopLayerController() 的结果。
  const controller: TopLayerController = {
    active,
    enter() {
      requested = true
      if (!elementController) return
      elementController.enter()
      activeControl.turnOn()
    },
    leave() {
      requested = false
      elementController?.leave()
      activeControl.turnOff()
    },
  }

  return {
    controller,
    plugin: ({ element }) => {
      onMount(() => {
        elementController = createTopLayerController(element)
        if (requested) controller.enter()
      })

      onCleanup(() => {
        elementController?.leave()
        elementController = undefined
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
