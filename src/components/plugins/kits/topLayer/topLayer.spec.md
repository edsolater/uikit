# Top Layer

## 目标

Top Layer 把原始 DOM 提升到浏览器 Top Layer，同时维持提升前的基础位置和 border-box 尺寸。领域公开纯控制器和 Plugin 两种载体，两者共享同一套提升事务。

```tsx
function Example() {
  const capability = topLayer()
  return (
    <>
      <Piv is={topLayer()}>始终位于 Top Layer</Piv>
      <Piv is={capability} on={{ click: () => capability.controller.leave() }}>
        由 Controller 控制
      </Piv>
    </>
  )
}

// createTopLayerController 是元素级入口，不经过组件激活；element 由调用方提供。
const controller = createTopLayerController(element)
controller.enter()
controller.leave()
```

`createTopLayerController(element)` 是不依赖 Piv 的原子入口，供 Draggable 等能力直接控制一个已经取得的元素。领域模块静态导入 `topLayer.style`，只有调用 `enter()` 才改变目标元素。

`topLayer` 是同一能力的 Piv Plugin 包装。直接安装 `<Piv is={topLayer()}>` 时，元素从挂载到清理始终位于 Top Layer；使用能力结果的 `controller` 时，可以有条件地调用 `enter()` 和 `leave()`。Plugin 在配置时创建状态与 Controller，在元素接入后建立提升事务；节点卸载后方法保留但为 no-op。Plugin 不重新实现提升，只处理元素何时可用以及组件清理。

## 提升事务

进入时，Top Layer 按顺序完成以下工作：

1. 在任何写操作前记录元素的视口位置和需要恢复的 inline 几何声明。
2. 在原父级中插入同父相邻的原位影子，接替原布局槽位。
3. 影子同时就是 Anchor：它以原元素的自然尺寸参与布局，继续接受 Flex/Grid 分配的伸缩空间，并保留外边距、位置、圆角与边框形状；最终 border box 通过唯一 `anchor-name` 暴露。
4. 原元素以 `anchor-size()`取得影子 Anchor 的尺寸，以提升瞬间的视口位置作为基础位置。
5. 原元素绑定 `top-layer` class，通过 Popover API 进入 Top Layer，并获得默认提升阴影。

退出时，Top Layer 退出 Popover、释放 `top-layer` class、恢复原有 inline 几何声明并移除影子 Anchor。影子不复制 children、DOM 身份或组件状态。

## Controller

- `active`：当前元素是否已经进入 Top Layer。
- `enter()`：开始一次完整提升事务。
- `leave()`：结束提升事务并恢复原状态。

纯控制器和 Plugin Controller 遵守同一个 `TopLayerController` 合同。区别只在载体和生命周期，不形成两个 Top Layer 功能区。

## 边界

- 拥有原位影子 Anchor、基础位置、border-box 尺寸、Popover 状态、提升元素阴影和完整恢复。
- 自己绑定 `top-layer` class；样式由同领域 `topLayer.style.ts` 登记，调用方不操作内部 selector。
- `createTopLayerController()` 是原子控制入口，`topLayer` 是它的 Piv 生命周期包装；二者不得分叉实现。
- 不决定元素为何提升，也不解释提升后的业务位移、动画或交互。
- 原位影子自动成为 Anchor；Top Layer 独占它的创建、几何、视觉和删除，调用能力不认识其 DOM 或样式。
- 不把原元素搬到 `body`、Portal 或另一棵组件树。
- 元素已经承担 Popover 时拒绝进入，不覆盖其他能力拥有的 Popover 状态。
