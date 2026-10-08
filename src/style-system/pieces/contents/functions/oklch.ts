/** 具名 OKLCH 通道的内容组织。
 *
 * 保留原始通道，延迟生成普通 CSS 颜色。
 *
 * 通道数据供 JS 调整，JSS 依赖供编译输出。
 */
import { value, type ExpressionValue, type ValueInput } from '../../../value'

/** 普通 OKLCH 颜色通道；透明度省略时为完全不透明。 */
export interface OKLCHChannels {
  lightness: ValueInput
  chroma: ValueInput
  hue: ValueInput
  alpha?: ValueInput
}

/**
 * 返回持有原始 channels 的 ExpressionValue，输出时解析通道内容并生成普通 OKLCH 颜色文本。
 * @example
 * // 创建明度为 0.6、透明度为 0.8 的蓝色，不创建 CSS Variable。
 * oklch({ lightness: 0.6, chroma: 0.12, hue: 250, alpha: 0.8 })
 * // 明度跟随样式变量，其余通道使用指定值。
 * oklch({ lightness: variable(0.6, 'surface-lightness'), chroma: 0.02, hue: 250 })
 */
export function oklch(channels: OKLCHChannels): ExpressionValue<OKLCHChannels> {
  return value(channels, { dependencies: current => Object.values(current), toCSSString: ({ lightness, chroma, hue, alpha }, resolve) => {
    const channels = [lightness, chroma, hue].map(resolve)
    const opacity = resolve(alpha)
    if (channels.some((channel) => channel === undefined) || (alpha !== undefined && opacity === undefined)) return undefined
    return `oklch(${channels.join(' ')}${opacity === undefined || opacity === '1' ? '' : ` / ${opacity}`})`
  } })
}
