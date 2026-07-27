import { createReactionFn } from './createReactiveRunner'
import { type Source, val } from './read'
import { type State, type StateView, toStateView } from './state'

/**
 * 把一个 Source 映射成新的 StateView。
 *
 * PromiseLike Source 在完成前会把 undefined 交给 mapper；其他 Source 也统一通过 StateView 建立持续映射。
 * 这个函数只公开映射结果，不公开内部写入口。
 *
 * 直接依赖 `toStateView()` 统一普通值、StateView 与 PromiseLike，不自行管理 StateView 身份映射。
 */
export function mapSource<T, U>(
  source: Source<T>,
  mapper: (value: T) => U | StateView<U>,
): StateView<U> {
  return toStateView(source).map(mapper)
}

/**
 * 比 {@link mapSource} 更简单的派生状态创建函数。
 */

export function derive<T>(source: Source<T>): Source<T>
export function derive<T, U>(
  source: Source<T>,
  mapper: (value: T) => U | StateView<U>,
): StateView<U>
export function derive<T, U>(
  source: Source<T>,
  mapper?: (value: T) => U | StateView<U>,
): Source<T> | StateView<U> {
  if (!mapper) return source
  return mapSource(source, mapper)
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
