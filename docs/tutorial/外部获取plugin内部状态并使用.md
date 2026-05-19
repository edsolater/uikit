# Plugin 如果外部获取内部状态并使用

## 结论

- 外部需要读取 plugin 内部状态时，优先让 plugin 工厂直接返回状态和 plugin。
- 不通过 Piv 注入 `innerController` 再从 Piv 回流状态。
- Piv 只接收最终要注入的 plugin，不承担插件状态管道。
- plugin 状态的创建、持有和暴露归属于 plugin 工厂。
- Piv 负责运行 plugin，调用方负责消费工厂返回的状态。

## 推荐形状

```tsx
const [miniMapState, miniMapPlugin] = createMiniMapPlugin()

return <Piv plugins={miniMapPlugin}>...</Piv>
```

- `miniMapState` 用于让外部读取或监听插件内部状态。
- `miniMapPlugin` 用于注入 Piv，让插件参与 Piv 的 DOM 能力流程。
- 两者来自同一次工厂调用，因此天然属于同一个插件实例。
- 外部不需要知道 Piv 内部如何运行 plugin。
- Piv 不需要新增一个通用 controller 注入协议。

## 为什么不走 Piv 回流

- plugin 本身已经是能力注入入口。
- 如果先把状态注入 Piv，再让外部从 Piv 取回状态，会形成绕路。
- 这种绕路会让 Piv 同时承担 DOM 原子、plugin 运行器和状态总线三种职责。
- 一旦 Piv 承担状态总线，后续就容易发展成通用 `innerController` 协议。
- 通用 controller 协议会让 class、style、children、event 和 plugin 都被同一套隐式能力影响，整体会变重。
  
## 插件工厂的职责

- 插件工厂负责创建插件实例级状态。
- 插件工厂负责创建能读写这份状态的 plugin。
- 插件工厂负责决定哪些状态允许外部读取。
- 插件工厂不应把所有内部细节都暴露给外部。
- 插件工厂返回的状态应服务外部监控、联动或调试，不应让外部接管插件内部流程。

## Hook 工厂形状

当插件需要先配置再创建实例时，可以再包一层 hook 工厂。

```tsx
const createMiniMapPluginHook = createPluginHookCreator((options: MiniMapPluginOptions) => {
  return () => {
    const miniMapState = createMiniMapState(options)
    const miniMapPlugin = createPivPlugin(({ element }) => {
      miniMapState.setRootElement(element)
    })

    return [miniMapState, miniMapPlugin] as const
  }
})

const useMiniMapPlugin = createMiniMapPluginHook({
  placement: 'right-bottom',
})

function Editor() {
  const [miniMapState, miniMapPlugin] = useMiniMapPlugin()

  return <Piv plugins={miniMapPlugin}>...</Piv>
}
```

- `createPluginHookCreator()` 只固定工厂形状，不创建状态，不运行 plugin。
- `createMiniMapPluginHook()` 返回一个插件实例创建函数。
- `useMiniMapPlugin()` 在组件运行期创建状态和 plugin。
- 最终仍然返回 `[state, plugin]`。
- 配置属于工厂层，实例状态属于 hook 返回值。
- 这种形状适合需要复用同一套插件配置，但每个组件实例都有独立状态的场景。

## 命名建议

- 直接创建插件实例时，使用 `createXPlugin()`。
- 先创建可复用的插件 hook 时，使用 `createXPluginHook()`。
- 返回的状态命名为 `xState`。
- 返回的 plugin 命名为 `xPlugin`。
- 不使用 `controller` 命名承载普通插件状态，除非它确实提供主动控制方法。

## 边界

- plugin context 仍然只表达 Piv 当前运行时能力，例如当前 DOM 和结构插线工具。
- plugin 工厂返回的 state 表达插件实例状态。
- Piv props 不新增 `innerController`。
- 外部组件不通过 Piv 查询插件状态。
- 业务组件如果需要开放能力，应优先设计受限的业务 prop，而不是透传 Piv plugin 状态。

## 不推荐写法

```tsx
const miniMapState = createMiniMapState()

return (
  <Piv
    plugins={createMiniMapPlugin()}
    innerController={miniMapState}
  >
    ...
  </Piv>
)
```

- 这会让 Piv 变成状态中转层。
- 这会让 plugin 状态和 Piv controller 协议纠缠。
- 这会让调用方误以为所有插件状态都应该通过 Piv 暴露。
