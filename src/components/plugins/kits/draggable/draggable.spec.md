# Draggable Plugin

## 目标

`draggable` 使用 Pointer Events 建立页面内拖动。它拥有当前元素是否可拖、是否正在拖动、本次携带的 `payload`，以及原始元素的跟随位移；不依赖 `droppable` 或 `scope` 才能成立。

```tsx
<Piv plugin={draggable({ payload: weather })}>Weather</Piv>

const [plugin, controller] = usePlugin(draggable, { payload: weather })
<Piv plugin={plugin}>Weather</Piv>
```

开始拖动后，`draggable` 使用独立 `topLayer` 领域的命令式入口。Top Layer 建立原布局 Anchor，并维护来源 DOM 提升前的基础位置、border-box 尺寸和提升阴影；`draggable` 只在这个基础位置上使用 individual `translate` 跟随指针。source 的 DOM 父子关系、组件身份、Plugin、Controller 和状态都不迁移。

Top Layer 自动留下原位影子，这个影子同时就是 Anchor。它参与原布局并接替 source 的尺寸、外边距、Flex/Grid 位置和圆角，以唯一 `anchor-name` 暴露布局后的 border box；提升后的 source 使用 `anchor-size()`取得尺寸。影子的 DOM、几何、视觉和生命周期全部由 Top Layer 管理，Drag 不认识其内部结构。

source 位于 Top Layer，Anchor 留在普通页面层；二者不再依靠 `z-index` 跨 stacking context 比较层级。`anchor-size()`只负责尺寸，不使用 `anchor()`持续绑定位置，因此滚动原容器时 Anchor 随布局移动，source 仍留在指针所在的视口坐标。一次会话按照 `start → moving → end / cancel` 推进。

拖动期间 `topLayer` 独占 Anchor、基础几何、Popover 状态和提升阴影，`draggable` 独占 individual `translate`。结束时 Drag 只退出本次 Top Layer 事务并清除位移。原有 `transform`、`rotate` 和 `scale` 不会被覆盖；来源元素已经使用 `popover` 或 `translate` 时拒绝开始拖动，不能覆盖另一项能力的状态。

## Options

- `payload`：当前页面内携带的数据包。
- `disabled`：初始是否禁止拖动。
- `activationDistance`：指针移动多少 CSS px 后开始拖动，默认 6；用于区分点击和拖动。

## Controller

- `enabled`：当前是否允许开始拖动。
- `dragging`：当前元素是否已越过激活距离并进入拖动阶段。
- `enable()`、`disable()`：控制后续是否允许拖动；拖动中 disable 会立即取消。

## Demo

[draggable.demo.tsx](draggable.demo.tsx) 验收原始 source 的跟手位移及 Top Layer 自动留下的原位影子。与接收端的组合及系统文件拖入见 [Droppable Demo](../droppable/droppable.demo.tsx)。

[draggable.stories.tsx](draggable.stories.tsx) 提供同一场景的独立 Storybook 入口。

## 边界

- 不以原生 `draggable`、`dragstart`、`DataTransfer.setDragImage()` 或浏览器 ghost image 发起拖动；`dragstart` 监听只负责取消图片、链接等后代可能触发的原生 ghost drag。
- 不创建或管理原位影子；影子 Anchor 是 Top Layer 提升事务的一部分。
- 不把 source 搬到 `body` 或 Portal；Popover API 只把原 source 的渲染 box 提升到 Top Layer，从而越过祖先 `overflow` 和 stacking context。
- 不读取或维护 source 的基础位置、尺寸与提升阴影；这些由 Top Layer 提升事务负责。
- source 自身已经承担 Popover 时不开始拖动；第一版不让两个能力共享同一个 Popover 状态。
- 不判断放下后的业务结果。
- 不拥有 Scope。
- 不拥有 Top Layer 的影子 Anchor、进入、退出和恢复协议，只决定本次 Drag 何时使用它。
- 不实现排序插入位、before/after indicator 或集合写入；Top Layer Anchor 只表示提升前的原位置。
