# Top Layer Plugin

## 目标

`topLayer` 让 Piv 的原始 DOM 进入浏览器 Top Layer，并通过 Controller 暴露当前状态与进入、退出操作。

```tsx
<Piv plugin={topLayer}>始终位于 Top Layer</Piv>

const [plugin, controller] = usePlugin(topLayer)
<Piv plugin={plugin}>由 Controller 控制</Piv>
```

`enterTopLayer(element)` 是同一领域的命令式入口，供 Draggable 等 Plugin 的内部实现使用。它只改变元素的 Popover 状态，不改变 DOM 父子关系。

## Controller

- `active`：当前元素是否已经进入 Top Layer。
- `enter()`：进入 Top Layer。
- `leave()`：退出 Top Layer。

## 边界

- 不决定元素为何进入 Top Layer。
- 不拥有定位、尺寸、动画、阴影、背景或其他视觉样式。
- 不创建 Placeholder，不解释原布局是否需要保留。
- 元素已经承担 Popover 时拒绝进入，不覆盖其他能力拥有的 Popover 状态。
