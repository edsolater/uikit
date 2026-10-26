/**
 * 响应式列表组件。
 * 它基于 Solid 的 mapArray 维护子树复用，只负责列表结构，不解包 item 内部字段。
 */
import {
  mapArray,
  type Accessor,
  type JSX,
  createEffect,
  createState,
  val,
} from '@/foundation'
import { createDomRef } from '@/hooks'
import { Piv } from '../Piv/Piv'
import {
  ComponentWrapper,
  type ComponentDescriptionProps,
} from '@/components/ComponentWrapper/ComponentWrapper'

export type Read<T> = Accessor<T>

export type EachProps<T> = ComponentDescriptionProps & {
  each: Accessor<T[]>
  fallback?: JSX.Element
  children: (item: T, index: Accessor<number>) => JSX.Element
}

export function Each<T>(props: EachProps<T>) {
  const [loopContainer, setDomRef] = createDomRef<HTMLDivElement>()
  const innerState = createState<T[]>([])

  createEffect(
    () => ({ items: props.each(), container: val(loopContainer) }),
    ({ items, container }) => {
      container?.startViewTransition(() => {
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
    <ComponentWrapper
      componentName="Each"
      description={props.description}
      descriptionDisplay={props.descriptionDisplay}
      defaultDescription="排列重复内容"
    >
      <Piv class="Loop" ref={setDomRef}>
        {mapped()}
      </Piv>
    </ComponentWrapper>
  )
}
