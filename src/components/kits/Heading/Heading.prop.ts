/**
 * Heading 的输入、字段协议与实例控制声明。
 *
 * 明确标题层级和原生根，定位 ID 由实际文字维护。
 *
 * 渲染行为由同名组件实现，样式仍归所属样式文件。
 */

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Heading'

/** 标题的语义层级。 */
export type HeadingLevel = 1 | 2 | 3 | 4

/** 标题的原生根标签。 */
export type HeadingTag = `h${HeadingLevel}`

/** Heading 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type HeadingProps = Omit<
  KitProps<{ controller: HeadingController; domTag: HeadingTag }>,
  'as' | 'id'
> & {
  level: HeadingLevel
}

/** 固定根语义不公开的公共字段。 */
const { as: _as, id: _id, ...headingCommonPropDefinition } = kitPropDefinition

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const headingOwnPropDefinition = {
  level: 'state-untracked',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type HeadingPropDefinition = Omit<
  KitPropDefinition<typeof headingOwnPropDefinition>,
  'as' | 'id'
>

/** 与类型契约对应的完整运行时字段定义。 */
export const headingPropDefinition: HeadingPropDefinition = {
  ...headingCommonPropDefinition,
  ...headingOwnPropDefinition,
}

/** 控制标题内容与原生输入；层级只在创建时选择标签。 */
export interface HeadingController extends KitController<{
  props: HeadingProps
  propDefinition: HeadingPropDefinition
}> {}
