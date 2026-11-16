/**
 * Field 的输入、字段协议与实例控制声明。
 *
 * 关联字段标题与内容工厂，由同一 ID 连接控件。
 *
 * 字段实现组合 Flow 与 Label，各基础组件保留自己的布局和样式。
 */
import type { Source, JSX } from '@/foundation'

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'
import type { LabelProps } from '../Label/Label.prop'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Field'

/** Field 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type FieldProps = Omit<
  KitProps<{ controller: FieldController }>,
  'children' | 'label'
> & {
  label: Source<string>
  tooltip?: LabelProps['tooltip']
  children: (id: string) => JSX.Element
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const fieldOwnPropDefinition = {
  tooltip: 'state-value-view',
  children: 'only-through-prop',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type FieldPropDefinition = KitPropDefinition<
  typeof fieldOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const fieldPropDefinition: FieldPropDefinition = {
  ...kitPropDefinition,
  ...fieldOwnPropDefinition,
}

/** 控制标题和说明输入；内容工厂只从上游交付。 */
export interface FieldController extends KitController<{
  props: FieldProps
  propDefinition: FieldPropDefinition
}> {}
