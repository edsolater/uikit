# Draggable Plugin

## 目标

`draggable` 使用 Pointer Events 建立页面内拖动。它拥有当前元素是否可拖、是否正在拖动、本次携带的 `payload`，以及原始元素的跟随位移；不依赖 `droppable` 或 `scope` 才能成立。

```tsx
<Piv plugin={draggable({ payload: weather })}>Weather</Piv>

const [plugin, controller] = usePlugin(draggable, { payload: weather })
<Piv plugin={plugin}>Weather</Piv>
```

开始拖动后，来源 DOM 本身通过 `popover="manual"` 进入浏览器 Top Layer，再使用 individual `translate` 跟随指针。Top Layer 只改变 source 生成的 box 在哪里绘制；source 的 DOM 父子关系、组件身份、Plugin、Controller 和状态都不迁移。

source 进入 Top Layer 后不再占据普通布局槽位，因此 UIKit 在原父级中插入一个同父相邻的 Placeholder。Placeholder 参与原布局并接替 source 的尺寸、外边距、Flex/Grid 位置和圆角，只表达原位置，不复制 children、DOM 身份或状态。Placeholder 以会话内唯一的 `anchor-name` 暴露布局后的 border box，Top Layer source 使用 `anchor-size()`取得尺寸，不在 JavaScript 中复制 `width` 或 `height`。source 的初始视口位置在任何写操作之前冻结，避免升层瞬间重新执行 shrink-to-fit。

source 位于 Top Layer，Placeholder 留在普通页面层；二者不再依靠 `z-index` 跨 stacking context 比较层级。`anchor-size()`只负责尺寸，不使用 `anchor()`持续绑定位置，因此滚动原容器时 Placeholder 随布局移动，source 仍留在指针所在的视口坐标。一次会话按照 `start → moving → end / cancel` 推进。

拖动期间 `draggable` 独占来源元素的 Popover 状态和 individual `translate`，结束时先退出 Top Layer，再恢复被临时接管的呈现属性并移除 Placeholder。原有 `transform`、`rotate` 和 `scale` 不会被覆盖；来源元素已经使用 `popover` 或 `translate` 时拒绝开始拖动，不能覆盖另一项能力的状态。

## Options

- `payload`：当前页面内携带的数据包。
- `disabled`：初始是否禁止拖动。
- `activationDistance`：指针移动多少 CSS px 后开始拖动，默认 6；用于区分点击和拖动。

## Controller

- `enabled`：当前是否允许开始拖动。
- `dragging`：当前元素是否已越过激活距离并进入拖动阶段。
- `enable()`、`disable()`：控制后续是否允许拖动；拖动中 disable 会立即取消。

## Demo

[draggable.demo.tsx](draggable.demo.tsx) 验收原始 source 与空几何 Placeholder。与接收端的组合及系统文件拖入见 [Droppable Demo](../droppable/droppable.demo.tsx)。

[draggable.stories.tsx](draggable.stories.tsx) 提供同一场景的独立 Storybook 入口。

## 边界

- 不以原生 `draggable`、`dragstart`、`DataTransfer.setDragImage()` 或浏览器 ghost image 发起拖动；`dragstart` 监听只负责取消图片、链接等后代可能触发的原生 ghost drag。
- 不复制来源组件；Placeholder 只表达原位置，不携带内容和状态。
- 不把 source 搬到 `body` 或 Portal；Popover API 只把原 source 的渲染 box 提升到 Top Layer，从而越过祖先 `overflow` 和 stacking context。
- 不在 source 升层后重新读取 Grid/Flex 尺寸；Placeholder 是原布局结果的 anchor，source 只通过 `anchor-size()`读取它。
- source 自身已经承担 Popover 时不开始拖动；第一版不让两个能力共享同一个 Popover 状态。
- 不判断放下后的业务结果。
- 不拥有 Scope。
- 不实现排序插入位、before/after indicator 或集合写入；这些不属于原位置的 `dragPlaceholder`。
