/**
 * State 读取入口。
 *
 * 这个文件处在 base-state 的最终消费阶段，
 * 只负责定义状态读取边界：`Source` 表示可以继续传递的值来源，`val()` 表示最终消费时的解包动作。
 *
 * 它负责：
 * - 在最终消费点读取 Source<T> 的当前值。
 * - 为可转换的 PromiseLike 请求并读取稳定的 StateView。
 *
 * 它不负责：
 * - 定义 PromiseLike 与 StateView 的身份映射。
 * - 主动创建或修改业务 State。
 * - 描述 store 字段访问能力。
 * - 管理活水源连接关系。
 */
import { isExist, shrinkFn, type Primitive } from '@edsolater/fnkit'
import { isStateViewable, type Source } from './source'
import { stateView, type StateView } from './state-view'

/** 解除 PromiseLike 与 StateView 包装后得到的最终读取值。 */
export type Val<S> =
  S extends PromiseLike<infer InnerS>
    ? Val<Awaited<InnerS>> | undefined
    : S extends StateView<infer InnerS>
      ? Val<InnerS>
      : S

/**
 *
 * 【表目的（使用名词动词化），工具函数】读取 source 当前值。
 *
 * `val()` 会把 `Source<T>` 读取成当前值：
 * 如果传入的是动态状态读取器，则继续读取；如果传入的是 PromiseLike，则读取其 StateView；
 * 如果传入的是普通值，则直接返回。
 * PromiseLike 未提供 defaultValue 时，pending 或 rejected 读取为 undefined；
 * 提供 defaultValue 时，这两个阶段读取该默认值。fulfilled 后写入 StateView 并触发响应式消费者更新。
 *
 * 它不负责深层 snapshot；如果确实需要把对象树里的 readable state 一起解包，调用方应显式使用 `snapshot()`。
 *
 * `val()` 是最终消费工具，不是中间传递工具。
 * 它只应出现在真正需要当前值的位置，例如 JSX 模板、DOM 副作用、事件计算或调用纯函数之前。
 *
 * 使用规则：
 * - 最终消费当前值时，使用 `val()`。
 * - 继续向下传递动态输入时，保留 `Source<T>`，不要提前解包。
 * - 普通 Source 的第二个参数只在 source 为 `null` 或 `undefined` 时执行，用于提供惰性默认值。
 * - PromiseLike 的第二个参数是 pending 与 rejected 阶段直接使用的 defaultValue。
 * - PromiseLike 需要 errorValue 或 onRejected 时，先显式调用 `stateView()`，再交给 `val()` 读取。
 *
 * AI 规则：
 * - 不要把 `val()` 当成通用“规范化”步骤放在函数开头。
 * - 不要在响应式计算中现场创建新的 PromiseLike 再交给 `val()`；新的实例会建立新的 StateView。
 * - 不要写 `const value = val(source)` 后再把 `value` 传给组件、hook、状态逻辑或 DOM 绑定；这会把动态输入变成一次性快照。
 * - 如果代码意图是“从动态值保持动态性地推导出另一个值”，应继续保留为 `StateView` 或 `Source`，不要提前 `val()`。
 * - 如果没有检索到 `val()` 的实现，应先在当前工具库中查找它，而不是退回到裸 accessor、重复实现或提前解包。
 *
 * @example 组件中使用
 * ```ts
 * const visible = state(true)
 * const label = 'Submit'
 *
 * val(visible) // true
 * val(label)   // 'Submit'
 *
 * element.hidden = !val(visible) // 最终消费：允许
 *
 * const className = derive(visible, v => v ? 'visible' : 'hidden')
 * element.className = val(className) // 最终消费：允许
 *
 * // bad: 提前解包后继续传递，会丢失动态性
 * const fixedVisible = val(visible)
 * Button({ visible: fixedVisible })
 *
 * // good: 继续传递动态来源
 * Button({ visible })
 * ```
 *
 */
type DefaultVal<S> =
  S extends (...args: never[]) => infer ResultV
    ? Val<ResultV>
    : Val<S>

export function val<S extends Primitive>(source: S): S
export function val<R>(source: PromiseLike<R>): Val<PromiseLike<R>>
export function val<V>(source: StateView<V>): Val<StateView<V>>
/**
 * 这是常用 Source<V> 正向契约的便捷重载，不代表 Source 可以被可靠反推。
 * 极少数完全不透明的泛型 S 可能无法得到完美推断，但不应因此把复杂度扩散到所有业务类型。
 */
export function val<V>(source: Source<V>): V
export function val<S>(source: S): Val<S>
export function val<S, DefaultValue>(
  source: S,
  defaultValue: DefaultValue,
): Exclude<Val<S>, null | undefined> | DefaultVal<DefaultValue>
export function val(source: any, defaultValue?: any) {
  if (!isExist(source)) {
    return isExist(defaultValue) ? val(shrinkFn(defaultValue)) : undefined
  }

  if (isStateViewable(source)) {
    const value = stateView(source as any).read()
    return arguments.length > 1 ? val(value, defaultValue) : val(value)
  }

  return source
}
