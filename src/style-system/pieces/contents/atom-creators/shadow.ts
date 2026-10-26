/** CSS 阴影内容。 */
import { token, type Token, type TokenInput } from '../../../token'

/** 单层阴影配置。 */
export interface ShadowShape {
  x: TokenInput
  y: TokenInput
  blur?: TokenInput
  spread?: TokenInput
  color?: TokenInput
  inset?: boolean
}

/** 延迟生成单层阴影。 */
export function shadowValue(shape: ShadowShape): Token<ShadowShape> {
  return token<ShadowShape>(
    { default: shape },
    {
      dependencies: (shape) => [
        shape.x,
        shape.y,
        shape.blur,
        shape.spread,
        shape.color,
      ],
      toCSSString: (shape, resolve) => {
        const x = resolve(shape.x)
        const y = resolve(shape.y)
        const blur = resolve(shape.blur)
        const spread = resolve(shape.spread)
        const color = resolve(shape.color)
        if (x === undefined || y === undefined) return undefined
        return [
          shape.inset ? 'inset' : undefined,
          x,
          y,
          blur ?? (spread === undefined ? undefined : '0'),
          spread,
          color,
        ]
          .filter((part) => part !== undefined)
          .join(' ')
      },
    },
  )
}
