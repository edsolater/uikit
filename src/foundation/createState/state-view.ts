/**
 * StateView 领域。
 *
 * 本文件定义可读取、可映射的状态视图，以及 StateView 对外暴露的统一转换能力。
 */
import { isFunction, isObject } from '@edsolater/fnkit'
import { runWithOwner } from 'solid-js'
import {
  isPromiseLike,
  toStateViewFromPromiseLike,
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
  map<U>(toNew: (value: T) => U | StateView<U>): StateView<Awaited<U>>
}

/**
 * 可转换来源与默认 StateView 的身份映射。
 *
 * WeakMap 只按 Promise 身份复用只读视图，不把视图绑定在首次消费的作用域。
 * 来源不再可达后，映射及其 StateView 可以一同被垃圾回收。
 */
const stateViewCache = new WeakMap<PromiseLike<unknown>, StateView<unknown>>()

export type StateViewOptions<V, U> = {
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
 * PromiseLike 转换为 `StateView<Awaited<V>>`，等待和失败由 Solid 传播。
 *
 * 第二个参数统一表示转换 options；直接传入函数是 `{ map: fn }` 的简写。
 */
export function stateView<V>(sourceOrValue: StateView<V>): StateView<V>
export function stateView<R, U>(
  sourceOrValue: PromiseLike<R>,
  options: StateViewOptions<Awaited<R>, U>,
): StateView<Awaited<U>>
export function stateView<R>(sourceOrValue: PromiseLike<R>): StateView<Awaited<R>>
export function stateView<R, U>(
  sourceOrValue: PromiseLike<R>,
  map: (value: Awaited<R>) => U | StateView<U>,
): StateView<Awaited<U>>
export function stateView<V>(sourceOrValue: Source<V>): StateView<Awaited<V>>
export function stateView<V, U>(
  sourceOrValue: Source<V>,
  options: StateViewOptions<Awaited<V>, U>,
): StateView<Awaited<U>>
export function stateView<V, U>(
  sourceOrValue: Source<V>,
  map: (value: Awaited<V>) => U | StateView<U>,
): StateView<Awaited<U>>
export function stateView(sourceOrValue: any, optionsOrMap?: any): StateView<any> {
  const options = isFunction(optionsOrMap) ? { map: optionsOrMap } : optionsOrMap

  let view: StateView
  if (isPromiseLike(sourceOrValue)) {
    const cachedStateView = stateViewCache.get(sourceOrValue)
    if (cachedStateView) {
      view = cachedStateView
    } else {
      // 固定来源属于 Promise 身份，首消费者卸载不应销毁其他消费者共享的结果。
      view = runWithOwner(null, () => toStateViewFromPromiseLike(sourceOrValue))
      stateViewCache.set(sourceOrValue, view)
    }
  } else {
    view = isStateView(sourceOrValue) ? sourceOrValue : createState(sourceOrValue)
  }
  return options?.map ? view.map(options.map) : view
}
