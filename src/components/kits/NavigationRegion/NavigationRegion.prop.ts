/**
 * NavigationRegion 的输入、字段协议与实例控制声明。
 *
 * 以区域名称和子内容共同表达导航范围。
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
export const componentName = 'NavigationRegion'

/** NavigationRegion 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type NavigationRegionProps = Omit<
  KitProps<{
    controller: NavigationRegionController
    domTag: 'nav'
  }>,
  'label'
> & {
  label: Source<string>
  children?: JSX.Element
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const navigationRegionOwnPropDefinition = {
  children: 'state-value-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type NavigationRegionPropDefinition = KitPropDefinition<
  typeof navigationRegionOwnPropDefinition
>

/** 与类型契约对应的完整运行时字段定义。 */
export const navigationRegionPropDefinition: NavigationRegionPropDefinition = {
  ...kitPropDefinition,
  ...navigationRegionOwnPropDefinition,
}

/** 控制导航区域名称、内容与原生节点输入。 */
export interface NavigationRegionController extends KitController<{
  props: NavigationRegionProps
  propDefinition: NavigationRegionPropDefinition
}> {}
