/**
 * Input 有效性输入的运行时字段协议。
 *
 * invalid 与 validIf 继续作为来源交给原有效性计算消费。
 *
 * 字段定义与 InputValidityProps 同归属，不在 Input 重复维护。
 */
import type { PropsDefinition } from '@/components/tools/componentPropsDirector'
import type { InputValidityProps } from './createInputValidity'

export const inputValidityPropsDefinition = {
  invalid: 'state-source-view',
  validIf: 'state-source-view',
} satisfies PropsDefinition<InputValidityProps>
