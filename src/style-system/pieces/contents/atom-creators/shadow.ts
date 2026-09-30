/** CSS 阴影内容。 */
import { createJSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

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
  return createJSSContent((resolve) => {
    const x = resolve(shape.x)
    const y = resolve(shape.y)
    const blur = resolve(shape.blur)
    const spread = resolve(shape.spread)
    const color = resolve(shape.color)
    if (x === undefined || y === undefined) return undefined
    return [shape.inset ? 'inset' : undefined, x, y, blur ?? (spread === undefined ? undefined : '0'), spread, color]
      .filter((part) => part !== undefined).join(' ')
  }, [shape.x, shape.y, shape.blur, shape.spread, shape.color])
}
