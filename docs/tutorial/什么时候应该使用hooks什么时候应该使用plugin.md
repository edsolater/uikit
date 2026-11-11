# 什么时候使用 Hook，什么时候使用 Plugin

先判断要表达的是界面节点、组件逻辑，还是已有节点的能力：

| 形式   | 承担什么                                               | 典型情境                                                 |
| ------ | ------------------------------------------------------ | -------------------------------------------------------- |
| 组件   | 承担界面中的节点身份，组织内容与层次。                 | Card 承载一份信息，Button 表达一个操作入口。             |
| Hook   | 在组件作用域中组织状态、计算或共享逻辑。               | 多处使用同一份状态，或组合一段不直接注入节点声明的逻辑。 |
| Plugin | 描述宿主节点自身具有什么功能，通过 `is` 给它增加能力。 | 这个 Card 可点击、可拖动，或附有 Tooltip 说明。          |

Plugin 不作为业务内容提供商。业务内容仍由调用者写在组件层次中：

```tsx
<Card is={clickable({ tabIndex: 0 })}>
  <Text>卡片自己的业务内容</Text>
</Card>
```

这里的界面节点是 Card、Text；clickable 描述 Card 的能力，不另占一个业务界面节点。实现能力时可以使用附属 DOM 或结构，例如 Tooltip 的浮层；这不意味着 Plugin 要替调用者承载业务内容。

## 先定义能力，再在组件中构建

下面省略 import；`createInactivePlugin` 与 `PluginCoreContext` 对应 [Plugin 构建工具](../../src/components/plugins/tools/createInactivePlugin.ts)。

```tsx
interface HighlightOptions {
  color: string
}

// 模块级定义：返回 inactivePlugin 函数，不运行 pluginCore。
const highlight = createInactivePlugin({
  name: 'highlight',
  pluginCore({
    pluginOptions,
    addProps,
    domProxy,
  }: PluginCoreContext<HighlightOptions>) {
    addProps({ style: { color: pluginOptions.color } })
    return { focus: () => domProxy.focus() }
  },
})

function Example() {
  // 组件内调用：立即运行一次 core，得到完整能力结果。
  const capability = highlight({ color: 'red' })
  return <Card is={capability}>需要高亮的信息</Card>
}
```

完整过程是：

```text
createInactivePlugin({ name, pluginCore })
  → inactivePlugin 函数
  → 组件内 inactivePlugin(pluginOptions)，执行一次 core
  → 同步得到 { plugin, controller }
  → is 展开 plugin 中已构建的声明，不重跑 core
```

定义可以放在模块顶层；配置调用必须在组件作用域中完成，JSX 内联调用也可以。`addProps` 直接提交统一的 ShadowProps；样式、事件和子能力优先用声明表达。需要 DOM 操作时使用缓存的 `domProxy`，不必在每个能力中另存元素引用。

## is 接受什么

`is` 接受 Plugin 本身，或者 `plugin` 字段为有效 Plugin 的对象。能力结果 `{ plugin, controller }` 正好属于后一种形式：

```tsx
<Card is={capability}>信息</Card>
<Card is={capability.plugin}>信息</Card>

// highlight 是 inactivePlugin 函数，必须先调用。
<Card is={highlight({ color: 'red' })}>信息</Card>
// is={highlight} 不是有效 Plugin 输入。
```

以上展示等效输入形式，不表示同一份能力需要安装到多处。需要各节点拥有独立状态和控制入口时，分别调用 inactivePlugin。

同一个节点需要多个能力时，使用数组：

```tsx
<Card is={[clickable(), tabularNum()]}>可点击并使用等宽数字</Card>
```

## 多个节点需要配合时，定义组合能力

单元描述各节点自己的能力；[createInactivePlugins](../../src/components/plugins/tools/createInactivePlugins.ts) 将多个单元 core 组织成一次联合构建，内部仍逐项复用 `createInactivePlugin`。

```tsx
const dragAndDrop = createInactivePlugins({
  draggable: draggablePluginCore,
  droppable: droppablePluginCore,
})

function Transfer() {
  const {
    plugins: { draggable, droppable },
  } = dragAndDrop({
    draggable: { payload: '一份材料' },
    droppable: { onDrop: (context) => 接收材料(context) },
  })

  return (
    <>
      <Card is={draggable}>拖动材料</Card>
      <Card is={droppable}>接收材料</Card>
    </>
  )
}
```

组合定义可以放模块顶层；组合调用在组件内完成。组合返回 `{ plugins, controller }`；`plugins.draggable`、`plugins.droppable` 保留各自完整的能力结果，交给 `is` 时不再调用。`controller.draggable`、`controller.droppable` 直接引用对应能力结果的 Controller。角色集合 `plugins` 本身不交给 `is`。

同次组合调用在内部共享一份身份，不同调用各自隔离。调用者不需要传 `id`、使用 Scope 或再经 `usePlugin` 连接。

## 能力可以继续组合能力

父 core 可以构建子能力，将子能力的声明交回同一条 `is` 解析链，并直接使用它的 Controller：

```ts
const child = hoverable({})
addProps({ is: child })
const hovered = child.controller.hovered
```

`domProxy` 支持首次节点的异步取得，但不自动保证节点已接入文档或操作成功。Controller、资源清理及当前边界见[怎样使用 Plugin 的控制入口](外部获取plugin内部状态并使用.md)；后续能力仍按对应 TODO 推进，不作为当前已成立的保证。
