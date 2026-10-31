import type { PivProps } from './Piv'
import type { DefaultPropSources, PropsDefinition } from '../utils/componentPropsDirector'
import { dodeDOMPropsDefinition } from './Dode.prop'
import { publicCapabilityDefaultSources, publicCapabilityPropsDefinition } from './plugin/publicCapabilities.prop'

/** 运行时描述与 Props 继承结构一致，本层只补充来源声明字段。 */
export const pivPropsDefinition = {
  ...dodeDOMPropsDefinition,
  ...publicCapabilityPropsDefinition,
  shadowProps: 'state-untracked',
  plugin: 'state-untracked',
  plugins: 'state-untracked',
  trait: 'state-untracked',
} satisfies PropsDefinition<PivProps>

export const pivDefaultSources = publicCapabilityDefaultSources satisfies DefaultPropSources<
  PivProps,
  typeof pivPropsDefinition
>
