/**
 * Board 的输入与实例控制协议。
 *
 * 在同一处声明承载材质、容纳尺度和原生根的关联。
 *
 * 字段定义紧邻输入声明，组件实现按这份契约创建内容。
 */
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
} from '../../tools/kit'
import type { JSX } from '@/foundation'
import type { PivSupportedElementTag } from '../../Piv/domMap'
import type { ControllerRegistry } from '../../tools/controllerRegistry'
import type { VariantProps } from '../utils/parseVariantProps'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Board'

/** 材质与容纳尺度是独立互斥分组。 */
export const boardVariantGroups = [
  { groupName: 'variant', candidates: ['soft', 'solid'] },
  { groupName: 'size', candidates: ['small', 'large', 'xlarge'] },
] as const

/** 承载材质的确定描述与动态选择。 */
export type BoardVariantProps = VariantProps<
  'variant',
  (typeof boardVariantGroups)[0]['candidates'][number]
>
/** 承载内部空间的确定描述与动态选择。 */
export type BoardSizeProps = VariantProps<
  'size',
  (typeof boardVariantGroups)[1]['candidates'][number]
>

/** 原生根、材质和容纳尺度，引用保留同一 Tag 的控制协议。 */
export type BoardProps<Tag extends PivSupportedElementTag = 'div'> = KitProps<{
  controller: BoardController<Tag>
  domTag: Tag
}> &
  BoardVariantProps &
  BoardSizeProps & {
    // 自有输入
  }

/** 组件自有输入的读取方式。 */
const boardOwnPropDefinition = {
  variant: 'state-source-view',
  soft: 'state-source-view',
  solid: 'state-source-view',
  size: 'state-source-view',
  small: 'state-source-view',
  large: 'state-source-view',
  xlarge: 'state-source-view',
} as const

/** 完整字段协议，公共输入由 Kit 提供。 */
export type BoardPropDefinition = KitPropDefinition<
  typeof boardOwnPropDefinition
>

/** 运行时协议与输入类型共同约束读取方式。 */
export const boardPropDefinition: BoardPropDefinition = {
  ...kitPropDefinition,
  ...boardOwnPropDefinition,
}

/** 指定原生根的承载实例控制。 */
export interface BoardController<
  Tag extends PivSupportedElementTag = 'div',
> extends KitController<{
  props: BoardProps<Tag>
  propDefinition: BoardPropDefinition
}> {}

/** 异构节点集合只公开各 Tag 共同安全的输入。 */
export type BoardControllerRegistry = ControllerRegistry<{
  controller: {
    props: Omit<
      BoardController<PivSupportedElementTag>['props'],
      'as' | 'htmlProps' | 'on' | 'domRef' | 'shadowProps' | 'is'
    >
  }
}>

/** 调用端保留 Tag 与 ref 的关联，集合不假定具体 Tag。 */
export interface BoardComponent {
  <Tag extends PivSupportedElementTag = 'div'>(
    props: BoardProps<Tag>,
  ): JSX.Element
  controllers: BoardControllerRegistry
}
