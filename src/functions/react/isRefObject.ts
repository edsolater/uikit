import { isObject } from '@edsolater/fnkit'
import { RefObject } from 'react'

export function isRefObject(obj: any): obj is RefObject<any> {
  return isObject(obj) && Object.keys(obj).length === 1 && 'current' in obj
}

export function isRefObjectFulfilled(obj: any): obj is RefObject<any> {
  return isRefObject(obj) && obj.current !== null
}

export function isRefObjectEmpty(obj: any): obj is RefObject<any> {
  return isRefObject(obj) && obj.current == null
}

export type MayRef<T> = T | RefObject<T>

export function shrinkMayRef<T>(v: MayRef<T>): T {
  return isRefObject(v) ? (v.current as T) : (v as T)
}
