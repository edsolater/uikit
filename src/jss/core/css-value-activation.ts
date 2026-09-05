/** 为 CssValue 附着按所属 Document 隔离的一次性激活生命周期。 */
import type { CssValue, CssValueContent } from './css-value'

export interface CssValueActivationContext {
  document: Document
  /** 在当前最终解析边界解释激活行为依赖的内容结果。 */
  parse: (content: CssValueContent) => string
}

export type CssValueActivation = (context: CssValueActivationContext) => void

type CssValueState = 'activating' | 'active'

const activationsByValue = new WeakMap<CssValue, CssValueActivation[]>()
const statesByDocument = new WeakMap<Document, WeakMap<CssValue, CssValueState>>()

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

/** 在最终解析经过 value 时执行其激活行为，并保证同一 Document 只成功执行一次。 */
export function activateCssValue(
  value: CssValue,
  document: Document,
  parse: (content: CssValueContent) => string,
): void {
  const activations = activationsByValue.get(value)
  if (!activations?.length) return

  let states = statesByDocument.get(document)
  if (!states) {
    states = new WeakMap()
    statesByDocument.set(document, states)
  }

  const state = states.get(value)
  if (state === 'active') return
  if (state === 'activating') throw new Error('CssValue 激活关系形成了循环。')

  states.set(value, 'activating')
  try {
    for (const activation of activations) activation({ document, parse })
    states.set(value, 'active')
  } catch (error) {
    states.delete(value)
    throw error
  }
}
