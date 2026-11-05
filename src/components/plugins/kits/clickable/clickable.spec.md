# Clickable Plugin

## 目标

`clickable` 为一个 Piv 提供 hover、focus、pressed 和键盘点击能力。它没有界面，只管理交互协议。

## 调用方式

```tsx
<Piv is={clickable()} />
<Piv is={clickable({ tabIndex: 0 })} />

const [plugin, controller] = usePlugin(clickable)
<Piv is={plugin} />
```

调用工厂后得到 Plugin；`usePlugin()` 返回 Plugin 与该节点的可选 Controller，节点安装后成员才可使用。

## Controller

- 状态面板：`hovered`、`focused`、`pressed`。
- 操作按钮：`hover()`、`unhover()`、`focus()`、`blur()`、`press()`、`release()`、`click()`。
- click 是瞬时操作，不制造会滞留且含义不清的 `clicked` 状态。
- clickable 内部实例化自己的 hoverable；不同 clickable 不共享 hover 状态。

## 验证

- 单元测试验证 Controller、options 与实例隔离。
- 浏览器测试验证真实焦点、PointerEvent、键盘触发和直接与受控调用方式。
