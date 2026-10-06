/** 将具名 OKLCH 通道包装为普通 CSS 颜色内容。 */
import { createJSSContent, type JSSContent } from '../../../content'
import type { ValueInput } from '../../../value'

/** 普通 OKLCH 颜色通道；透明度省略时为完全不透明。 */
export interface OKLCHChannels {
  lightness: ValueInput
  chroma: ValueInput
  hue: ValueInput
  alpha?: ValueInput
}

/**
 * 构造普通 OKLCH 颜色，通道中的 JSS 内容在编译消费时解析。
 * @example
 * // 创建明度为 0.6、透明度为 0.8 的蓝色，不创建 CSS Variable。
 * oklch({ lightness: 0.6, chroma: 0.12, hue: 250, alpha: 0.8 })
 * // 明度跟随样式变量，其余通道使用指定值。
 * oklch({ lightness: variable(0.6, 'surface-lightness'), chroma: 0.02, hue: 250 })
 */
export function oklch({ lightness, chroma, hue, alpha }: OKLCHChannels): JSSContent {
  return createJSSContent((resolve) => {
    const channels = [lightness, chroma, hue].map(resolve)
    const opacity = resolve(alpha)
    if (channels.some((channel) => channel === undefined) || (alpha !== undefined && opacity === undefined)) return undefined
    return `oklch(${channels.join(' ')}${opacity === undefined || opacity === '1' ? '' : ` / ${opacity}`})`
  }, [lightness, chroma, hue, alpha])
}
