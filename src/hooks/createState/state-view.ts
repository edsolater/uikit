/**
 * StateView 领域。
 *
 * 本文件定义可读取、可映射的状态视图，以及 StateView 对外暴露的统一转换能力。
 */
import { isFunction, isObject } from '@edsolater/fnkit'
import {
  isPromiseLike,
  toStateViewFromPromiseLike,
  type PromiseLikeStateViewOptions,
} from './promise-like'
import type { Source } from './source'
import { createState } from './state'

export const stateViewBrand = Symbol('StateView')

export interface StateView<T = any> {
  /**
   * 唯一的读取自身当前值的入口
   * 写业务时，不直接使用这个方法，因为会产生主语错误，尽量使用 val() 读取。
   */
  read(): T

  /** 确定对象是 StateView，供 isStateView() 使用。 */
  [stateViewBrand]: true

  /** 创建一个新的派生 StateView。 */
  map<U>(toNew: (value: T) => U | StateView<U>): StateView<U>
}

/**
 * 可转换来源与默认 StateView 的身份映射。
 *
 * WeakMap 不会保活来源；只要调用方仍能再次传入同一个来源，val() 与 toStateView() 就会复用同一个 StateView。
 * 来源不再可达后，映射及其 StateView 可以一同被垃圾回收。
 */
const stateViewCache = new WeakMap<PromiseLike<unknown>, StateView<unknown>>()

export type ToStateViewOptions<V, U> = {
  /** 转换完成后继续映射 StateView 的当前值。 */
  map: (value: V) => U | StateView<U>
}

/**
 * 判断未知值是否为 StateView。
 */
export function isStateView(value: unknown): value is StateView {
  return isObject(value) && (value as any)[stateViewBrand] === true
}

/**
 * 将可转换的数据格式统一转换成 StateView。
 *
 * 当前支持普通值、StateView 与 PromiseLike；以后新增可转换的数据格式时，
 * 也应在这里识别并分派到对应领域的转换函数。
 *
 * PromiseLike 未提供配置时转换为 `StateView<V | undefined>`。
 * 提供配置后，pending 使用 defaultValue；rejected 可通过 errorValue 与 onRejected 定义状态值和事件。
 *
 * 第二个参数统一表示转换 options；直接传入函数是 `{ map: fn }` 的简写。
 */
export function toStateView<V>(sourceOrValue: StateView<V>): StateView<V>
export function toStateView<R, D, E, U>(
  sourceOrValue: PromiseLike<R>,
  options: PromiseLikeStateViewOptions<D, E>
    & { errorValue: E }
    & ToStateViewOptions<Awaited<R> | D | E, U>,
): StateView<U>
export function toStateView<R, D, U>(
  sourceOrValue: PromiseLike<R>,
  options: PromiseLikeStateViewOptions<D>
    & ToStateViewOptions<Awaited<R> | D, U>,
): StateView<U>
export function toStateView<R, U>(
  sourceOrValue: PromiseLike<R>,
  options: ToStateViewOptions<Awaited<R> | undefined, U>,
): StateView<U>
export function toStateView<R, D, E>(
  sourceOrValue: PromiseLike<R>,
  options: PromiseLikeStateViewOptions<D, E> & { errorValue: E },
): StateView<Awaited<R> | D | E>
export function toStateView<R, D>(
  sourceOrValue: PromiseLike<R>,
  options: PromiseLikeStateViewOptions<D>,
): StateView<Awaited<R> | D>
export function toStateView<R>(sourceOrValue: PromiseLike<R>): StateView<Awaited<R> | undefined>
export function toStateView<R, U>(
  sourceOrValue: PromiseLike<R>,
  map: (value: Awaited<R> | undefined) => U | StateView<U>,
): StateView<U>
export function toStateView<V>(sourceOrValue: Source<V>): StateView<V>
export function toStateView<V, U>(
  sourceOrValue: Source<V>,
  options: ToStateViewOptions<V, U>,
): StateView<U>
export function toStateView<V, U>(
  sourceOrValue: Source<V>,
  map: (value: V) => U | StateView<U>,
): StateView<U>
export function toStateView(sourceOrValue: any, optionsOrMap?: any): StateView<any> {
  const options = isFunction(optionsOrMap) ? { map: optionsOrMap } : optionsOrMap

  if (isPromiseLike(sourceOrValue)) {
    let stateView: StateView
    if (!options || !('defaultValue' in options)) {
      const cachedStateView = stateViewCache.get(sourceOrValue)
      if (cachedStateView) {
        stateView = cachedStateView
      } else {
        stateView = toStateViewFromPromiseLike(sourceOrValue)
        stateViewCache.set(sourceOrValue, stateView)
      }
    } else if (!('errorValue' in options) && !options.onRejected) {
      stateView = toStateViewFromPromiseLike(sourceOrValue).map(
        (value) => value === undefined ? options.defaultValue : value,
      )
    } else {
      stateView = toStateViewFromPromiseLike(sourceOrValue, options)
    }

    return options?.map ? stateView.map(options.map) : stateView
  }

  const stateView = isStateView(sourceOrValue) ? sourceOrValue : createState(sourceOrValue)
  return options?.map ? stateView.map(options.map) : stateView
}
