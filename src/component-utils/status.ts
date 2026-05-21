import { isArray, isString } from '@edsolater/fnkit'
import { createPivPlugin } from '../components'
import type { ClassNameList } from '../components/BasicPiv/className'
import { type Source, val, createState, state } from '../hooks'
import type { PluginManager } from './type'

/* 它可以是一个巨长的字符串，然后我们会自动以空格分割 */
export type StatusInput<S extends string> = Source<S | S[] | Record<S, Source<boolean>>>

/**
 * Status 是一个轻量级的状态管理工具，适用于组件内部或组件之间需要共享状态的场景。
 * 它的输入可以是一个字符串、字符串数组或一个状态记录对象，输出是一个包含状态查询和设置方法的控制器。
 *
 * 使用场景：
 * - 组件内部需要管理多个状态标记，例如 "active"、"disabled"、"error" 等。
 * - 组件之间需要共享状态，例如父组件控制子组件的 "selected" 状态。
 * - 需要根据状态动态生成 className，例如 "status:active"、"status:error" 等。
 * - 需要一个简单的 API 来设置和查询状态，而不想引入完整的状态管理库。
 *
 * 示例用法：
 * ```ts
 * function MyComponent(props: StatusProps<'active' | 'disabled' | 'error'>) {
 *   const status = useStatus(props.status)
 *   return (
 *     <div class={status.class}>
 *       <button onClick={() => status.set('active', true)}>Activate</button>
 *      <button onClick={() => status.set('error', true)}>Error</button>
 *    </div>
 *  )}
 * ```
 *
 * AI 规则：
 * - 不要把状态输入限制为特定的字符串或枚举；它应该是一个灵活的输入，可以是字符串、字符串数组或状态记录对象。
 * - 不要在组件外部直接操作状态记录对象；应该通过 `set` 方法来修改状态，以保持响应性。
 * - 不要把状态查询方法 `has` 的返回值直接当成布尔值使用；它是一个动态值，应该在需要时用 `val()` 读取当前值。
 * - 不要把 `class` 直接当成静态字符串使用；它是一个动态生成的 className 列表，应该在 JSX 模板中直接使用，而不是提前读取成字符串。
 */
export type StatusProps<S extends string> = {
  status?: StatusInput<S>
}

export type StatusManager<S extends string> = {
  setStatus(status: S, value: Source<boolean>): void
  hasStatus(status: S): Source<boolean>
  /** 业务层无需关心，{@link createStatusManager} 会自动使用的 */
  _class: ClassNameList
}

function splitStatusTokens(statusLongString: string): string[] {
  return statusLongString.split(/\s+/).filter(Boolean)
}

/**
 * Status管理器只有在重型组件或者需要状态管理的组件上才会使用。
 */
function createStatusStateParser<S extends string>(propsStatus?: StatusInput<S> | undefined): StatusManager<S>
function createStatusStateParser<S extends string>(propsStatus?: StatusInput<any> | undefined): StatusManager<S>
function createStatusStateParser<S extends string>(propsStatus?: StatusInput<any> | undefined): StatusManager<S> {
  const inputStatusRecord = state(propsStatus).map((innerStatus) => {
    if (!innerStatus) {
      return {}
    }
    if (isString(innerStatus)) {
      const statusTokens = splitStatusTokens(innerStatus)
      return statusTokens.reduce((acc, status) => ({ ...acc, [status]: true }), {} as Record<S, Source<boolean>>)
    }
    if (isArray(innerStatus)) {
      return innerStatus.reduce((acc, status) => ({ ...acc, [status]: true }), {} as Record<S, Source<boolean>>)
    }
    return innerStatus
  }) satisfies Source<Record<S, Source<boolean>>>

  const statusRecord = createState<Record<S, Source<boolean>>>(() => ({} as Record<S, Source<boolean>>)).follow(
    inputStatusRecord,
  )

  const statusController: StatusManager<S> = {
    setStatus(status: S, value: Source<boolean>) {
      statusRecord.set((record) => ({ ...record, [status]: value }))
    },
    hasStatus(status: S) {
      return statusRecord.map((record) => val(record[status]) === true)
    },
    _class: statusRecord.map((record) => Object.keys(record).filter((key) => val(record[key as S]) === true)),
  }

  return statusController
}

export function createStatusManager<T extends string>() {
  const statusManager = createStatusStateParser<T>()
  const statusPlugin = createPivPlugin(() => ({
    class: statusManager._class,
  }))
  return { controller: statusManager, plugin: statusPlugin } satisfies PluginManager
}
