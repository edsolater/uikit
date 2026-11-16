/**
 * Percent 的输入、字段协议与实例控制声明。
 *
 * 声明分子、分母与有效位数，百分数由组件计算。
 *
 * 比值由同名组件计算，数字和文字分别沿用 Numeric 与 Text 的呈现。
 */
import type { Source } from '@/foundation'

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Percent'

/** Percent 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type PercentProps = KitProps<{
  controller: PercentController
  domTag: 'span'
}> & {
  numerator?: Source<number | null | undefined>
  denominator?: Source<number | null | undefined>
  significantDigits?: Source<number | undefined>
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const percentOwnPropDefinition = {
  numerator: 'state-source-view',
  denominator: 'state-source-view',
  significantDigits: 'state-source-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type PercentPropDefinition = KitPropDefinition<
  typeof percentOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const percentPropDefinition: PercentPropDefinition = {
  ...kitPropDefinition,
  ...percentOwnPropDefinition,
}

/** 控制分子、分母与有效位数，更新后重新显示比值。 */
export interface PercentController extends KitController<{
  props: PercentProps
  propDefinition: PercentPropDefinition
}> {}
