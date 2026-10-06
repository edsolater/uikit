/** 组合 CSS 相对 OKLCH 的来源、通道覆盖和独立增量。 */
import { createJSSContent, type JSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { OKLCHChannels } from './oklch'
import { add } from './calc'

/**
 * 从来源颜色构造相对 OKLCH 表达式；先取指定通道，再叠加对应增量。
 * 未指定的通道沿用来源；未指定的增量为零。
 * 相对颜色省略透明度表示沿用来源，显式 alpha: 1 则恢复完全不透明。
 * @example
 * // 固定明度为 0.6，再增加色度 0.02；色相与透明度跟随来源。
 * composeRelativeOKLCH(source, {
 *   channels: { lightness: 0.6 },
 *   adjustments: { chroma: 0.02 },
 * })
 */
export function deriveColor(
  base: ValueInput,
  { channels = {}, adjustments = {} }: {
    channels?: Partial<OKLCHChannels>
    adjustments?: Partial<OKLCHChannels>
  },
): JSSContent {
  const adjust = (channel: ValueInput, change: ValueInput) => change === undefined || change === 0 ? channel : add(channel, change)
  const lightness = adjust(channels.lightness ?? 'l', adjustments.lightness)
  const chroma = adjust(channels.chroma ?? 'c', adjustments.chroma)
  const hue = adjust(channels.hue ?? 'h', adjustments.hue)
  const alpha = adjust(channels.alpha ?? 'alpha', adjustments.alpha)
  return createJSSContent((resolve) => {
    const contents = [base, lightness, chroma, hue, alpha].map(resolve)
    if (contents.some((content) => content === undefined)) return undefined
    return `oklch(from ${contents[0]} ${contents[1]} ${contents[2]} ${contents[3]}${contents[4] === 'alpha' ? '' : ` / ${contents[4]}`})`
  }, [base, lightness, chroma, hue, alpha])
}
