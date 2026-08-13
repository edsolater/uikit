# Plugins

## 领域身份

Plugins 定义能够交给 Piv 的可实例化能力。一个 Plugin 可以携带 options；每次实例化都会产生一份互不共享的 Piv plugin 与 Controller。

Plugin 本体和传入 options 后的返回值都仍然是 Plugin：

```tsx
<Piv plugin={hoverable} />
<Piv plugin={hoverable({ initialHovered: true })} />

const [plugin, controller] = usePlugin(hoverable)
<Piv plugin={plugin} />
```

前两种写法由 Piv 在消费时实例化。`usePlugin()` 只在调用方需要 Controller 时提前实例化；它不取得 DOM，也不运行 Plugin，因此不是 Plugin Consumer。

## 领域内容

- `definePlugin.ts` 定义 Plugin、options、实例和 Controller 之间的协议，并提供 `createPlugin()`。
- `usePlugin.ts` 显式创建一份 Plugin 实例，把 Piv plugin 和 Controller 交给调用方。
- `kits/` 只分组可用的具体 Plugin，不形成新的领域入口。
- `utils/` 只分组 Plugins 领域内部的辅助代码，不形成新的领域入口。
- `index.ts` 是 Plugins 领域的公开入口，只导出定义、显式实例化能力和具体 Plugin。

当前具体 Plugin 包括 `clickable`、`hoverable`、`scope`、`draggable` 与 `droppable`。`dragAndDrop` 是供 Scope 识别 Draggable/Droppable 协作的能力身份，不是第四个 Plugin。页面内拖动由 Pointer Events 与 transform 预览完成；原生 DragEvent 只服务系统外部材料进入 droppable。

## 为什么没有 Consume

Plugin 领域只有 Define，没有独立的 Consume。消费必须拿到 Piv 创建的真实 DOM、Piv plugin 上下文和 shadow props 合并流程；这些条件全部由 Piv 提供。离开 Piv，Consume 无法说明自己消费到哪里，也无法产生完整结果，因此不能成为 Plugins 领域中的文件或公开接口。

Piv 在自己的运行入口中识别、实例化并执行 Plugin。具体过程见 [`Piv/plugin/runPlugin.ts`](../Piv/plugin/runPlugin.ts)。Plugins 领域只公开 Piv 需要遵守的实例协议，不拥有 Piv 的消费步骤。

## 边界

- Plugins 定义“什么可以被实例化”，不定义真实 DOM 怎样消费它。
- Piv 定义“怎样把 Plugin 用到当前 DOM”，不反向拥有具体 Plugin 的 options、状态和操作。
- `usePlugin()` 暴露 Controller，但最终得到的 Piv plugin 仍需交给 Piv 执行。
- 不建立 `PluginConsumer`、`consumePlugin()` 或其他脱离 Piv 的消费入口。
