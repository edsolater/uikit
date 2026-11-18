/**
 * Help 的输入、字段协议与实例控制声明。
 *
 * 描述帮助内容、入口文字与可访问名称。
 *
 * 渲染行为由同名组件实现，样式仍归所属样式文件。
 */
import type { PivProps } from '../../Piv/Piv'
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Help'

/** Help 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type HelpProps = KitProps<{
  controller: HelpController
  domTag: 'button'
}> & {
  tooltip?: PivProps['children']
  /** 替换默认问号的显示内容，不放入另一个交互控件。 */
  trigger?: PivProps['children']
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const helpOwnPropDefinition = {
  tooltip: 'source',
  trigger: 'source',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type HelpPropDefinition = KitPropDefinition<typeof helpOwnPropDefinition>

/** 与类型契约对应的完整运行时字段定义。 */
export const helpPropDefinition: HelpPropDefinition = {
  ...kitPropDefinition,
  ...helpOwnPropDefinition,
}

/** 控制帮助内容、触发文字与可访问名称。 */
export interface HelpController extends KitController<{
  props: HelpProps
  propDefinition: HelpPropDefinition
}> {}
