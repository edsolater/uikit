import { isString, shrinkToValue } from '@edsolater/fnkit'
import { MayFunction } from '../../typings/tools'
import { EventListenerController, onEvent } from './addEventListener'

const localStorageCache: Map<string, any> = new Map()
const sessionStorageCache: Map<string, any> = new Map()

type StorageItemInfo = {
  key: string
  stringValue: string
  value: any
}

type SetStorageItemEvent = Event & StorageItemInfo
export function getLocalItem<T = any>(key: string): T | undefined {
  if (localStorageCache.has(key)) return localStorageCache.get(key)
  const value = globalThis.localStorage?.getItem(key)
  const parsedValue = isString(value) ? JSON.parse(value) : value ?? undefined
  localStorageCache.set(key, parsedValue)

  return parsedValue
}

/**
 * auto JSON.stringify
 */
export function setLocalItem<T = any>(key: string, value: MayFunction<T, [oldValue: T | undefined]>): void {
  const oldValue = getLocalItem(key)
  const targetValue = shrinkToValue(value, [oldValue])
  const stringifiedValue = JSON.stringify(targetValue)
  window.localStorage?.setItem(key, stringifiedValue)

  // customized setStorageItem event
  const event = Object.assign(new Event('setLocalStorageItem') as any, {
    key,
    stringValue: stringifiedValue,
    value: targetValue
  }) as SetStorageItemEvent
  window.document.dispatchEvent(event)

  localStorageCache.set(key, targetValue)
}

export function onLocalItemChanged(cb: (info: StorageItemInfo & { ev: Event }) => void): EventListenerController {
  return onEvent(document, 'setLocalStorageItem' as any, ({ ev }) => {
    const { key, value, stringValue } = ev as SetStorageItemEvent
    cb({ key, value, stringValue, ev })
  })
}

/**
 * safely use browser's API: localStorage. but it is auto json like jFetch and have cache also
 * auto JSON.parsed
 */
export function getSessionItem<T = any>(key: string): T | undefined {
  if (sessionStorageCache.has(key)) return sessionStorageCache.get(key)
  const value = globalThis.sessionStorage?.getItem(key)
  const parsedValue = isString(value) ? JSON.parse(value) : value ?? undefined

  sessionStorageCache.set(key, parsedValue)
  return parsedValue
}

/**
 * auto JSON.stringify
 */
export function setSessionItem<T = any>(key: string, value: MayFunction<T, [oldValue: T | undefined]>): void {
  const oldValue = getLocalItem(key)
  const targetValue = shrinkToValue(value, [oldValue])
  const jsonedValue = JSON.stringify(targetValue)
  globalThis.sessionStorage?.setItem(key, jsonedValue)

  // customized setStorageItem event
  const event = Object.assign(new Event('setSessionStorageItem') as any, {
    key,
    value: targetValue,
    json: () => jsonedValue
  }) as SetStorageItemEvent
  window.document.dispatchEvent(event)

  sessionStorageCache.set(key, targetValue)
}

export function onSessionItemChanged(cb: (info: StorageItemInfo & { ev: Event }) => void): EventListenerController {
  return onEvent(document, 'setSessionStorageItem' as any, ({ ev }) => {
    const { key, value, stringValue } = ev as SetStorageItemEvent
    cb({ key, value, stringValue, ev })
  })
}
