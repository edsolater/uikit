/**
 * Card 是有边界、可独立理解的信息单元。
 * 它把属于同一个对象或主题的内容、视觉声量和物理尺度翻译成完整卡片；业务流程、整卡交互、外部布局和提升状态留给对应上层能力。
 *
 * 组件选择与档位规则见 [Card 设计规格](./spec.md)。
 */
import type { Source } from '../../../hooks'
import { Piv, type PivProps } from '../../Piv'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import { createCardProfile, type CardSize, type CardTone } from './createCardProfile'
import './Card.css'

export interface CardProps<Tag extends PivSupportedElementTag = 'div'> extends PivProps<Tag> {
  /**
   * 卡片的视觉声量。
   *
   * - soft：弱化边界和阴影，适合辅助信息或嵌套信息单元。
   * - undefined：默认半透明主题卡片，适合普通信息单元。
   * - solid：实体主题卡片，适合需要更稳定内容对比的信息单元。
   */
  tone?: CardTone

  /**
   * 卡片内部的物理容纳尺度，同时调整内容内边距、内容间距和圆角。
   *
   * - small：紧凑信息单元。
   * - undefined：普通信息单元。
   * - large：宽松信息单元。
   * - xlarge：内容较多的大尺寸信息单元。
   */
  size?: Source<CardSize | undefined>
}

export function Card<Tag extends PivSupportedElementTag = 'div'>(props: CardProps<Tag>) {
  const { plugin: cardProfilePlugin } = createCardProfile(props)

  return (
    <Piv
      as={props.as}
      shadowProps={props}
      class="Card"
      plugin={cardProfilePlugin}
    >
      {props.children}
    </Piv>
  )
}
