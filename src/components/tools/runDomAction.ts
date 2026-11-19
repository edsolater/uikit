import { isFunction, task, type Task } from '@edsolater/fnkit'

type DomSource<Dom extends Element> = Dom | undefined | PromiseLike<Dom | undefined>

/**
 * 用 Task 包裹 DOM 操作。每次执行时解析第一个参数提供的元素，再检查任务是否已取消。
 * 元素为 undefined 时跳过操作，本次 isSuccess 为 false。
 * 第二个参数接收实际元素和本次执行的参数，返回的布尔值通过 TaskResult.isSuccess 读取。
 * @example
 * const focus = runDomAction(input, element => {
 *   element.focus()
 *   return element.matches(':focus')
 * })
 * const focused = await focus().isSuccess
 */
export function runDomAction<Dom extends Element, Args extends unknown[]>(
  dom: DomSource<Dom> | (() => DomSource<Dom>),
  action: (element: Dom, ...args: Args) => boolean,
): Task<void, Args> {
  return task(async ({ canContinue, reportSuccess }, ...args: Args) => {
    const element = await (isFunction(dom) ? dom() : dom)
    await canContinue()
    reportSuccess(element !== undefined && action(element, ...args))
  })
}
