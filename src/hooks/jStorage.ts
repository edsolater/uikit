import { isString, shrinkToValue } from '@edsolater/fnkit'
import { addEventListener, EventListenerController } from '../functions/dom/addEventListener'
import { MayFunction } from '../typings/tools'

const localStorageCache: Map<string, any> = new Map()
const sessionStorageCache: Map<string, any> = new Map()

type SetStorageItemEvent = Event & {
  key: string
  value: string
  json(): any
}

/**
 * safely use browser's API: localStorage. but it is auto json like jFetch and have cache also
 * auto JSON.parsed
 * @todo it can use both localStorage and indexedDB with same API
 */
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
    value: stringifiedValue,
    json: () => targetValue
  }) as SetStorageItemEvent
  window.document.dispatchEvent(event)

  localStorageCache.set(key, targetValue)
}

export function onLocalItemChanged(cb: (event: SetStorageItemEvent) => void): EventListenerController {
  return addEventListener(document, 'setLocalStorageItem', ({ ev }) => {
    cb(ev as SetStorageItemEvent)
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

export function onSessionItemChanged(cb: (event: SetStorageItemEvent) => void): EventListenerController {
  return addEventListener(document, 'setSessionStorageItem', ({ ev }) => {
    cb(ev as SetStorageItemEvent)
  })
}
