import { isArray, isString } from '@edsolater/fnkit'
import type { ClassNameList } from '../components/BasicPiv/className'
import { type MayState, $, createState, derive } from '../hooks'

/* 它可以是一个巨长的字符串，然后我们会自动以空格分割 */
export type StatusProps<S extends string> = MayState<S | S[] | Record<S, MayState<boolean>>>

export type StatusController<S extends string> = {
  set(status: S, value: MayState<boolean>): void
  has(status: S): MayState<boolean>
  class: ClassNameList
}
function splitStatusTokens(statusLongString: string): string[] {
  return statusLongString.split(/\s+/).filter(Boolean)
}

/**
 * Status管理器只有在重型组件或者需要状态管理的组件上才会使用。
 */
export function useStatus<S extends string>(propsStatus?: StatusProps<S> | undefined): StatusController<S>
export function useStatus<S extends string>(propsStatus?: StatusProps<any> | undefined): StatusController<S>
export function useStatus<S extends string>(propsStatus?: StatusProps<any> | undefined): StatusController<S> {
  const inputStatusRecord = derive(propsStatus, (innerStatus) => {
    if (!innerStatus) {
      return {}
    }
    if (isString(innerStatus)) {
      const statusTokens = splitStatusTokens(innerStatus)
      return statusTokens.reduce((acc, status) => ({ ...acc, [status]: true }), {} as Record<S, MayState<boolean>>)
    }
    if (isArray(innerStatus)) {
      return innerStatus.reduce((acc, status) => ({ ...acc, [status]: true }), {} as Record<S, MayState<boolean>>)
    }
    return innerStatus
  }) satisfies MayState<Record<S, MayState<boolean>>>

  const [statusRecord, setStatusRecord] = createState(inputStatusRecord, { mode: 'store' })

  const statusController = {
    set(status: S, value: MayState<boolean>) {
      setStatusRecord(status, value)
    },
    has(status: S) {
      return derive($(statusRecord)[status], (v) => v === true)
    },
    class: derive(
      statusRecord,
      (record) =>
        Object.keys(record)
          .filter((key) => $(statusRecord[key as S]) === true)
          .map((v) => `status:${v}`) as S[],
    ),
  }

  return statusController
}
