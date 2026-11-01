/**
 * Label 的运行时字段定义。
 *
 * 描述字段关联、标题与辅助说明的来源，以及继承的组件说明协议。
 *
 * 让可选 Controller 复用原 Label 逻辑，不引入 Piv 的额外公开字段。
 */
import { componentDescriptionPropsDefinition } from '@/components/ComponentMarker/ComponentMarker.prop'
import type { PropsDefinition } from '@/components/utils/componentPropsDirector'
import type { LabelProps } from './Label'

/** 内容保持 Source，由原 label 与提示逻辑消费；ref 只从上游交付。 */
export const labelPropsDefinition = {
  ...componentDescriptionPropsDefinition,
  for: 'state-source-view',
  children: 'state-source-view',
  tooltip: 'state-source-view',
  tooltipTrigger: 'state-source-view',
  ref: 'only-through-prop',
} satisfies PropsDefinition<LabelProps>
