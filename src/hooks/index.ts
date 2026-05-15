/**
 * hooks 对外出口。
 * 这里只汇总稳定 hook；实验性 hook 不应先进入发布入口。
 */
export * from './useTitle' // UI 级别 直接操作 document.title 的 hook

export * from './value-state/collection' // 管理数据集合的 hook，配合 observer 模式使用
export * from './value-state/count' // 计数器 hook
export * from './value-state/ident' // 标识符 hook，生成唯一 ID 等
export * from './value-state/matcher' // 匹配器 hook，管理匹配关系等
export * from './value-state/toggle' // 布尔切换 hook
export * from './base-state' // 基础状态管理 hook，提供更通用的状态管理功能
export * from './domRef' // DOM 引用 hook，方便获取和操作 DOM 元素
