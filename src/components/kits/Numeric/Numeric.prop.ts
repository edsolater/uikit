/**
 * Numeric 的输入、字段协议与实例控制声明。
 *
 * 声明原值与有效位数，格式化由组件统一处理。
 *
 * 格式化由同名组件实现，文字呈现与语气样式沿用 Text。
 */
import type { Source } from '@/foundation'

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Numeric'

/** Numeric 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type NumericProps = KitProps<{}, NumericController, 'span'> & {
  value?: Source<number | null | undefined>
  significantDigits?: Source<number | undefined>
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const numericOwnPropDefinition = {
  value: 'state-source-view',
  significantDigits: 'state-source-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type NumericPropDefinition = KitPropDefinition<
  typeof numericOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const numericPropDefinition: NumericPropDefinition = {
  ...kitPropDefinition,
  ...numericOwnPropDefinition,
}

/** 控制原值与有效位数，更新沿原格式化链显示。 */
export interface NumericController extends KitController<
  NumericProps,
  NumericPropDefinition
> {}
