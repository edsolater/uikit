import { createReactionFn } from './createReactiveRunner'
import { type Source, val } from './read'
import { type StateView, createState, type State } from './state'

/**
 * 虽然实际上它创建了一个新的state，
 * 但是我觉得在语义上它应该是个read-only statem,
 * 不然的话，它的返回结构不太符合业务直觉。
 *
 * @param source 需要订阅的一个源
 * @param toNew
 * @returns
 */
export function mapSource<T, U>(source: Source<T>, toNew: (value: T) => Source<U>): StateView<U> {
  const mappedState = createState()
  createReactionFn(() => {
    const sourceValue = val(source)
    const newValue = val(toNew(sourceValue))
    mappedState.set(newValue)
  })
  return mappedState as State<U>
}

/**
 * 数据源A **跟随** 数据源B的变化
 * @param thisState 数据源A
 * @param followTarget 数据源B
 * @param transform 经过转换默认直接输出
 * @return 函数：取消跟随
 */

export function followState<T, U>(
  thisState: State<T>,
  followTarget: StateView<U>,
  transform: (value: U) => T = (v) => v as unknown as T,
): () => void {
  const { dispose: unfollow } = createReactionFn(() => {
    const newValue = transform(val(followTarget))
    thisState.set(newValue)
  })
  return unfollow
}
