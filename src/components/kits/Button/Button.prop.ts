/** Button 的运行时字段协议与候选定义；只有启用组件 ref 才使用可写 Props 准备。 */
import { createVariantPropsParser } from '../utils/parseVariantProps'
import type { DefaultPropSources, PropsDefinition } from '../../utils/componentPropsDirector'
import type { ButtonProps } from './Button'
import { toRecord } from '@edsolater/fnkit'
import { pivDefaultSources, pivPropsDefinition } from '../../Piv/Piv.prop'
import { componentDescriptionPropsDefinition } from '../../ComponentMarker/ComponentMarker.prop'

export const buttonVariantGroups = [
  { groupName: 'appearance', candidates: ['filled', 'outlined', 'plain'] },
  { groupName: 'emphasis', candidates: ['soft', 'strong'] },
  { groupName: 'tone', candidates: ['danger'] },
  { groupName: 'size', candidates: ['small', 'large', 'xlarge'] },
] as const satisfies Parameters<typeof createVariantPropsParser>[0]

export const buttonStatusCandidates = ['loading', 'disabled'] as const

/** Source 交原消费者读取；普通值跟踪读取；原创建字段取消跟踪但不缓存。 */
export const buttonPropsDefinition = {
  ...pivPropsDefinition,
  ...componentDescriptionPropsDefinition,
  appearance: 'state-source-view',
  filled: 'state-source-view',
  outlined: 'state-source-view',
  plain: 'state-source-view',
  emphasis: 'state-source-view',
  soft: 'state-source-view',
  strong: 'state-source-view',
  tone: 'state-source-view',
  danger: 'state-source-view',
  size: 'state-source-view',
  small: 'state-source-view',
  large: 'state-source-view',
  xlarge: 'state-source-view',
  loading: 'state-source-view',
  disabled: 'state-source-view',
  ref: 'only-through-prop',
  name: 'state-source-view',
  onClick: 'state-value-view',
} satisfies PropsDefinition<ButtonProps>

const variantSources = toRecord(buttonVariantGroups, group => group.groupName, group => {
  const parse = createVariantPropsParser([group])
  return (input: ButtonProps) => {
    const { details } = parse(input)
    return details[group.groupName]
  }
})
const emptySource = () => undefined

/** 每个缺省分组只建立自己的语义 Source；原核心仍执行一次最终映射。 */
export const buttonDefaultSources = {
  ...variantSources,
  ...toRecord(buttonStatusCandidates, key => key, () => emptySource),
  ...pivDefaultSources,
} as DefaultPropSources<ButtonProps, typeof buttonPropsDefinition>

/** 只有缺省分组改用同 State 的默认 Source；显式分组保留原核心的冲突报告。 */
export function getButtonPropsDirectorOptions(input: ButtonProps) {
  return {
    defaultSources: buttonDefaultSources,
    omit: buttonVariantGroups.flatMap(group => group.groupName in input ? [] : group.candidates),
  }
}
