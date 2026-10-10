/**
 * Solid 渲染与 props 接入的内部边界。
 *
 * 保留底层的子树复用、DOM 提交时机和 props 惰性读取；上层不直接引用 Solid。
 *
 * 本入口不通过包根发布，组件与应用挂载实现按需使用。
 */
export { For, Show, children, mapArray, createRenderEffect, splitProps, mergeProps } from 'solid-js'
export { render, insert } from 'solid-js/web'
