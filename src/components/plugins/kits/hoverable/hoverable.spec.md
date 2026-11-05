# Hoverable Plugin

## 目标

`hoverable` 为一个 Piv 提供独立的 hover 状态。它没有界面，只负责连接 pointer 事件、状态面板和控制方法。

## 调用方式

```tsx
<Piv is={hoverable()} />
<Piv is={hoverable({ initialHovered: true })} />

const [plugin, controller] = usePlugin(hoverable)
<Piv is={plugin} />
```

调用工厂配置 Plugin，由 Piv 在节点安装时执行。需要读取状态或执行操作时使用 `usePlugin()` 取得 Controller。

## Controller

- `hovered` 是只读 State，表示当前 hover 状态。
- `hover()`、`unhover()`、`toggleHover()`、`resetHover()` 是操作按钮。
- 每次节点安装创建独立状态；Controller 仅在该节点安装期间可用。

## 验证

- 单元测试验证 Controller 和实例隔离。
- 浏览器测试验证真实 PointerEvent、DOM attribute 与直接与受控调用方式。
