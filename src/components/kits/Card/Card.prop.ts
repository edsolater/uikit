/**
 * Card 的输入与实例控制协议。
 *
 * 复用 Board 的材质与尺度，为独立信息体声明自己的节点与引用。
 *
 * 字段定义紧邻输入声明，组件实现按这份契约创建内容。
 */
import { type KitProps, type KitController } from '../../tools/kit'
import type { JSX } from '@/foundation'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import type { ControllerCollection } from '../../tools/controllerRegistry'
import {
  boardPropDefinition,
  type BoardPropDefinition,
  type BoardVariantProps,
  type BoardSizeProps,
} from '../Board/Board.prop'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Card'

/** 独立信息体的材质选择。 */
export type CardVariantProps = BoardVariantProps
/** 独立信息体的容纳尺度。 */
export type CardSizeProps = BoardSizeProps

/** 独立信息体的原生根、材质及尺度。 */
export type CardProps<Tag extends PivSupportedElementTag = 'div'> = KitProps<
  {},
  CardController<Tag>,
  Tag
> &
  CardVariantProps &
  CardSizeProps & {
    // 自有输入
  }

/** Card 沿用承载字段读取协议。 */
export type CardPropDefinition = BoardPropDefinition
/** Card 的字段定义，与自身实例控制配对。 */
export const cardPropDefinition: CardPropDefinition = { ...boardPropDefinition }

/** 保留 Card 原生根类型的实例输入控制。 */
export interface CardController<
  Tag extends PivSupportedElementTag = 'div',
> extends KitController<CardProps<Tag>, CardPropDefinition> {}

/** 异构 Card 集合只公开共同安全的原生输入。 */
export interface CardComponent {
  <Tag extends PivSupportedElementTag = 'div'>(
    props: CardProps<Tag>,
  ): JSX.Element
  controllers: ControllerCollection<{
    props: Omit<
      CardController<PivSupportedElementTag>['props'],
      'as' | 'htmlProps' | 'on' | 'domRef' | 'shadowProps' | 'is'
    >
  }>
}
