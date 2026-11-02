/**
 * Article 自身拥有的运行时字段协议。
 *
 * 组合正文原生字段与用途说明，as 只在创建时选择承载组件。
 *
 * 承载组件额外字段原样透传，不虚构 Article 不拥有的 Controller 字段。
 */
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { ArticleProps } from './Article'

export const articlePropsDefinition = {
  ...pivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  as: 'only-through-prop',
  ref: 'only-through-prop',
} satisfies PropsDefinition<ArticleProps>
