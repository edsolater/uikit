/**
 * Article 自身拥有的运行时字段协议。
 *
 * 组合固定 article 根的原生字段与用途说明，不提供载体选择协议。
 */
import { pivPropsDefinition } from '@/components/Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '@/components/tools/KitMarker/KitMarker.prop'
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { ArticleProps } from './Article'

const { as: _as, ...articleDOMPropsDefinition } = pivPropsDefinition

export const articlePropsDefinition = {
  ...articleDOMPropsDefinition,
  ...componentDescriptionPropsDefinition,
  ref: 'only-through-prop',
} satisfies PropsDefinition<ArticleProps>
