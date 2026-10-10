/**
 * UIKit 的响应式副作用与生命周期入口。
 *
 * 负责建立响应式动作，以及登记挂载和清理回调，不负责状态存储。
 *
 * 让使用方通过 UIKit 统一接入响应式副作用。
 */
import {
  createEffect as solidCreateEffect,
  onCleanup as solidOnCleanup,
  onMount as solidOnMount,
} from 'solid-js'

/**
 * 建立响应式副作用，动作中同步读取的响应式值成为依赖，依赖变化后重新执行动作。
 * 沿用当前运行时的执行调度与所属作用域的释放行为，不提供独立释放句柄。
 */
export function createEffect(action: () => void): void {
  solidCreateEffect(action)
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
  solidOnMount(action)
}
