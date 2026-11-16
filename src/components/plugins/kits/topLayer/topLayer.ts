/**
 * Top Layer：保持原有几何，把一个原始 DOM 提升到浏览器 Top Layer。
 *
 * 拥有一次提升的锚点、基础位置、尺寸与完整恢复。
 *
 * 调用方可在同一元素上安排后续交互位移，提升能力只维护原始几何。
 */
import { createState, onMount, type State } from '@/foundation'
import { createInactivePlugin } from '../../tools/createInactivePlugin'
import { createTopLayerAnchor } from './anchor'
import './topLayer.style'

const topLayerClass = 'top-layer'

/** 原始元素的提升控制，active 与进入、退出操作保持同一份事务状态。 */
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
export function createTopLayerController(
  element: HTMLElement,
  active: State<boolean> = createState(false),
): TopLayerController {
  let session: TopLayerSession | undefined

  return {
    active,
    /**
     * 开始当前元素的提升，已经提升时沿用现有事务。
     */
    enter() {
      if (session) return
      session = startTopLayerSession(element)
      active.set(true)
    },
    /**
     * 退出当前提升并恢复原始几何和节点声明。
     */
    leave() {
      session?.leave()
      session = undefined
      active.set(false)
    },
  }
}

/**
 * 为原始元素开始一次提升事务；失败时恢复已接管的声明和锚点。
 */
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
    /**
     * 结束这次提升，恢复声明并移除锚点，后续重复退出不再写入元素。
     */
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

/**
 * 以原始视口起点和锚点尺寸固定提升元素的 border-box。
 */
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

/**
 * 修正浏览器升层造成的初始视口偏移，使绘制位置与提升前相同。
 */
function alignRenderedBox(element: HTMLElement, originalRect: DOMRect): void {
  const renderedRect = element.getBoundingClientRect()
  element.style.left = `${originalRect.left * 2 - renderedRect.left}px`
  element.style.top = `${originalRect.top * 2 - renderedRect.top}px`
}

/**
 * 保存提升需要接管的 inline 几何声明及其优先级，供退出时完整恢复。
 */
function captureInlineDeclarations(
  style: CSSStyleDeclaration,
): InlineDeclaration[] {
  return topLayerGeometryProperties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }))
}

/**
 * 恢复提升前的 inline 几何，原本缺省的属性重新移除。
 */
function restoreInlineDeclarations(
  style: CSSStyleDeclaration,
  declarations: InlineDeclaration[],
): void {
  for (const { property, value, priority } of declarations) {
    if (value) style.setProperty(property, value, priority)
    else style.removeProperty(property)
  }
}

/** 插件构建时提供状态与控制入口，元素接入后建立提升事务。 */
export const topLayer = createInactivePlugin({
  name: 'topLayer',
  /**
   * 连接原始节点、提升时机与绑定清理，返回在接入前后都稳定的控制入口。
   */
  pluginCore({ addProps }): TopLayerController {
    const active = createState(false)
    let session: TopLayerController | undefined
    const controller: TopLayerController = {
      active,
      /**
       * 提升当前已接入的节点，尚无节点时不创建事务。
       */
      enter() {
        session?.enter()
      },
      /**
       * 退出当前节点的提升，未接入或已经退出时不改变元素。
       */
      leave() {
        session?.leave()
      },
    }
    addProps({
      // 节点接入时创建控制，挂载后提升；资源与该节点的引用绑定共同退出。
      domRef: (element) => {
        const current = createTopLayerController(element, active)
        session = current
        onMount(() => current.enter())
        return () => {
          current.leave()
          session = undefined
        }
      },
      htmlProps: { 'data-plugin': { mergable: 'top-layer' } },
    })
    return controller
  },
})
