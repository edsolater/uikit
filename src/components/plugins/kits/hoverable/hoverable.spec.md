# Hoverable Plugin

## 目标

`hoverable` 为一个 Piv 提供独立的 hover 状态。它没有界面，只负责连接 pointer 事件、状态面板和控制方法。

## 调用方式

```tsx
<Piv plugin={hoverable} />
<Piv plugin={hoverable({ initialHovered: true })} />

const [plugin, controller] = usePlugin(hoverable)
<Piv plugin={plugin} />
```

直接使用和配置后使用都由 Piv 在消费时实例化。只有调用方需要读取状态或执行操作时，才使用 `usePlugin()` 取得 Controller。

## Controller

- `hovered` 是只读 State，表示当前 hover 状态。
- `hover()`、`unhover()`、`toggleHover()`、`resetHover()` 是操作按钮。
- 每次 Piv 消费或 `usePlugin()` 调用都会创建新的 Controller；不同实例不共享状态。

## 验证

- 单元测试验证 Controller 和实例隔离。
- 浏览器测试验证真实 PointerEvent、DOM attribute 与三种调用方式。
