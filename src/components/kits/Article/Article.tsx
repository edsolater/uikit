/**
 * Article的正文语义与透明承载实现。
 */
import { toArray } from '@edsolater/fnkit'
import { createComponent, mergeProps, omitProps, type JSX } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import type { ControllerCollection } from '@/components/utils/controllerRegistry'
import type { RefReceiver } from '@/hooks/createRef'
import { kit, type KitController } from '@/components/utils/kit'
import { pivDefaultSources } from '@/components/Piv/Piv.prop'
import { articlePropsDefinition } from './Article.prop'
import { Piv, type PivProps } from '../../Piv/Piv'
import './Article.style'

type ArticleCarrier = (props: PivProps<'article'>) => JSX.Element

type ArticleCarrierProps<Carrier extends ArticleCarrier> = Omit<
  Parameters<Carrier>[0],
  'as' | 'ref'
> &
  ComponentDescriptionProps & { as: Carrier; ref?: RefReceiver<ArticleController> }

/** Article 自有的完整输入；承载组件额外字段由泛型调用单独约束。 */
export type ArticleProps = Omit<PivProps<'article'>, 'as'> &
  ComponentDescriptionProps & {
    ref?: RefReceiver<ArticleController>
    /**
     * 承载 Article 的表现组件。
     * Article 会消费这个属性，并把原生 article 身份交给承载组件，不增加额外 DOM。
     */
    as?: ArticleCarrier
  }

/** 未指定表现组件时，直接用原生 article 承载的调用分支。 */
export type ArticleDefaultProps = Omit<ArticleProps, 'as'> & { as?: undefined }

interface ArticleComponent {
  (props: ArticleDefaultProps): JSX.Element
  <Carrier extends ArticleCarrier>(
    props: ArticleCarrierProps<Carrier>,
  ): JSX.Element
  controllers: ControllerCollection<ArticleController>
}

/** 只操作 Article 自有字段；表现组件在构建时选择，不属于可写状态。 */
export type ArticleController = KitController<ArticleProps, typeof articlePropsDefinition>

// kit 原样转交承载字段；这里只恢复原泛型 Carrier 与额外字段 的调用关联。
/**
 * Article承载可脱离当前页面、独立理解的正文，不添加背景、padding或边框皮肤。
 *
 * 默认裁剪自身内容首尾的块外边距；这是.Article组件样式，不改变裸article标签的默认行为。
 * as只选择表现载体，最终仍是一个原生article，不增加DOM层；ref归Article自身，不下传给载体。
 * 用户class、shadow来源和载体额外字段持续转交，正文透明承载协议见Article.spec.md。
 */
export const Article = kit(
  {
    name: 'Article',
    description: '承载独立正文',
    availableProps: articlePropsDefinition,
    directorOptions: () => ({ defaultSources: pivDefaultSources }),
  },
  (rawProps: ArticleProps) => {
    const Carrier = rawProps.as ?? Piv
    const articleIdentity = { class: 'Article' }
    const carrierProps = mergeProps(rawProps, {
      as: 'article' as const,
      get shadowProps() {
        return toArray(rawProps.shadowProps, articleIdentity)
      },
    })
    // getter 保留完整 Director 视图，避免原生 omit 折叠上游记录而绕过字段与 as 覆盖。
    return createComponent(Carrier, omitProps(() => carrierProps, 'ref'))
  },
) as ArticleComponent
