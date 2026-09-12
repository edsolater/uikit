/** 保留混色的颜色对象与权重，最终才组成 color-mix 表达。 */
import { block } from '../core/css-block'
import type { Value } from '../core/derive/css-value'

/** 一个颜色对象及可选的 0 到 1 权重。 */
type ColorStop = Value | [color: Value, weight: number]

/** 保存混色输入的值对象；colors 使用浅层写时复制，内部颜色仍共享。 */
export interface ColorMix extends Value {
  colors: ColorStop[]
}

/** 组合原生 color-mix，不提前求取颜色字符串。
 * @example
 * const tint = colorMix([variable('accent'), 0.5], value('transparent'))
 */
export function colorMix(...colors: ColorStop[]): ColorMix {
  return block({ kind: 'value' as 'value', colors }, {
    /** 沿当前颜色对象传播激活。 */
    getDependencies() { return this.colors.map(stop => Array.isArray(stop) ? stop[0] : stop) },
    /** 最终提交时组合当前颜色及权重。 */
    parseCss() {
      return `color-mix(in oklab, ${this.colors.map(stop => Array.isArray(stop)
        ? `${stop[0].parseCss()} ${stop[1] * 100}%` : stop.parseCss()).join(', ')})`
    },
  })
}
