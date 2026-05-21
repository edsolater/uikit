/**
 * 响应式列表组件。
 * 它基于 Solid 的 mapArray 维护子树复用，只负责列表结构，不解包 item 内部字段。
 */
import { createEffect, mapArray, type Accessor, type JSX } from 'solid-js'
import { createDomRef } from '../hooks/domRef'
import { createState, val } from '../hooks/createState'
import { Piv } from './BasicPiv'

export type Read<T> = Accessor<T>

export type EachProps<T> = {
  each: Accessor<T[]>
  fallback?: JSX.Element
  children: (item: T, index: Accessor<number>) => JSX.Element
}

export function Each<T>(props: EachProps<T>) {
  const [loopContainer, setDomRef] = createDomRef<HTMLDivElement>()
  const innerState = createState<T[]>([])

  createEffect(() => {
    val(loopContainer)?.startViewTransition?.(() => {
      // 这里才会有viewTransition的动画，所以即使是外部来的，那也要在这里进行设置。setState一定得由它来进行设置。
      innerState.set(props.each())
    })
  })

  const mapped = mapArray(
    () => val(innerState),
    props.children,
    props.fallback === undefined
      ? undefined
      : {
          fallback: () => props.fallback,
        },
  )

  return <Piv class='Loop' ref={setDomRef}>{mapped()}</Piv>
}
