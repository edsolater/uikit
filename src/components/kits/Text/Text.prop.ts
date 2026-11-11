/**
 * Text 的运行时字段定义。
 *
 * 组合继承的 Piv 与说明协议，只补充纯文字和创建时的标签选择。
 *
 * 让可选 Controller 沿用原 Props 消费链，不给 Text 增加 as 入口。
 */
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { TextProps } from './Text'

const { as: _as, ...textPivPropsDefinition } = pivPropsDefinition

/** 标签只在创建时选择，文字与继承字段继续使用原消费方式。 */
export const textPropsDefinition = {
  ...textPivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  block: 'state-untracked',
  p: 'state-untracked',
  emphasis: 'state-untracked',
  tone: 'state-source-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<TextProps>
