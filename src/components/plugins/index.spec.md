# Plugins

Plugin 为 Piv 节点声明交互或结构能力。`tools` 提供定义入口：`createInactivePlugin` 定义单个节点算法，`createInactivePlugins` 按名称组合多个算法。定义可以放模块顶层；每次在组件内调用 `inactivePlugin(pluginOptions)` 会运行一次 core，返回 `{ plugin, controller }`，其中 `plugin` 交给 `is`；组合调用返回 `{ plugins, controller }`，`plugins` 是角色结果集合，`plugins.role` 交给节点，`controller.role` 引用对应角色的完整 Controller，集合本身不交给 `is`。拖放相关能力及示例归 `kits/dragAndDrop`。

```tsx
function Example() {
  const capability = clickable({ onClick: save })
  return (
    <>
      <Piv is={hoverable()} />
      <Piv is={hoverable({ initialHovered: true })} />
      <Card is={capability}>信息</Card>
      <Button on={{ click: () => capability.controller.focus() }}>聚焦卡片</Button>
    </>
  )
}
```

能力结果返回时 Controller 已完整，节点接入与退出不使方法消失；依赖 DOM 的方法按各能力约定处理未接入状态。同一结果可以交给多个节点，各自按既有契约自然产生结果。Plugin 是带标识的 ShadowProps 容器，Piv 在创建前直接展开其中声明；节点可通过 `domProxy` 获取，也可使用 `domRef` 在元素接入时登记清理。

当前能力包括 clickable、hoverable、topLayer、draggable、droppable、createPopoverPlugins、tooltip 和 tabularNum。`dragAndDrop` 返回可调用组合，每次调用在内部创建共享身份，同次组合的拖动与接收角色协作；公开配置不再要求 `id`。页面内拖放使用 Pointer Events，浏览器外部材料由 droppable 接收。

`createPopoverPlugins(...)` 返回 `{ plugins, controller }`；`plugins` 的 trigger／body 是原始能力结果，分别交给实际 Button／Card 等节点，`controller` 提供两端完整 Controller 与常用显隐操作的直接引用。Popover 只声明显隐、关联、原生状态／事件和功能定位，不生成业务内容、布局或绘制，也不增加组件 Marker。旧 tooltip 尚未迁移，仍沿 Piv 结构工具挂载现有 PopoverSurface，使用旧显隐工具与材料；异步接入的时序缺口见 [Task 异步操作 TODO](../../../docs/todo/261107_Task与TaskResult异步操作.md)。
