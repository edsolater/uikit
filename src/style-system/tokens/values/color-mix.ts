/** 在 oklab 色彩空间混色。 */
import { parseValue, toValue, type Value } from '../../core/css-value'

type ColorStop = Value | readonly [color: Value, weight: number]
type ColorInput = Value | string | readonly [color: Value | string, weight: number]

export interface ColorMix extends Value {
  readonly colors: readonly ColorStop[]
}

/**
 * weight 取 0 到 1，对应 CSS 的百分比。
 * @example
 * const tint = colorMix([variable('accent'), 0.5], value('transparent'))
 */
export function colorMix(...colors: ColorInput[]): ColorMix {
  return {
    kind: 'value',
    colors: colors.map((stop) =>
      typeof stop === 'string' || 'kind' in stop ? toValue(stop) : ([toValue(stop[0]), stop[1]] as const),
    ),
    parseCss(context) {
      return `color-mix(in oklab, ${this.colors
        .map((stop) =>
          'kind' in stop ? parseValue(stop, context) : `${parseValue(stop[0], context)} ${stop[1] * 100}%`,
        )
        .join(', ')})`
    },
  }
}
