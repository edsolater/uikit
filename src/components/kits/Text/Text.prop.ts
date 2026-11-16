/**
 * Text 的输入、字段协议与实例控制声明。
 *
 * 保留文字来源与互斥的语义标签选择。
 *
 * 渲染行为由同名组件实现，样式仍归所属样式文件。
 */
import type { Source } from '@/foundation'

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Text'

/** Text 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type TextProps = Omit<
  KitProps<{
    controller: TextController
    domTag: 'span' | 'div' | 'p' | 'strong'
  }>,
  'as' | 'children'
> & {
  children?: Source<string | number | undefined>
  /** 使用父级字号的80%，保持原文字语气。 */
  small?: Source<boolean | undefined>
  /** 文字自身的语气，不改变其内容或字段状态。 */
  tone?: Source<'normal' | 'muted' | 'warning' | 'result' | undefined>
} & (
    | { block?: boolean; p?: never; emphasis?: never }
    | { p?: boolean; block?: never; emphasis?: never }
    | { emphasis?: boolean; p?: never; block?: never }
  )

/** 固定根语义不公开的公共字段。 */
const { as: _as, ...textCommonPropDefinition } = kitPropDefinition

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const textOwnPropDefinition = {
  block: 'state-untracked',
  p: 'state-untracked',
  emphasis: 'state-untracked',
  tone: 'state-source-view',
  small: 'state-source-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type TextPropDefinition = Omit<
  KitPropDefinition<typeof textOwnPropDefinition>,
  'as'
>

/** 与类型契约对应的完整运行时字段定义。 */
export const textPropDefinition: TextPropDefinition = {
  ...textCommonPropDefinition,
  ...textOwnPropDefinition,
}

/** 控制文字与原生输入，语义标签仅在创建时选择。 */
export interface TextController extends KitController<{
  props: TextProps
  propDefinition: TextPropDefinition
}> {}
