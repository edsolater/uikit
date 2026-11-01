/**
 * Article 表达可脱离当前页面结构、仍能独立理解的正文内容。
 * 它不创建视觉、不增加 DOM 层；as 只选择承载正文的表现组件，最终原生节点始终是 article。
 *
 * 组件选择与透明承载协议见 [Article 设计规格](./Article.spec.md)。
 */
import { createComponent, mergeProps, omitProps, type JSX } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import type { ControllerCollection } from '@/components/utils/controllerRegistry'
import type { RefReceiver } from '@/hooks/createRef'
import { kit, type KitController } from '@/components/utils/kit'
import { pivDefaultSources } from '@/components/Piv/Piv.prop'
import { articlePropsDefinition } from './Article.prop'
import { Piv, type PivProps } from '../../Piv/Piv'

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

/**
 * 按原承载协议呈现 article，保留自有 ref 而不把它交给承载组件。
 */
// kit 原样转交承载字段；这里只恢复原泛型 Carrier 与额外字段 的调用关联。
export const Article = kit(
  {
    name: 'Article',
    description: '承载独立正文',
    availableProps: articlePropsDefinition,
    directorOptions: () => ({ defaultSources: pivDefaultSources }),
  },
  (rawProps: ArticleProps) => {
    const Carrier = rawProps.as ?? Piv
    const carrierProps = mergeProps(rawProps, { as: 'article' as const })
    // getter 保留完整 Director 视图，避免原生 omit 折叠上游记录而绕过字段与 as 覆盖。
    return createComponent(Carrier, omitProps(() => carrierProps, 'ref'))
  },
) as ArticleComponent
