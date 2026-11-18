/**
 * Loop 的输入与实例控制协议。
 *
 * 声明列表条目、内容工厂和空状态，保持条目类型与精确 ref 对应。
 *
 * 字段定义紧邻输入声明，组件实现按这份契约创建内容。
 */
import {
  kitPropDefinition,
  type KitProps,
  type KitPropDefinition,
  type KitController,
  type KitInputProps,
} from '../../tools/kit'
import type { Accessor, JSX } from '@/foundation'
import type { ControllerRegistry } from '../../tools/controllerRegistry'

/** 组件统一身份，供创建声明和样式关联引用。 */
export const componentName = 'Loop'

/** 列表来源与条目内容；内容工厂只由上游提供。 */
export type LoopProps<Item> = Omit<
  KitProps<{ controller: LoopController<Item> }>,
  'children'
> & {
  each: Accessor<Item[]>
  fallback?: JSX.Element
  children: (item: Item, index: Accessor<number>) => JSX.Element
}

/** 组件自有输入的读取方式。 */
const loopOwnPropDefinition = {
  each: 'tracked-value',
  children: 'only-through-prop',
  fallback: 'untracked-value',
} as const

/** 完整字段协议，公共输入由 Kit 提供。 */
export type LoopPropDefinition = KitPropDefinition<typeof loopOwnPropDefinition>

/** 运行时协议与输入类型共同约束读取方式。 */
export const loopPropDefinition: LoopPropDefinition = {
  ...kitPropDefinition,
  ...loopOwnPropDefinition,
}

/** 指定条目类型的列表输入控制。 */
export interface LoopController<Item> extends KitController<{
  props: LoopProps<Item>
  propDefinition: LoopPropDefinition
}> {}

/** 列表入口保留条目关联；异构集合不公开各自的 each。 */
export interface LoopComponent {
  <Item>(props: KitInputProps<LoopProps<Item>>): JSX.Element
  controllers: ControllerRegistry<{
    controller: {
      props: Omit<LoopController<unknown>['props'], 'each'>
    }
  }>
}
