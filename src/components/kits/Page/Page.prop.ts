/**
 * Page 的输入、字段协议与实例控制声明。
 *
 * 聚合页面标题、副标题、动作与主要内容。
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
export const componentName = 'Page'

/** Page 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type PageProps = KitProps<{
  controller: PageController
  domTag: 'main'
}> & {
  title?: Source<string | undefined>
  /** 可见副标题，保持正文语义，不用作结构查看元数据。 */
  subtitle?: Source<string | undefined>
  actions?: JSX.Element
  children?: JSX.Element
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const pageOwnPropDefinition = {
  title: 'source',
  subtitle: 'source',
  actions: 'tracked-value',
  children: 'tracked-value',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type PagePropDefinition = KitPropDefinition<typeof pageOwnPropDefinition>

/** 与类型契约对应的完整运行时字段定义。 */
export const pagePropDefinition: PagePropDefinition = {
  ...kitPropDefinition,
  ...pageOwnPropDefinition,
}

/** 控制页面标题、副标题、动作与正文输入。 */
export interface PageController extends KitController<{
  props: PageProps
  propDefinition: PagePropDefinition
}> {}
