/** 沿 CssValue 对象关系传播按 Document 隔离的激活生命周期。 */
import {
  isCssValue,
  isCssValueParts,
  readCssValueDependencies,
  readCssValueParts,
  type CssValue,
  type CssValueContent,
  type CssValueParts,
} from './css-value'
import { parseCssValueResult } from './parse-css-value'

export interface CssValueActivationContext {
  document: Document
  /** 在当前最终解析边界解释激活行为依赖的内容结果。 */
  parse: (content: CssValueContent) => string
}

export type CssValueActivation = (context: CssValueActivationContext) => void

interface CssValueActivationState {
  completed: number
  activating: boolean
}

const activationsByValue = new WeakMap<CssValue, CssValueActivation[]>()
const statesByDocument = new WeakMap<Document, WeakMap<CssValue, CssValueActivationState>>()

/**
 * 给已有 value 增加激活行为，同时原样保留这个 value 作为组合结果。
 *
 * @example
 * const registeredColor = withCssValueActivation(cssValue('my-color()'), ({ document }) => {
 *   registerColorFunction(document)
 * })
 */
export function withCssValueActivation(value: CssValue, activation: CssValueActivation): CssValue {
  const activations = activationsByValue.get(value) ?? []
  activations.push(activation)
  activationsByValue.set(value, activations)
  return value
}

/** 沿明确依赖激活一个 value，并保证每项行为在同一 Document 只成功执行一次。 */
export function activateCssValue(value: CssValue, document: Document): void {
  activateCssValueContentTree(value, document, new Set())
}

/** 激活一个 value 内容树中已经明确连接的全部依赖。 */
export function activateCssValueContent(content: CssValueContent, document: Document): void {
  activateCssValueContentTree(content, document, new Set())
}

/** 为当前 Document 取得 value 激活状态表。 */
function getDocumentStates(document: Document): WeakMap<CssValue, CssValueActivationState> {
  let states = statesByDocument.get(document)
  if (!states) {
    states = new WeakMap()
    statesByDocument.set(document, states)
  }
  return states
}

/** 沿对象图递归激活一个 value、片段组或原始值。 */
function activateCssValueContentTree(
  content: CssValueContent,
  document: Document,
  activating: Set<CssValue | CssValueParts>,
): void {
  if (isCssValueParts(content)) {
    if (activating.has(content)) throw new Error('CssValue 激活关系形成了循环。')
    activating.add(content)
    try {
      for (const part of readCssValueParts(content)) activateCssValueContentTree(part, document, activating)
    } finally {
      activating.delete(content)
    }
    return
  }
  if (!isCssValue(content)) return
  if (activating.has(content)) throw new Error('CssValue 激活关系形成了循环。')

  activating.add(content)
  try {
    for (const dependency of readCssValueDependencies(content)) {
      activateCssValueContentTree(dependency, document, activating)
    }
    runCssValueActivations(content, document)
  } finally {
    activating.delete(content)
  }
}

/** 执行一个 value 尚未成功完成的激活行为。 */
function runCssValueActivations(value: CssValue, document: Document): void {
  const activations = activationsByValue.get(value)
  if (!activations?.length) return

  const states = getDocumentStates(document)
  const state = states.get(value) ?? { completed: 0, activating: false }
  if (state.activating) throw new Error('CssValue 激活关系形成了循环。')
  if (state.completed >= activations.length) return

  state.activating = true
  states.set(value, state)
  try {
    while (state.completed < activations.length) {
      activations[state.completed]({
        document,
        parse: (content) => parseActivatedCssValue(content, document),
      })
      state.completed += 1
    }
  } finally {
    state.activating = false
  }
}

/** 在注册输出边界解析一次内容，并激活其中动态出现的 value。 */
function parseActivatedCssValue(content: CssValueContent, document: Document): string {
  const result = parseCssValueResult(content)
  for (const value of result.values) activateCssValue(value, document)
  return result.cssText
}
