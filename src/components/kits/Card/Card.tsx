/**
 * Card 是有边界、可独立理解的信息单元。
 * 它把属于同一个对象或主题的内容、视觉声量和物理尺度翻译成完整卡片；业务流程、整卡交互、外部布局和提升状态留给对应上层能力。
 *
 * 组件选择与档位规则见 [Card 设计规格](./Card.spec.md)。
 */
import { Piv, type PivProps } from '../../Piv'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import { createBrandPropsParser, type BrandProps } from '../utils/parseBrandProps'
import './Card.css'

/**
 * 卡片的视觉声量 Brand Props。
 *
 * - soft：弱化边界和阴影，适合辅助信息或嵌套信息单元。
 * - solid：实体主题卡片，适合需要更稳定内容对比的信息单元。
 * - undefined：默认半透明主题卡片，适合普通信息单元。
 *
 * 声量确定时优先声明 soft 或 solid；只有声量会在多个 Brand 之间变化时才使用 variant。
 * variant 一旦声明便接管整个声量分组，即使当前值是 undefined 也不会回落到确定描述词。
 */
export type CardVariantProps = BrandProps<'variant', 'soft' | 'solid'>

/**
 * 卡片内部的物理容纳尺度 Brand Props，同时调整内容内边距、内容间距和圆角。
 *
 * - small：紧凑信息单元。
 * - large：宽松信息单元。
 * - xlarge：内容较多的大尺寸信息单元。
 * - undefined：普通信息单元。
 *
 * 尺寸确定时优先声明 small、large 或 xlarge；只有尺寸会在多个 Brand 之间变化时才使用 size。
 * size 一旦声明便接管整个尺寸分组，即使当前值是 undefined 也不会回落到确定描述词。
 */
export type CardSizeProps = BrandProps<'size', 'small' | 'large' | 'xlarge'>

export interface CardProps<Tag extends PivSupportedElementTag = 'div'>
  extends PivProps<Tag>, CardVariantProps, CardSizeProps {}

const parseCardBrandProps = createBrandPropsParser([
  { groupName: 'variant', candidates: ['soft', 'solid'] },
  { groupName: 'size', candidates: ['small', 'large', 'xlarge'] },
])

export function Card<Tag extends PivSupportedElementTag = 'div'>(props: CardProps<Tag>) {
  const { brandShadowProps } = parseCardBrandProps(props)

  return (
    <Piv
      as={props.as}
      shadowProps={[props, brandShadowProps]}
      class="Card"
    >
      {props.children}
    </Piv>
  )
}
