# Top Layer Plugin

## 目标

`topLayer` 把 Piv 的原始 DOM 提升到浏览器 Top Layer，同时维持提升前的基础位置和 border-box 尺寸，并通过 Controller 暴露当前状态与进入、退出操作。

```tsx
<Piv plugin={topLayer}>始终位于 Top Layer</Piv>

const [plugin, controller] = usePlugin(topLayer)
<Piv plugin={plugin}>由 Controller 控制</Piv>
```

`enterTopLayer(element)` 是同一领域的命令式入口，供 Draggable 等能力使用。Plugin 与命令式入口执行同一套提升事务，不改变元素的 DOM 父子关系、组件身份或状态。

## 提升事务

进入时，Top Layer 按顺序完成以下工作：

1. 在任何写操作前记录元素的视口位置和需要恢复的 inline 几何声明。
2. 在原父级中插入同父相邻的空几何 Anchor，接替原布局槽位。
3. Anchor 保留布局得到的尺寸、外边距、Flex/Grid 位置和圆角，并通过唯一 `anchor-name` 暴露 border box。
4. 原元素以 `anchor-size()`取得 Anchor 尺寸，以提升瞬间的视口位置作为基础位置。
5. 原元素通过 Popover API 进入 Top Layer，并获得默认提升阴影。

退出时，Top Layer 退出 Popover、恢复原有 inline 几何声明并移除 Anchor。Anchor 不复制 children、DOM 身份或组件状态。

## Controller

- `active`：当前元素是否已经进入 Top Layer。
- `enter()`：开始一次完整提升事务。
- `leave()`：结束提升事务并恢复原状态。

## 边界

- 拥有 Anchor、基础位置、border-box 尺寸、Popover 状态、默认提升阴影和完整恢复。
- 不决定元素为何提升，也不解释提升后的业务位移、动画或交互。
- Anchor 只维护原布局结果；是否把它显示成拖动原位轮廓，由 Draggable 等调用能力决定。
- 不把原元素搬到 `body`、Portal 或另一棵组件树。
- 元素已经承担 Popover 时拒绝进入，不覆盖其他能力拥有的 Popover 状态。
