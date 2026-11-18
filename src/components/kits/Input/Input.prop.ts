/**
 * Input 的输入、字段协议与实例控制声明。
 *
 * 组合公共原生声明与本组件业务输入，明确动态来源的消费方式。
 *
 * 让公开契约独立于渲染实现，相关字段和控制声明在同一处维护。
 */
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'
import type { Source } from '@/foundation'
import {
  inputValidityPropDefinition,
  type InputValidityProps,
} from './validity.prop'
import type { StatusController } from '../utils/parseStatusProps'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Input'

/** Input 的公共声明与自有业务输入。 */
export type InputProps = KitProps<{
  controller: InputController
  domTag: 'input'
}> &
  InputValidityProps & {
    /** 原生输入类型；省略时为单行文字。 */
    type?: Source<'text' | 'color' | undefined>
  }

/** 自有字段按实际消费者选择来源视图或当前值视图。 */
const inputOwnPropDefinition = {
  ...inputValidityPropDefinition,
  type: 'tracked-value',
} as const

/** 自有读取方式与完整公共协议共同组成字段声明。 */
export type InputPropDefinition = KitPropDefinition<
  typeof inputOwnPropDefinition
>

/** Input 的完整运行时字段协议。 */
export const inputPropDefinition: InputPropDefinition = {
  ...kitPropDefinition,
  ...inputOwnPropDefinition,
}

/** Input 的输入干预与业务状态入口。 */
export interface InputController
  extends
    KitController<{ props: InputProps; propDefinition: InputPropDefinition }>,
    StatusController<'invalid'> {}
