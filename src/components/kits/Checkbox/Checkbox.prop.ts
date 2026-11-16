/**
 * Checkbox 的输入、字段协议与实例控制声明。
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
import type { LabelProps } from '../Label/Label.prop'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Checkbox'

/** Checkbox 的公共声明与自有业务输入。 */
export type CheckboxProps = KitProps<{}, CheckboxController, 'div'> & {
  name?: string
  checked: Source<boolean>
  label: Source<string>
  tooltip?: LabelProps['tooltip']
  disabled?: Source<boolean | undefined>
  required?: boolean
  onChange?: (checked: boolean) => void
}

/** 自有字段按实际消费者选择来源视图或当前值视图。 */
const checkboxOwnPropDefinition = {
  name: 'state-value-view',
  checked: 'state-source-view',
  label: 'state-source-view',
  tooltip: 'state-value-view',
  disabled: 'state-source-view',
  required: 'state-value-view',
  onChange: 'state-value-view',
} as const

/** 自有读取方式与完整公共协议共同组成字段声明。 */
export type CheckboxPropDefinition = KitPropDefinition<
  typeof checkboxOwnPropDefinition
>

/** Checkbox 的完整运行时字段协议。 */
export const checkboxPropDefinition: CheckboxPropDefinition = {
  ...kitPropDefinition,
  ...checkboxOwnPropDefinition,
}

/** Checkbox 的输入干预入口。 */
export interface CheckboxController extends KitController<
  CheckboxProps,
  CheckboxPropDefinition
> {}
