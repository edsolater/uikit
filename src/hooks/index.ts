/**
 * hooks 对外出口。
 * 这里只汇总稳定 hook；实验性 hook 不应先进入发布入口。
 * 目录入口见 ./README.md。
 * 命名规则见 ./naming.md。
 * 写法约定见 ./writing.md。
 */
export * from './useDocumentTitle' // Document 领域的浏览器标题同步 hook
export * from './value-state/collection' // ValueState 领域的数据集合管理 hook
export * from './value-state/count' // ValueState 领域的计数状态 hook
export * from './value-state/ident' // ValueState 领域的标识符状态 hook
export * from './value-state/matcher' // ValueState 领域的匹配状态 hook
export * from './value-state/toggle' // ValueState 领域的布尔切换状态 hook
export * from './createElementAttributeMarker' // Element 领域的 attribute marker primitive
export * from './createState' // 无领域，全领域通用的基础状态管理 hook
export * from './domRef' // DOM 领域的元素引用 hook
export * from './useBrowserAnimationFrame' // Browser 领域的 animation frame 调度 primitive
export * from './useDOMRegisterer' // DOM 领域的全局节点注册 / 卸载 primitive
export * from './useUIThemeMode' // UI 领域的全局 light / dark / system 主题模式 hook
export * from './createStateWithPrev' // 给state增加一个prev属性， 用于获取之前的值。
