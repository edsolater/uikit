# Clickable Plugin

## 目标

`clickable` 为一个 Piv 提供 hover、focus、pressed 和键盘点击能力。它没有界面，只管理交互协议。

## 调用方式

```tsx
function Example() {
  const capability = clickable({ tabIndex: 0 })
  return (
    <>
      <Piv is={clickable()} />
      <Card is={capability}>信息</Card>
      <Button on={{ click: () => capability.controller.focus() }}>聚焦</Button>
    </>
  )
}
```

配置调用在组件内完成并立即构建状态与 Controller；`plugin` 交给 `is`，`controller` 直接使用。依赖元素的方法在节点未接入或已退出时只保留状态操作，不抛错。

## Controller

- 状态面板：`hovered`、`focused`、`pressed`。
- 操作按钮：`hover()`、`unhover()`、`focus()`、`blur()`、`press()`、`release()`、`click()`。
- click 是瞬时操作，不制造会滞留且含义不清的 `clicked` 状态。
- clickable 内部构建自己的 hoverable 并通过 `is` 提交其声明；不同 clickable 不共享 hover 状态。

## 验证

- 单元测试验证 Controller、options 与实例隔离。
- 浏览器测试验证真实焦点、PointerEvent、键盘触发和直接结果调用方式。
