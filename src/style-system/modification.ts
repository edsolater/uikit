/**
 * 可独立声明的颜色变化配方。
 *
 * 将源无关通道保存为带名称的 Token，供修改操作和直接声明共同消费。
 *
 * 来源颜色与变化参数分别复用，CSS 继续负责局部覆盖。
 */
import { assert, isObject, isString } from '@edsolater/fnkit'
import { token, type Token } from './token/core'
import { allocateVariableName } from './custom-property-names'
import {
  oklchChannels,
  type OKLCHChannelChange,
  type OKLCHChanges,
} from './pieces/functions/oklch'
import { type JSSContent } from './content'

/** 颜色变化的固定通道或相对当前通道的计算。 */
export type ColorChannelModification = OKLCHChannelChange

/** 可复用的 OKLCH 通道变化参数。 */
export interface ColorModificationDetail extends OKLCHChanges {}

/** 独立变化 Token；type/detail 表达修改策略，基础内容按当前参数生成。 */
export interface Modification<
  Detail = ColorModificationDetail,
  Type extends string = 'color',
> extends Token {
  type: Type
  detail: Detail
}

/** 颜色修改接受的配方 Token。 */
export type ColorModificationContent = Modification<
  ColorModificationDetail,
  'color'
>

/** 颜色变化材料的策略标识；内容身份由 Token 创建入口保证。 */
export const colorModificationShape = {
  type: (input: unknown) => input === 'color',
}

/**
 * 创建源无关的颜色配方，显式名称可被 CSS 局部覆盖，省略名称时自动分配。
 * 通道参数在编译时读取，不冻结创建时的回调结果。
 */
export function modification(definition: {
  type: 'color'
  detail: ColorModificationDetail
  name?: string
}): ColorModificationContent {
  assert(isString(definition.type), 'Modification type 必须是字符串。')
  assert(definition.type === 'color', 'Modification 尚未支持内容领域。')
  assert(isObject(definition.detail), 'Modification 需要有效 detail 材料。')
  let self: ColorModificationContent
  self = Object.assign(
    token(() => oklchChannels(self.detail), {
      name: definition.name ?? allocateVariableName(),
    }),
    {
      type: definition.type,
      detail: definition.detail,
    },
  ) as ColorModificationContent
  return self
}
