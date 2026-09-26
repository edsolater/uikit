/** CSS 阴影内容。 */
import { createJSSContent } from '../../content'
import type { ValueInput } from '../../value'
import type { JSSContent } from '../../content'

/** 单层阴影配置。 */
export interface ShadowShape {
  x: ValueInput
  y: ValueInput
  blur?: ValueInput
  spread?: ValueInput
  color?: ValueInput
  inset?: boolean
}

/** 延迟生成单层阴影。 */
export function shadowValue(shape: ShadowShape): JSSContent {
  return createJSSContent((read) => {
    const x = read(shape.x)
    const y = read(shape.y)
    const blur = read(shape.blur)
    const spread = read(shape.spread)
    const color = read(shape.color)
    if (x === undefined || y === undefined) return undefined
    return [shape.inset ? 'inset' : undefined, x, y, blur ?? (spread === undefined ? undefined : '0'), spread, color]
      .filter((part) => part !== undefined).join(' ')
  }, [shape.x, shape.y, shape.blur, shape.spread, shape.color])
}
