/**
 * 使用基础状态能力的映射与派生组合。
 *
 * 组合 Foundation 的来源转换和映射能力，不定义 State 协议。
 *
 * 让使用状态的组合与基础状态定义保持各自职责。
 */
import { type Source, stateView, type StateView } from '@/foundation'

/**
 * 把一个 Source 映射成新的 StateView。
 *
 * PromiseLike Source 的等待与失败由 Solid 处理；mapper 只接收完成值。
 * 这个函数只公开映射结果，不公开内部写入口。
 *
 * 直接依赖 `stateView()` 统一普通值、StateView 与 PromiseLike，不自行管理 StateView 身份映射。
 */
export function mapSource<T, U>(
  source: Source<T>,
  mapper: (value: Awaited<T>) => U | StateView<U>,
): StateView<Awaited<U>> {
  return stateView(source).map(mapper)
}

/**
 * 比 {@link mapSource} 更简单的派生状态创建函数。
 */

export function derive<T>(source: Source<T>): Source<T>
export function derive<T, U>(
  source: Source<T>,
  mapper: (value: Awaited<T>) => U | StateView<U>,
): StateView<Awaited<U>>
export function derive<T, U>(
  source: Source<T>,
  mapper?: (value: T) => U | StateView<U>,
): Source<T> | StateView<Awaited<U>> {
  if (!mapper) return source
  return mapSource(source, mapper)
}
