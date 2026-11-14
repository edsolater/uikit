/**
 * Loop 是响应式重复内容的组织组件。
 *
 * 按列表来源维护条目子树和索引，不解包条目内部字段。
 *
 * 让重复内容保留条目身份，具体内容与行为由调用方决定。
 */
import { kit, type KitController } from '../../tools/kit'
import type { ControllerCollection } from '../../tools/controllerRegistry'
import type { RefReceiver } from '@/hooks/createRef'
import { loopPropsDefinition } from './Loop.prop'
import {
  mapArray,
  type Accessor,
  type JSX,
  createEffect,
  createState,
  val,
} from '@/foundation'
import { createDomRef } from '@/hooks'
import { Piv } from '../../Piv/Piv'
import type { ComponentDescriptionProps } from '../../tools/KitMarker/KitMarker'

/** 列表来源与条目渲染关系，索引来源随条目位置持续更新。 */
export type LoopProps<T> = ComponentDescriptionProps & {
  ref?: RefReceiver<LoopController<T>>
  each: Accessor<T[]>
  fallback?: JSX.Element
  children: (item: T, index: Accessor<number>) => JSX.Element
}

/** 列表来源与可干预展示字段。 */
export type LoopController<T> = KitController<
  LoopProps<T>,
  typeof loopPropsDefinition
>

/** 保留条目与渲染回调的泛型关联，集合只公开与条目类型无关的字段。 */
interface LoopComponent {
  <T>(props: LoopProps<T>): JSX.Element
  controllers: ControllerCollection<{
    props: Omit<LoopController<unknown>['props'], 'each'>
  }>
}

/**
 * 按列表来源维护条目子树，保留条目与动态索引的对应关系。
 */
// kit 原样包装泛型核心；这里恢复列表项与渲染回调的调用关联。
export const Loop = kit<LoopProps<unknown>, typeof loopPropsDefinition>(
  {
    name: 'Loop',
    description: '排列重复内容',
    propsDefinition: loopPropsDefinition,
  },
  <T,>(props: LoopProps<T>) => {
    const [loopContainer, setDomRef] = createDomRef<HTMLDivElement>()
    const innerState = createState<T[]>([])

    createEffect(
      () => ({
        items: props.each(),
        startViewTransition: loopContainer.startViewTransition,
      }),
      ({ items, startViewTransition }) => {
        startViewTransition?.(() => {
          // 这里才会有 viewTransition 的动画，所以外部数据也要在这里提交。
          innerState.set(items)
        })
      },
    )

    const mapped = mapArray(
      () => val(innerState),
      props.children,
      props.fallback === undefined
        ? undefined
        : {
            fallback: () => props.fallback,
          },
    )

    return (
      <Piv class="Loop" domRef={setDomRef}>
        {mapped()}
      </Piv>
    )
  },
) as LoopComponent
