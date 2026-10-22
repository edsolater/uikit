/**
 * UIKit 基础能力入口。
 *
 * 汇总状态、响应式副作用与上下文能力，不负责业务 hook 的组合。
 *
 * 让上层通过 UIKit 自有契约使用底层运行时。
 */
export { isStateView, stateView, stateViewBrand } from './createState/state-view'
export type { StateView, StateViewOptions } from './createState/state-view'
export { isStateViewable } from './createState/source'
export type { StateViewable, Source, MayArraySource } from './createState/source'
export { isState, createState, stateBrand } from './createState/state'
export type { State } from './createState/state'
export { val } from './createState/read'
export type { Val } from './createState/read'
export * from './createEffect'
export { createContext, useContext } from 'solid-js'
export type { Context } from 'solid-js'
export { render, For, mapArray, Show, Loading, Errored, createRenderEffect, children, insert, mergeProps } from './render'
export type { Component, Accessor, JSXElement } from './types'
export type { JSX } from './types'
