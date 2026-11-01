/**
 * 响应式列表组件。
 * 它基于 Solid 的 mapArray 维护子树复用，只负责列表结构，不解包 item 内部字段。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { ControllerCollection } from '@/components/utils/controllerRegistry'
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
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'

export type LoopProps<T> = ComponentDescriptionProps & {
  ref?: RefReceiver<LoopController<T>>
  each: Accessor<T[]>
  fallback?: JSX.Element
  children: (item: T, index: Accessor<number>) => JSX.Element
}

/** 列表来源与可干预展示字段。 */
export type LoopController<T> = KitController<LoopProps<T>, typeof loopPropsDefinition>

interface LoopComponent {
  <T>(props: LoopProps<T>): JSX.Element
  controllers: ControllerCollection<{ readonly props: Omit<LoopController<unknown>['props'], 'each'> }>
}

/**
 * 按原映射器维护列表子树，保留每项与 index 的泛型关联。
 */
// kit 原样包装泛型核心；这里恢复列表项与渲染回调的调用关联。
export const Loop = kit<LoopProps<unknown>, typeof loopPropsDefinition>(
  { name: 'Loop', description: '排列重复内容', availableProps: loopPropsDefinition },
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
