import {
  AbortController,
  hasProperty,
  isFunction,
  task,
  type Task,
  type TaskContext,
} from '@edsolater/fnkit'
import type { DomProxy } from '../plugins/tools/domProxy'

type DomSource<Dom extends Element> = Dom | undefined | PromiseLike<Dom | undefined>
type SourceOrGetter<T> = T | (() => T)

type RunDomActionOptions<Dom extends Element, Args extends unknown[]> = {
  action: (element: Dom, ...args: Args) => boolean
} & (
  | { dom: SourceOrGetter<DomSource<Dom>>; waitForAttachment?: false }
  | { dom: SourceOrGetter<DomProxy<Dom & HTMLElement> | undefined>; waitForAttachment: true }
)

/** 等待本次目标挂载，同时把 Task 的取消传给节点观察。 */
async function waitForAttachment<Dom extends Element>(
  source: DomSource<Dom>,
  context: TaskContext,
) {
  if (source === undefined) return undefined
  if (!hasProperty(source, 'isReady', isFunction)) {
    throw new TypeError('等待挂载需要提供 DOM 代理')
  }
  const waiting = new AbortController()
  const subscription = context.onCancel(reason => waiting.abort(reason))
  try {
    if (await source.isReady(undefined, waiting.signal)) return await source
  } finally {
    subscription.unsubscribe()
  }
}

/**
 * 用 Task 包裹 DOM 操作。每次执行时解析 dom 提供的元素，再检查任务是否已取消。
 * 元素为 undefined 时跳过操作，本次 isSuccess 为 false。
 * action 接收实际元素和本次执行的参数，返回的布尔值通过 TaskResult.isSuccess 读取。
 * 指定 waitForAttachment 时先等待节点挂载；插件代理使用其 isReady，以便作用域退出时结束等待。
 * @example
 * const focus = runDomAction({
 *   dom: input,
 *   action(element) {
 *     element.focus()
 *     return element.matches(':focus')
 *   },
 * })
 * const focused = await focus().isSuccess
 */
export function runDomAction<Dom extends Element, Args extends unknown[]>(
  options: RunDomActionOptions<Dom, Args>,
): Task<void, Args> {
  const { dom, action, waitForAttachment: shouldWait } = options
  return task(async (context, ...args: Args) => {
    const source = isFunction(dom) ? dom() : dom
    const element = shouldWait
      ? await waitForAttachment(source, context)
      : await source
    await context.canContinue()
    context.reportSuccess(
      element !== undefined &&
      (!shouldWait || element.isConnected) &&
      action(element, ...args),
    )
  })
}
