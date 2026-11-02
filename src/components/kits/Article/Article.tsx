/**
 * Article 是语义组件：固定独立正文身份，不提供容器皮肤。
 */
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import type { RefReceiver } from '@/hooks/createRef'
import { kit, type KitController } from '@/components/tools/kit'
import { pivDefaultSources } from '@/components/Piv/Piv.prop'
import { articlePropsDefinition } from './Article.prop'
import { Piv, type PivProps } from '../../Piv/Piv'
import './Article.style'

/** 固定 article 根的正文输入；布局与皮肤通过职责明确的组件组合表达。 */
export type ArticleProps = Omit<PivProps<'article'>, 'as'> &
  ComponentDescriptionProps & {
    ref?: RefReceiver<ArticleController>
  }

/** 只操作正文自身字段，不接管组合中 Card 的实例或视觉属性。 */
export type ArticleController = KitController<ArticleProps, typeof articlePropsDefinition>

/**
 * 语义组件：以原生 article 表达独立正文，默认无容器皮肤，仅裁剪自身首尾块外边距。
 *
 * 常规承载写成 <Card><Article>正文</Article></Card>；正文中的内容卡片也可放在 Article 内。
 */
export const Article = kit(
  {
    name: 'Article',
    description: '承载独立正文',
    availableProps: articlePropsDefinition,
    directorOptions: () => ({ defaultSources: pivDefaultSources }),
  },
  (props: ArticleProps) => <Piv as="article" shadowProps={props} class="Article">{props.children}</Piv>,
)
