/**
 * 当前渲染运行时的类型接入边界。
 *
 * 集中 JSX、组件与读取函数类型的来源；当前仍沿用 Solid 的类型契约。
 *
 * 避免上层直接引用运行时类型。
 */
export type { JSX, JSXElement, Accessor, Component } from 'solid-js'
