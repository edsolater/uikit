/**
 * 这个文件包含了项目中使用的基础类型定义
 */

import type { MayArray } from '@edsolater/fnkit'
import type { Accessor } from 'solid-js'

export type Accessable<T> = T | Accessor<T>/**

 * T 是 content 的意思
 * 可订阅、可重叠。
 */
export type AccessablePropValueWrapper<T> = MayArray<Accessable<T | undefined>>
export type PropValueWrapper<T> = MayArray<T | undefined>

