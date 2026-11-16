/**
 * Article 的输入、字段协议与实例控制声明。
 *
 * 固定 article 根，保留独立正文的内容与原生节点声明。
 *
 * 渲染行为由同名组件实现，样式仍归所属样式文件。
 */

import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Article'

/** Article 的公共输入与自有信息；引用接收器由 Kit 统一提供。 */
export type ArticleProps = Omit<
  KitProps<{}, ArticleController, 'article'>,
  'as'
> & {
  // 自有输入
}

/** 固定根语义不公开的公共字段。 */
const { as: _as, ...articleCommonPropDefinition } = kitPropDefinition

/** 自有读取模式与公共协议共同组成完整字段契约。 */
export type ArticlePropDefinition = Omit<KitPropDefinition<{}>, 'as'>

/** 与类型契约对应的完整运行时字段定义。 */
export const articlePropDefinition: ArticlePropDefinition = {
  ...articleCommonPropDefinition,
}

/** 正文实例的原生输入控制。 */
export interface ArticleController extends KitController<
  ArticleProps,
  ArticlePropDefinition
> {}
