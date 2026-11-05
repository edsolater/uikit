# 什么时候使用 Hook，什么时候使用 Plugin

Hook 在组件作用域组织状态或逻辑；Plugin 把交互或结构行为接到一个 Piv 节点。需要多个组件共享计算而不依赖具体节点时使用 Hook；需要当前节点事件、状态、DOM 或附属结构时使用 Plugin。

组件描述自己承载或组织什么内容；Plugin 描述附着在节点上的交互能力。例如 Card 提供独立信息体，`<Card is={clickable()}>信息</Card>` 为这个 Card 增加点击能力。仅需变化布局或表达内容时，优先使用组件；需要给节点安装可复用交互时使用 Plugin。

| 调用 | 得到什么 |
| --- | --- |
| `clickable(options)` | 可直接交给 `is` 的 Plugin |
| `usePlugin(clickable, options)` | Plugin 与该节点的控制入口二元组 |

## 定义和使用单个能力

```tsx
const highlight = defineInactivePlugin({
  name: 'highlight',
  pluginCore({ pluginOptions: options, element, addProps }: PluginContext & { pluginOptions: { color?: string } }) {
    addProps({ style: { color: options.color } })
    return { focus: () => element.focus() }
  },
})

<Piv is={highlight({ color: 'red' })} />
const [plugin, controller] = usePlugin(highlight, { color: 'red' })
<Piv is={plugin} />
controller.focus?.()
```

定义与配置不执行节点算法；Piv 安装 Plugin 时才执行 `pluginCore`，并通过 `addProps` 进入原声明合并链。节点未安装或已卸载时控制成员不可用。一个受控 Plugin 同时只属于一个节点；不同节点分别调用 `usePlugin`。原始 Plugin 可在多个节点执行，每次节点执行各自创建状态。

## 组织多个能力

```ts
const controls = defineInactivePlugins({ draggable: draggablePluginCore, droppable: droppablePluginCore })
const { draggable, droppable } = controls
```

每一项仍是独立配置工厂；没有角色控制器集合或额外的配置层。拖放两端通过相同 `id` 对象分组，双方不提供时也可协作。

## 组合和清理

父 `pluginCore` 可在当前节点调用子 Plugin，使用其返回成员；节点声明由同一合并链处理。通过传入的 `onCleanup` 登记的资源在失败安装与卸载时释放；Foundation 与结构资源沿节点 owner 生命周期清理。需要在元素前后插入内容时，节点算法调用 Piv 现有结构工具，避免自行管理附属 DOM。

具体状态获取和条件节点见[控制入口](外部获取plugin内部状态并使用.md)。Popover 与 Tooltip 的后续领域改造不由这套通用协议自动完成。
