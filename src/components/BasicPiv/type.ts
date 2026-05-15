/**
 * 这个文件只放 base 层共享的基础类型工具。
 * 它不负责 Piv 运行逻辑、DOM 写入语义或组件 props 设计。
 * 如果某个类型只服务单一 helper，应优先就近放在对应 helper 文件里。
 */

import type { MayArray } from '@edsolater/fnkit'
import type { Accessor } from 'solid-js'

export type Accessable<T> = T | Accessor<T>/**

 * T 是 content 的意思
 * 可订阅、可重叠。
 */
export type AccessablePropValueWrapper<T> = MayArray<Accessable<T | undefined>>
export type PropValueWrapper<T> = MayArray<T | undefined>

