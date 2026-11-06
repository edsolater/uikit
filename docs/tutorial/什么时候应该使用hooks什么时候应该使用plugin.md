# 什么时候使用 Hook，什么时候使用 Plugin

Hook 在组件作用域组织状态或逻辑；Plugin 把交互或结构行为接到一个 Piv 节点。需要多个组件共享计算而不依赖具体节点时使用 Hook；需要当前节点事件、状态、DOM 或附属结构时使用 Plugin。

组件描述自己承载或组织什么内容；Plugin 描述附着在节点上的交互能力。例如 Card 提供独立信息体，`<Card is={clickable()}>信息</Card>` 为这个 Card 增加点击能力。仅需变化布局或表达内容时，优先使用组件；需要给节点安装可复用交互时使用 Plugin。

| 调用 | 得到什么 |
| --- | --- |
| `clickable(options)` | `{ plugin, controller }`；`plugin` 交给 `is`，`controller` 直接使用 |

## 定义和使用单个能力

```tsx
const highlight = defineInactivePlugin({
  name: 'highlight',
  pluginCore({ pluginOptions: options, addProps, withDom }) {
    let element: HTMLElement | undefined
    addProps({ style: { color: options.color } })
    withDom((el) => {
      element = el
      return () => {
        element = undefined
      }
    })
    return { focus: () => element?.focus() }
  },
})

function Example() {
  const capability = highlight({ color: 'red' })
  return <Piv is={capability} />
}
```

定义可以放模块顶层，但不运行 `pluginCore`。每次在组件内调用 `highlight({ color: 'red' })` 才构建一次：准备状态与完整 Controller，收集 `addProps`／`withDom` 声明，并返回 `{ plugin, controller }`。`is` 解析直接展开这些已准备的声明，不重新运行 `pluginCore`，也不重建 Controller。配置调用因此必须在组件内完成，组件内的 JSX 内联调用合法。

## 组织多个能力

```ts
const dragAndDrop = defineInactivePlugins({
  draggable: draggablePluginCore,
  droppable: droppablePluginCore,
})

function Transfer() {
  const { draggable, droppable } = dragAndDrop({
    draggable: { payload: item },
    droppable: { onDrop: receive },
  })
  return <>
    <Card is={draggable}>拖动材料</Card>
    <Card is={droppable}>接收材料</Card>
  </>
}
```

组合定义可以放模块顶层，组合调用必须在组件内。每次调用在内部创建一份共享身份并交给本组所有角色；该身份不返回给调用者，也不进入公开 Options。各角色仍按单元构建流程准备自己的状态与 Controller。

## 组合和清理

父 `pluginCore` 可以构建子能力并通过 `is` 提交子声明，再通过 `child.controller` 使用其成员；节点声明由同一合并链处理。

节点资源在 `domRef`／`withDom` 回调中接入：回调只接收实际元素，返回 void 或该元素退出时的清理。需要声明就能表达的字段优先使用 `on`、`style` 等既有字段，不把所有属性绑定重写进 domRef。`withDom` 等价于 `addProps({ domRef: callback })`，不创建额外生命周期设施。

具体状态获取和条件节点见[控制入口](外部获取plugin内部状态并使用.md)。Popover 与 Tooltip 的后续领域改造不由这套通用协议自动完成。
