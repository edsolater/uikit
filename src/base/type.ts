/**
 * 这个文件包含了项目中使用的基础类型定义
 */

import type { Accessor } from 'solid-js'

export type Accessable<T> = T | Accessor<T>
