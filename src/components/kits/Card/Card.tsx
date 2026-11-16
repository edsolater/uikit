/**
 * Card 是可独立理解的信息体组件。
 *
 * 以独立信息体身份复用 Board 材质，默认块排版并裁剪首尾外边距。
 *
 * 内容排列由调用方组合 Flow 或 Grid，承载材质保持同源。
 */
import { kit, type KitComponent } from '../../tools/kit'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import { renderBoard } from '../Board/Board'
import { boardVariantGroups } from '../Board/Board.prop'
import {
  componentName,
  cardPropDefinition,
  type CardProps,
  type CardController,
  type CardComponent,
} from './Card.prop'
import './Card.style'

/**
 * 独立信息体沿用承载解析，保持自己的 Marker 与实例集合。
 */
const cardComponent: KitComponent<{
  props: CardProps<PivSupportedElementTag>
  controller: CardController<PivSupportedElementTag>
}> = kit(
  {
    name: componentName,
    componentDescription: '组织独立信息',
    propDefinition: cardPropDefinition,
    variantGroups: boardVariantGroups,
  },
  (props, { name }) => renderBoard(props, 'Board ' + name),
)

/**
 * 保留调用方选择的原生根及其精确实例控制协议。
 */
export const Card: CardComponent = cardComponent as CardComponent
