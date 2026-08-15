/**
 * Article 表达可脱离当前页面结构、仍能独立理解的正文内容。
 * 它不创建视觉、不增加 DOM 层；as 只选择承载正文的表现组件，最终原生节点始终是 article。
 *
 * 组件选择与透明承载协议见 [Article 设计规格](./Article.spec.md)。
 */
import { splitProps, type JSX } from 'solid-js'
import { Piv, type PivProps } from '../../Piv'

type ArticleCarrier = (props: PivProps<'article'>) => JSX.Element

type ArticleCarrierProps<Carrier extends ArticleCarrier> =
  Omit<Parameters<Carrier>[0], 'as'> & { as: Carrier }

export type ArticleProps = Omit<PivProps<'article'>, 'as'> & {
  /**
   * 承载 Article 的表现组件。
   * Article 会消费这个属性，并把原生 article 身份交给承载组件，不增加额外 DOM。
   */
  as?: undefined
}

interface ArticleComponent {
  (props: ArticleProps): JSX.Element
  <Carrier extends ArticleCarrier>(props: ArticleCarrierProps<Carrier>): JSX.Element
}

export const Article: ArticleComponent = (rawProps) => {
  const [local, carrierProps] = splitProps(rawProps, ['as'])
  const Carrier = local.as

  return Carrier
    ? <Carrier {...carrierProps} as="article" />
    : <Piv {...carrierProps} as="article" />
}
