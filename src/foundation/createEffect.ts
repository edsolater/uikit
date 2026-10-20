/**
 * UIKit 的响应式副作用与生命周期入口。
 *
 * 负责建立响应式动作，以及登记挂载和清理回调，不负责状态存储。
 *
 * 让使用方通过 UIKit 统一接入响应式副作用。
 */
import {
  createEffect as solidCreateEffect,
  createRenderEffect as solidCreateRenderEffect,
  onCleanup as solidOnCleanup,
  onSettled as solidOnMount,
  getOwner,
  runWithOwner,
  type EffectOptions,
} from 'solid-js'
import { isArray, isFunction } from '@edsolater/fnkit'
import { val, type Val } from './createState/read'

type EffectAction<T> = (value: T) => void | (() => void)
type EffectValues<Sources extends unknown[]> = { [Index in keyof Sources]: Val<Sources[Index]> }

/**
 * 先读取来源并跟踪依赖，再执行不收集依赖的动作；动作返回的 cleanup 由 Solid 管理。
 * 优先传入单个来源，确需多个来源时传入 tuple，计算函数用于前两者不能自然表达的情况。
 */
export function createEffect<T>(compute: () => T | PromiseLike<T>, action: EffectAction<T>): void
export function createEffect<const Sources extends unknown[]>(sources: Sources, action: EffectAction<EffectValues<Sources>>): void
export function createEffect<Source>(source: Source, action: EffectAction<Val<Source>>): void
export function createEffect(source: unknown, action: EffectAction<any>): void {
  solidCreateEffect(normalizeEffectSource(source), action)
}

/** 使用相同来源契约，默认首次同步提交，并透传原有原生选项。 */
export function createRenderEffect<T>(compute: () => T | PromiseLike<T>, action: EffectAction<T>, options?: EffectOptions): void
export function createRenderEffect<const Sources extends unknown[]>(sources: Sources, action: EffectAction<EffectValues<Sources>>, options?: EffectOptions): void
export function createRenderEffect<Source>(source: Source, action: EffectAction<Val<Source>>, options?: EffectOptions): void
export function createRenderEffect(source: unknown, action: EffectAction<any>, options?: EffectOptions): void {
  solidCreateRenderEffect(normalizeEffectSource(source), action, options)
}

function normalizeEffectSource(source: unknown): () => unknown {
  return isFunction(source)
    ? source
    : isArray(source)
      ? () => source.map(item => val(item))
      : () => val(source)
}

/**
 * 登记当前作用域的清理动作，在作用域释放或所属响应式计算重新执行前调用。
 * 必须在需要清理的动作所属作用域中登记。
 */
export function onCleanup(action: () => void): void {
  solidOnCleanup(action)
}

/**
 * 在组件完成初次渲染后执行一次动作，动作中的读取不建立响应式依赖。
 * 必须在组件所属作用域中登记。
 */
export function onMount(action: () => void): void {
  const owner = getOwner()
  solidOnMount(() => runWithOwner(owner, action))
}
