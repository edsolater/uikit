/**
 * Article 是独立正文的语义组件。
 *
 * 固定原生 article 身份并保留正文内容和节点声明。
 *
 * 让正文语义独立于 Card 等承载组件的外观。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  articlePropDefinition,
  type ArticleProps,
  type ArticleController,
} from './Article.prop'

import './Article.style'

/**
 * 语义组件：以原生 article 表达独立正文，默认无容器皮肤，仅裁剪自身首尾块外边距。
 *
 * 常规承载写成 <Card><Article>正文</Article></Card>；正文中的内容卡片也可放在 Article 内。
 */
export const Article: KitComponent<{
  props: ArticleProps
  controller: ArticleController
}> = kit(
  {
    name: componentName,
    description: '承载独立正文',
    propDefinition: articlePropDefinition,
  },
  (props, { name }) => (
    <Piv as="article" shadowProps={props} class={name}>
      {props.children}
    </Piv>
  ),
)
