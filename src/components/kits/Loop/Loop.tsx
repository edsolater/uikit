/**
 * Loop 是响应式重复内容组件。
 *
 * 按列表来源维护条目子树和索引，将重复内容的具体表达交给调用方。
 *
 * 条目身份由列表维护，具体内容与行为由调用方决定。
 */
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import { mapArray, createEffect, createState, val } from '@/foundation'
import { createDomRef } from '@/hooks'

import {
  componentName,
  loopPropDefinition,
  type LoopProps,
  type LoopController,
  type LoopComponent,
} from './Loop.prop'

/**
 * 创建列表实例，内容工厂在条目作用域消费原始条目。
 */
const loopComponent: KitComponent<
  LoopProps<unknown>,
  LoopController<unknown>
> = kit(
  {
    name: componentName,
    description: '排列重复内容',
    propDefinition: loopPropDefinition,
  },
  (props, { name }) => {
    const [loopContainer, setDomRef] = createDomRef<HTMLDivElement>()
    const innerState = createState<unknown[]>([])

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
      <Piv shadowProps={props} class={name} domRef={setDomRef}>
        {mapped()}
      </Piv>
    )
  },
)

/**
 * 公开列表入口，保留每次调用的条目、内容工厂与 ref 类型。
 */
export const Loop: LoopComponent = loopComponent as LoopComponent
