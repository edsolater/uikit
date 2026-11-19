import {
  AbortController,
  task,
  type Task,
  type TaskContext,
} from '@edsolater/fnkit'
import type { DomProxy } from '../plugins/tools/domProxy'

type DomSource<Dom extends Element> =
  | Dom
  | undefined
  | PromiseLike<Dom | undefined>
type DomTaskOptions<Dom extends Element, Args extends unknown[]> = {
  getAction: (element: Dom) => (...args: Args) => boolean
} & (
  | { getDom: () => DomSource<Dom>; waitForAttachment?: false }
  | {
      getDom: () => DomProxy<Dom & HTMLElement> | undefined
      waitForAttachment: true
    }
)

/** 等待本次目标挂载，同时把 Task 的取消传给节点观察。 */
async function waitForAttachment<Dom extends HTMLElement>(
  source: DomProxy<Dom> | undefined,
  context: TaskContext,
) {
  if (source === undefined) return undefined
  const waiting = new AbortController()
  const subscription = context.onCancel(reason => waiting.abort(reason))
  try {
    if (await source.isReady(undefined, waiting.signal)) return await source
  } finally {
    subscription.unsubscribe()
  }
}

/**
 * 用 Task 包裹 DOM 操作。每次执行时调用 getDom 取得元素，再检查任务是否已取消。
 * 元素为 undefined 时跳过操作，本次 isSuccess 为 false。
 * getAction 根据元素生成动作，动作接收本次调用参数，返回值通过 TaskResult.isSuccess 读取。
 * 指定 waitForAttachment 时先等待节点挂载；插件代理使用其 isReady，以便作用域退出时结束等待。
 * @example
 * const focus = domTask({
 *   getDom: () => input,
 *   getAction: element => () => {
 *     element.focus()
 *     return element.matches(':focus')
 *   },
 * })
 * const focused = await focus().isSuccess
 */
export function domTask<Dom extends Element, Args extends unknown[] = []>({
  getDom,
  getAction,
  waitForAttachment: shouldWait,
}: DomTaskOptions<Dom, Args>): Task<void, Args> {
  return task(async (context, ...args: Args) => {
    const element = shouldWait
      ? await waitForAttachment(getDom(), context)
      : await getDom()
    await context.canContinue()
    context.reportSuccess(
      element !== undefined &&
        (!shouldWait || element.isConnected) &&
        getAction(element)(...args),
    )
  })
}
