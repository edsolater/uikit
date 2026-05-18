import { createMemo } from "solid-js"
import { isString, isArray } from "@edsolater/fnkit"
import { type MayState, $, derive } from "../hooks"

export type MayStatus<S extends string> = MayState<S | S[] | Record<S, MayState<boolean>>>

export function useStatusMatcher<S extends string>(
  propsStatus: MayStatus<S> | undefined,
): { has: (status: S) => MayState<boolean> } {
  const statusRecord = createMemo<Record<S, MayState<boolean>>>(() => {
    const innerStatus = $(propsStatus)
    if (!innerStatus) {
      return {} as Record<S, MayState<boolean>>
    }
    if (isString(innerStatus)) {
      return { [innerStatus]: true } as Record<S, true>
    } else if (isArray(innerStatus)) {
      return innerStatus.reduce((acc, status) => ({ ...acc, [status]: true }), {} as Record<S, MayState<boolean>>)
    } else {
      return innerStatus
    }
  })
  return {
    has(status: S) {
      return derive($(statusRecord)[status], (v) => v === true)
    },
  }
}
