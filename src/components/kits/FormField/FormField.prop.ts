/**
 * FormField 的输入、字段协议与实例控制声明。
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

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'FormField'

/** FormField 的公共声明与自有业务输入。 */
export type FormFieldProps = KitProps<{ controller: FormFieldController }> & {
  // 自有输入。
}

/** 普通组合内容沿用公共输入协议，当前没有自有读取模式。 */
export type FormFieldPropDefinition = KitPropDefinition<{}>

/** FormField 的完整运行时字段协议。 */
export const formFieldPropDefinition: FormFieldPropDefinition = {
  ...kitPropDefinition,
}

/** FormField 的输入干预入口。 */
export interface FormFieldController extends KitController<{
  props: FormFieldProps
  propDefinition: FormFieldPropDefinition
}> {}
