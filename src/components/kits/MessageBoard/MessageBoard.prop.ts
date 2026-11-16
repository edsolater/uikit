/**
 * MessageBoard 的输入、字段协议与实例控制声明。
 *
 * 声明反馈语气与消息内容，承载样式由 Board 复用。
 *
 * 渲染行为由同名组件实现，样式仍归所属样式文件。
 */
import type { Source, JSX } from '@/foundation'

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'MessageBoard'

/** MessageBoard 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type MessageBoardProps = KitProps<{
  controller: MessageBoardController
}> & {
  tone?: Source<'info' | 'success' | 'warning' | 'error' | undefined>
  children?: JSX.Element
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const messageBoardOwnPropDefinition = {
  tone: 'state-source-view',
  children: 'state-value-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type MessageBoardPropDefinition = KitPropDefinition<
  typeof messageBoardOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const messageBoardPropDefinition: MessageBoardPropDefinition = {
  ...kitPropDefinition,
  ...messageBoardOwnPropDefinition,
}

/** 控制反馈语气、内容及承载节点输入。 */
export interface MessageBoardController extends KitController<{
  props: MessageBoardProps
  propDefinition: MessageBoardPropDefinition
}> {}
