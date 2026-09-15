/** 一条阴影的结构与值语法，不决定消费属性，也不组合多条阴影。 */
import { parseValue, type Value } from '../core/css-value'

/** 阴影的几何与颜色配置；组成值保留自己的身份。 */
export interface ShadowShape {
  /** 水平与垂直偏移；正值向右、向下。 */
  x: Value | string
  y: Value | string

  /** 模糊半径，省略时不模糊。 */
  blur?: Value | string

  /** 扩展距离，负值收缩。 */
  spread?: Value | string
  color?: Value | string

  /** 内阴影；省略时为外阴影。 */
  inset?: boolean
}

/** 一条可独立解析与激活的阴影，不是 box-shadow 声明或阴影列表。 */
export interface Shadow extends Value, ShadowShape {}

/**
 * 取得一条阴影，保留各组成 Value；不绑定属性 Key。
 * @example shadowValue({ x: '0', y: '2px', blur: '4px', color: 'black' }).parseCss() // 0 2px 4px black
 * @example boxShadow(shadowValue({ x: '0', y: '1px' }), shadowValue({ x: '0', y: '6px' }))
 */
export function shadowValue(shape: ShadowShape): Shadow {
  return {
    ...shape,
    kind: 'value',
    parseCss(context) {
      const inset = this.inset ? 'inset ' : ''
      const offset = `${parseValue(this.x, context)} ${parseValue(this.y, context)}`
      // 只给扩展距离时，零模糊半径占住第三个长度的位置，避免扩展被误读成模糊。
      const blur = this.blur === undefined
        ? this.spread === undefined ? '' : ' 0'
        : ` ${parseValue(this.blur, context)}`
      const spread = this.spread === undefined ? '' : ` ${parseValue(this.spread, context)}`
      const color = this.color === undefined ? '' : ` ${parseValue(this.color, context)}`
      return `${inset}${offset}${blur}${spread}${color}`
    },
  }
}
