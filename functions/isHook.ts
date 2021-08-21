import { StatePairArray } from 'uikit/types/react'
import { isFunction } from '@edsolater/fnkit/src/judgers'

// TODO: too rude
export default function isHook(value: any): value is () => StatePairArray {
  return isFunction(value)
}
