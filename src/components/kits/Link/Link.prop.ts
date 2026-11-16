/**
 * Link 的输入、字段协议与实例控制声明。
 *
 * 表达导航目标、当前项和另开页面语义。
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
export const componentName = 'Link'

/** Link 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type LinkProps = KitProps<{
  controller: LinkController
  domTag: 'a'
}> & {
  href: Source<string>
  children?: JSX.Element
  current?: Source<boolean | undefined>
  newTab?: boolean
}

/** 自有输入的读取方式；公共字段沿用 Kit 协议。 */
const linkOwnPropDefinition = {
  href: 'state-source-view',
  children: 'state-value-view',
  current: 'state-source-view',
  newTab: 'state-value-view',
} as const

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type LinkPropDefinition = KitPropDefinition<typeof linkOwnPropDefinition>

/** 与类型契约对应的完整运行时字段定义。 */
export const linkPropDefinition: LinkPropDefinition = {
  ...kitPropDefinition,
  ...linkOwnPropDefinition,
}

/** 控制导航目标、当前项及原生链接输入。 */
export interface LinkController extends KitController<{
  props: LinkProps
  propDefinition: LinkPropDefinition
}> {}
