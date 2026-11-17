/**
 * Flow 的公共输入与实例控制声明。
 *
 * 在同一处组合公共字段协议与组件自有定义。
 *
 * 渲染实现与样式解释分别由同名组件文件和样式文件承担。
 */
import {
  kitPropDefinition,
  type KitController,
  type KitPropDefinition,
  type KitProps,
} from '../../tools/kit'
import type { FlowStyleConfig } from './Flow.style'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Flow'

/** Flow 的公共输入与自有字段分别声明，空槽保留组件扩展位置。 */
export type FlowProps = KitProps<{
  $styleConfig: FlowStyleConfig
  controller: FlowController
}> & {
  // 自有输入
}

/** 这里只补充 Flow 自有的读取模式。 */
export type FlowPropDefinition = KitPropDefinition<{
  // 自有字段模式
}>

/** 公共协议与自有模式共同构成 Flow 的完整运行时定义。 */
export const flowPropDefinition: FlowPropDefinition = {
  ...kitPropDefinition,
}

/** 按已声明输入和原生字段模式提供控制，不接管子组件外观。 */
export interface FlowController extends KitController<{
  props: FlowProps
  propDefinition: FlowPropDefinition
}> {}
