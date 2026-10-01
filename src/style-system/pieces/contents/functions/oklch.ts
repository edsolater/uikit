/** 在 CSS 相对 OKLCH 上下文组合基础色、绝对通道与增量。 */
import { createJSSContent, type JSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import { calcAdd } from './calc'

/** 四通道按明度、色度、色相、透明度排列，由 CSS 保留原始色的通道符号。 */
export function oklch(base: ValueInput, channels: [ValueInput, ValueInput, ValueInput, ValueInput],
  deltas: [ValueInput, ValueInput, ValueInput, ValueInput]): JSSContent {
  const adjusted = channels.map((channel, index) => calcAdd(channel, deltas[index]))
  return createJSSContent((resolve) => {
    const contents = [base, ...adjusted].map(resolve)
    return contents.some((content) => content === undefined) ? undefined
      : `oklch(from ${contents[0]} ${contents[1]} ${contents[2]} ${contents[3]} / ${contents[4]})`
  }, [base, ...adjusted])
}
