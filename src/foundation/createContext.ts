/**
 * UIKit 的组件树上下文能力。
 *
 * 负责建立上下文及读取最近提供者的值，不负责组件业务数据的组织。
 *
 * 让上层通过 UIKit 自有契约传递组件树中的共享数据。
 */
import {
  createContext as solidCreateContext,
  useContext as solidUseContext,
} from 'solid-js'
import type { JSX } from './types'

/**
 * 组件树中的共享数据通道；Provider 为后代提供值，没有提供者时使用 defaultValue。
 */
export interface Context<T> {
  /** 区分不同上下文通道的身份。 */
  id: symbol
  /** 为子树提供当前上下文的值。 */
  Provider: (props: { value: T; children: JSX.Element }) => JSX.Element
  /** 没有可用提供者值时的读取结果。 */
  defaultValue: T
}

/** 上下文的调试信息，不参与上下文取值。 */
export interface ContextOptions {
  name?: string
}

/**
 * 建立组件树共享数据通道；未提供默认值时，提供者以外的读取结果为 undefined。
 * options 中的名称用于开发环境调试，不改变数据的传递方式。
 */
export function createContext<T>(defaultValue?: undefined, options?: ContextOptions): Context<T | undefined>
export function createContext<T>(defaultValue: T, options?: ContextOptions): Context<T>
export function createContext<T>(defaultValue?: T, options?: ContextOptions): Context<T | undefined> {
  return solidCreateContext(defaultValue, options)
}

/**
 * 读取所属组件树中最近提供者的值，没有可用提供者值时返回上下文默认值。
 */
export function useContext<T>(context: Context<T>): T {
  return solidUseContext(context)
}
