# Droppable Plugin

## 目标

`droppable` 同时接收两种材料：UIKit `draggable` 发起的页面内 Pointer 拖动，以及系统文件等浏览器外部原生拖放。

```tsx
function Example() {
  const { draggable, droppable } = dragAndDrop({
    draggable: { payload: item },
    droppable: { onDrop: receive },
  })
  return (
    <>
      <Piv is={draggable}>拖动材料</Piv>
      <Piv is={droppable}>接收材料</Piv>
      <Piv is={droppable({ onDrop: receive })}>独立接收</Piv>
    </>
  )
}
```

配置调用在组件内完成并立即构建状态与 Controller；元素接入时登记内部目标并接入外部材料监听，节点退出时释放。

页面内拖动先比较两端由同次组合共享的内部身份，再用 `accepts()` 判断材料；独立调用两端的内部身份都是 `undefined`，可以协作。外部文件只由启用状态和 `accepts()` 决定。

## DropContext

`kind` 是可辨识联合类型：

- `kind: 'internal'`：来自 UIKit draggable；提供 `payload`、`source`、`target` 和 `PointerEvent`。
- `kind: 'external'`：来自浏览器窗口外；提供 `files`、`items`、`types`、`dataTransfer` 和 `DragEvent`。

外部文件条目的 `items` 保留原生身份，可继续使用当前浏览器提供的文件系统能力。

## Controller

- `enabled`：当前是否允许接收。
- `hovering`：拖动是否正在接收区域上方。
- `acceptable`：当前材料是否可接收；页面内材料还须匹配同次组合的内部身份。
- `enable()`、`disable()`：控制接收能力。

## Example

[droppable.example.tsx](droppable.example.tsx) 同时演示内部 Pointer payload 与系统外部文件。独立 draggable 见 [Draggable Example](../draggable/draggable.example.tsx)。

## 边界

- 不发起拖动，不拥有 `payload`。
- 原生 `DragEvent` 只服务浏览器外部拖入，不参与页面内 draggable 协作。
- 不把文件转换成业务对象。
- 不解释放下后的排序或 Widget 业务。
