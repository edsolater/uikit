# Hoverable Plugin

## 目标

`hoverable` 为一个 Piv 提供独立的 hover 状态。它没有界面，只负责连接 pointer 事件、状态面板和控制方法。

## 调用方式

```tsx
function Example() {
  const capability = hoverable()
  return (
    <>
      <Piv is={hoverable({ initialHovered: true })} />
      <Piv is={capability}>受控 hover</Piv>
      <Button on={{ click: () => capability.controller.hover() }}>进入 hover</Button>
    </>
  )
}
```

配置调用在组件内完成并立即构建状态与 Controller；`plugin` 交给 `is`，`controller` 直接使用。需要读取状态或执行操作时使用 `controller`。

## Controller

- `hovered` 是只读 State，表示当前 hover 状态。
- `hover()`、`unhover()`、`toggleHover()`、`resetHover()` 是操作按钮。
- 每次构建创建独立状态；节点接入与退出不使成员消失。

## 验证

- 单元测试验证 Controller 和实例隔离。
- 浏览器测试验证真实 PointerEvent、DOM attribute 与直接与结果调用方式。
