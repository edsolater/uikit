import type { AnyFn } from '@edsolater/fnkit'
import { cssValue, type CssValue } from './css-value'

/** 一个容器，可以容纳其他内容
 * cssBox 本身也是 cssvalue，也具有链式继承能力
 */
interface CssBox extends CssValue {
  /** 容纳，也会显式继承激活链 */
  hold(box: CssBox): CssBox
  holdedCssValues: CssValue[]
}

/** 容器 */
export function cssBox(
  content: (childBox: AnyFn) => unknown,
  /* 先简单点，显式定义依赖， 但后续会优化到自动追踪依赖（像solidjs那样） */
  deps: CssValue[],
): CssBox {
  // 它接手了的css value，当自身更新的时候会“连带激活”。
  const holdedCssValues: CssValue[] = deps

  const box = cssValue('{ /TODO: Content }', {
    onActive() {
      // 当box激活时， 连带激活接受了的css value
      holdedCssValues.forEach((v) => v.activate())
    },
  }) as CssBox
  box.holdedCssValues = holdedCssValues
  box.hold = function (childBox: CssBox) {
    holdedCssValues.push(childBox)
    return box
  }
  return box
}
