/**
 * Input 有效性判断的输入、结果与字段协议。
 *
 * invalid 与 validIf 继续作为来源交给原有效性计算消费。
 *
 * 将校验契约与读取方式集中声明，计算实现只消费这些事实。
 */
import type { PropsDefinition } from '../../tools/componentPropsDirector'
import type { MayArraySource, Source, StateView } from '@/foundation'
import type { StatusProps } from '../utils/parseStatusProps'

/** 一项可持续更新的有效性条件，should 为 true 时通过。 */
export type InputValidationRule = {
  should: Source<boolean>
}

/** 单项校验输入；未提供或条件未通过时不视为有效。 */
export type InputValidationInput = Source<
  boolean | InputValidationRule | undefined
>

/** 需要全部通过的校验条件，单项与条件数组均可保留来源。 */
export type InputValidationConditions = MayArraySource<
  boolean | InputValidationRule
>

/** 外部无效标记与校验条件共同决定最终有效性。 */
export type InputValidityProps = StatusProps<'invalid'> & {
  /** 所有条件都通过时输入框才视为有效。 */
  validIf?: InputValidationConditions
}

/** 保留响应来源的最终有效性，不接管字段值。 */
export type InputValidity = {
  isValid: StateView<boolean>
}

/** 有效性判断持续消费 invalid 与 validIf 的来源。 */
export const inputValidityPropDefinition = {
  invalid: 'state-source-view',
  validIf: 'state-source-view',
} satisfies PropsDefinition<InputValidityProps>
