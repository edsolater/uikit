/**
 * Piv 的字段协议。
 *
 * 复用 Dode 的原生声明，再补充实例名称、来源和节点能力规则。
 *
 * Kit 的完整公共表通过该拥有者协议复用 Piv 语义。
 */
import type { PivProps } from './Piv'
import type { PropsDefinition } from '../tools/componentPropsDirector'
import { dodeDOMPropsDefinition } from './Dode.prop'

/** 运行时描述与 Props 继承结构一致，本层补充实例名称及来源声明字段。 */
export const pivPropsDefinition = {
  ...dodeDOMPropsDefinition,
  label: 'state-source-view',
  shadowProps: 'state-value-view',
  is: 'state-value-view',
} satisfies PropsDefinition<PivProps>

/** Piv 领域声明事实的完整类型。 */
export type PivPropDefinition = typeof pivPropsDefinition
