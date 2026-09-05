/** 按稳定身份把 stylesheet 根挂载到所属 Document。 */
import {
  activateCssBox,
  disconnectCssBoxActivation,
  readCssBox,
  resumeCssBoxActivation,
  type CssBox,
  type CssBoxActivation,
} from './css-box'
import { activateCssValue } from './css-value-activation'
import { parseCssStylesheetResult, type ParsedCssStylesheet } from './parse-css-stylesheet'

interface MountedStylesheet {
  root: CssBox
  style: HTMLStyleElement
  activation: CssBoxActivation
  needsRefresh: boolean
  refreshing: boolean
  pendingResult?: ParsedCssStylesheet
}

const stylesheetsByDocument = new WeakMap<Document, Map<string, MountedStylesheet>>()

/**
 * 连接 stylesheet 根；相同 Document、身份与根的重复调用沿用已有 style。
 *
 * @example
 * mountCssStylesheet(document, import.meta.url, stylesheet(selector('.Card', cssAtom.display('block'))))
 */
export function mountCssStylesheet(document: Document, identity: string, root: CssBox): HTMLStyleElement {
  if (readCssBox(root).kind !== 'stylesheet') {
    throw new Error('只有 stylesheet() 创建的容器可以挂载到 Document。')
  }

  let stylesheets = stylesheetsByDocument.get(document)
  if (!stylesheets) {
    stylesheets = new Map()
    stylesheetsByDocument.set(document, stylesheets)
  }

  const mounted = stylesheets.get(identity)
  if (mounted?.root === root) {
    const activationChanged = resumeCssBoxActivation(mounted.activation)
    if (activationChanged) mounted.activation.refresh(true)
    else if (mounted.needsRefresh) mounted.activation.refresh()
    if (!mounted.style.isConnected) document.head.append(mounted.style)
    return mounted.style
  }

  if (mounted && mounted.root !== root) disconnectCssBoxActivation(mounted.activation)

  const existingStyle = mounted?.style.isConnected
    ? mounted.style
    : [...document.head.querySelectorAll<HTMLStyleElement>('style[data-uikit-css]')].find(
        (style) => style.dataset.uikitCss === identity,
      )

  const style = existingStyle ?? document.createElement('style')
  let nextMounted: MountedStylesheet

  /** 用当前对象树刷新这一份已挂载 stylesheet。 */
  function refresh(contentChanged = false): void {
    if (contentChanged) {
      nextMounted.pendingResult = undefined
      nextMounted.needsRefresh = true
    }
    if (nextMounted.refreshing) return
    if (!nextMounted.needsRefresh) return
    nextMounted.refreshing = true
    try {
      while (nextMounted.needsRefresh) {
        const result = nextMounted.pendingResult ?? parseCssStylesheetResult(nextMounted.root)
        nextMounted.pendingResult = result
        nextMounted.needsRefresh = false
        for (const value of result.values) activateCssValue(value, document)
        if (nextMounted.needsRefresh) continue
        if (style.textContent !== result.cssText) style.textContent = result.cssText
        nextMounted.pendingResult = undefined
      }
    } catch (error) {
      nextMounted.needsRefresh = true
      throw error
    } finally {
      nextMounted.refreshing = false
    }
  }

  const activation: CssBoxActivation = { document, refresh, boxes: new Set() }
  nextMounted = { root, style, activation, needsRefresh: true, refreshing: false }
  stylesheets.set(identity, nextMounted)
  style.dataset.uikitCss = identity
  activateCssBox(root, activation)
  refresh()
  if (!style.isConnected) document.head.append(style)
  return style
}
