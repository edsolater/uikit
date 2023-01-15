import { MutableRefObject, RefCallback, RefObject } from 'react'

import { isArray, isFunction, isNullish } from '@edsolater/fnkit'

import { createCallbackRef } from './createCallbackRef'

export function loadRef(ref: RefCallback<any> | MutableRefObject<any> | null, el: any) {
  if (isNullish(ref)) return

  if (isFunction(ref)) {
    ref(el)
  } else if (isArray(ref.current)) {
    // 👇 have to do that to pretend the address of variable
    ref.current.forEach((_, idx) => {
      ref.current.splice(idx, 1, el)
    })
  } else {
    ref.current = el
  }
}

export default function mergeRefs<T = any>(...refs: any[]): RefObject<T> {
  return createCallbackRef((el) => {
    refs.filter(Boolean).forEach((ref) => loadRef(ref!, el))
  })
}
