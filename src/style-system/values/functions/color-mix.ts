/** CSS color-mix 函数，保留颜色与混合比例。 */
import { type Value, toValue, parseValue } from '../../core/css-value'

/** 已包装的混色参与项；未给比例时交由 CSS 分配。 */
type MixColor = Value | [color: Value, weight: number]

/** 混色输入允许直接使用颜色关键字。 */
type MixColorInput = Value | string | [color: Value | string, weight: number]

/** 保留参与颜色和混合比例的复合颜色值。 */
export interface ColorMix extends Value {
  colors: MixColor[]
}

/**
 * 在 oklab 中混合颜色；weight 取 0 到 1，对应 CSS 的百分比。
 * @example
 * colorMix(['red', 0.5], 'transparent').parseCss() // color-mix(in oklab, red 50%, transparent)
 */
export function colorMix(...colors: MixColorInput[]): ColorMix {
  return {
    kind: 'value',
    colors: colors.map<MixColor>((color) =>
      typeof color === 'string' || 'kind' in color ? toValue(color) : [toValue(color[0]), color[1]],
    ),
    parseCss(context) {
      return `color-mix(in oklab, ${this.colors
        .map((color) => 'kind' in color ? parseValue(color, context) : `${parseValue(color[0], context)} ${color[1] * 100}%`)
        .join(', ')})`
    },
  }
}
