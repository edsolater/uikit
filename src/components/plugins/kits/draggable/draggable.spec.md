# Draggable Plugin

## 目标

`draggable` 使用 Pointer Events 建立页面内拖动。它拥有当前元素是否可拖、是否正在拖动、本次携带的 `payload`，以及跟随指针的 transform 预览；不依赖 `droppable` 或 `scope` 才能成立。

```tsx
<Piv plugin={draggable({ payload: weather })}>Weather</Piv>

const [plugin, controller] = usePlugin(draggable, { payload: weather })
<Piv plugin={plugin}>Weather</Piv>
```

开始拖动后，来源 DOM 继续占据原布局位置但隐藏自身视觉；UIKit 在 `document.body` 创建同尺寸副本，以 `translate3d()` 跟随指针并显示阴影。结束或取消后副本立即移除。

## Options

- `payload`：当前页面内携带的数据包。
- `disabled`：初始是否禁止拖动。
- `activationDistance`：指针移动多少 CSS px 后开始拖动，默认 6；用于区分点击和拖动。

## Controller

- `enabled`：当前是否允许开始拖动。
- `dragging`：当前元素是否已越过激活距离并进入拖动阶段。
- `enable()`、`disable()`：控制后续是否允许拖动；拖动中 disable 会立即取消。

## Demo

[draggable.demo.tsx](draggable.demo.tsx) 验收独立 draggable 的 transform 预览。与接收端的组合及系统文件拖入见 [Droppable Demo](../droppable/droppable.demo.tsx)。

[draggable.stories.tsx](draggable.stories.tsx) 提供同一场景的独立 Storybook 入口。

## 边界

- 不以原生 `draggable`、`dragstart`、`DataTransfer.setDragImage()` 或浏览器 ghost image 发起拖动；`dragstart` 监听只负责取消图片、链接等后代可能触发的原生 ghost drag。
- 不判断放下后的业务结果。
- 不拥有 Scope。
- 不实现排序、占位符或集合写入。
