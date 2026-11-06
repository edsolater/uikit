import type { PivProps } from './Piv'
import type { PropsDefinition } from '../tools/componentPropsDirector'
import { dodeDOMPropsDefinition } from './Dode.prop'

/** 运行时描述与 Props 继承结构一致，本层只补充来源声明字段。 */
export const pivPropsDefinition = {
  ...dodeDOMPropsDefinition,
  shadowProps: 'state-untracked',
  is: 'state-untracked',
} satisfies PropsDefinition<PivProps>
