# 怎样使用 Plugin 的控制入口

每次在组件内调用 inactivePlugin，都会同步得到一份完整能力结果：`plugin` 交给 `is`，`controller` 直接使用。控制入口不需要额外的 `usePlugin`、组件 ref 注入或 Controller Receiver。

```tsx
function Example() {
  const capability = clickable({ tabIndex: 0 })
  const controller = capability.controller

  return (
    <>
      <Card is={capability}>信息</Card>
      <Text>{val(controller.focused) ? '已聚焦' : '未聚焦'}</Text>
      <Button
        on={{
          click() {
            controller.focus()
          },
        }}
      >
        聚焦
      </Button>
    </>
  )
}
```

事件回调用块体发起命令，不把命令代理作为事件回调的返回值。需要结果时，在自己的操作流程中等待它：

```ts
const operation = controller.focus()
await operation
```

## Controller 完整，不等于节点已经就绪

Controller 的方法和状态在构建返回时已经存在，不使用 `Partial` 或可选调用来表达节点是否接入。`is` 只展开 Plugin 声明，不重建 Controller，也不会自动把这些成员挂到组件自身的 Controller。

```text
组件内调用 clickable(options)
  → 立即得到完整 controller
  → 节点接入后，domProxy 完成首次元素等待
  → 依赖 DOM 的命令才能对取得的元素执行
```

当前 `clickable` 的 `focus`、`blur`、`click` 直接复用 `domProxy` 命令代理。首次 DOM 尚未接入时，调用会等待，而不是自动 no-op；如果始终没有首次节点，也不能承诺操作会自行结束。

取得 DOM 又不等于完成操作条件。元素可能尚未插入文档；原生操作还可能失败。当前命令返回 `PromiseResultProxy<void>`，等待完成不表示已经得到了“操作是否成功”的 boolean，也不保证所有异常都被吞掉。

## 状态、命令与节点资源各自负责

纯状态方法按其自身契约执行；依赖 DOM 的方法按目标和操作的就绪条件执行。资源的建立与清理由实际声明、工具和所属作用域负责，不能从 Controller 对象仍然存在推断其资源仍在运行。

节点退出、`if` 重建或目标更换，不会重新运行同一次能力构建的 core；当前缓存首次 DOM 的代理也不会因此自动指向新对象。因此不能把“Controller 稳定”写成“节点随意更换后全部命令仍然正确”。

多个节点需要独立状态时分别调用 inactivePlugin；联合能力的角色从组合结果中分别取得 Controller：

```ts
const {
  plugins: { draggable, droppable },
} = dragAndDrop({
  draggable: { payload: item },
  droppable: { onDrop: receive },
})

draggable.controller.disable()
droppable.controller.enable()
```

不需要控制时直接写 `is={clickable(options)}`。父 Plugin 也可以通过 `child.controller` 使用子能力，组件自身的 ref 继续只承担组件原有的控制协议。

## Popover 分开返回节点能力与控制入口

组合工具统一返回 `{ plugins, controller }`，Popover 直接声明两端 core，通过工具第二参数的 controller 回调补充本领域快捷操作。`plugins` 包含两端原始能力结果，`controller` 包含两端完整 Controller，并提供常用操作的直接引用：

```tsx
const { plugins: popoverPlugins, controller: popoverController } = createPopoverPlugins()
const { trigger: popoverTrigger, body: popoverBody } = popoverPlugins
const { trigger: triggerController, body: bodyController } = popoverController

<><Button is={popoverTrigger}>打开</Button><Card is={popoverBody}>正文</Card></>

popoverController.showPopover === triggerController.showPopover // true
popoverController.hidePopover === bodyController.hidePopover   // true
popoverController.togglePopover === triggerController.togglePopover // true
```

两端和整体入口的 `isOpen` 是同一个 State。快捷方法只复用已有函数，不包装转发；两端能力结果仍保留各自的 `plugin` 与 `controller`，整体入口只是直接引用同一个 Controller。组合的角色能力结果与 Controller 由工具统一汇集；Popover 不重复汇集。单元能力仍按原协议返回自身的 `{ plugin, controller }`。配置按 `trigger`、`body` 传入，见 [Popover SPEC](../../src/components/plugins/kits/Popover/SPEC.md)。

## 尚未实现的能力

- [Task 与 TaskResult 异步操作](../../../fnkit/docs/plans/261108_Task与Result执行.md)：统一就绪等待、一次执行的结果和取消；当前没有提供这套 API。
- [if 显隐复用 DOM](../todo/261107_if显隐复用DOM.md)：显隐时复用同一元素尚未实现，当前不能假定已经做到。
- [操作成功 boolean](../../../fnkit/docs/plans/261108_PromiseResultProxy完整Promise与惰性计算.md)：底层完整 Promise 兼容与惰性计算已完成；业务操作返回 `Promise<boolean>` 属于尚未实施的第二阶段。
