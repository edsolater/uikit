# 怎样使用 Plugin 的控制入口

每次在组件内调用能力工厂，都会构建一份能力结果：`plugin` 交给 `is`，`controller` 直接使用。控制入口不需要额外的 hook，也不需要等待节点安装。

```tsx
function Example() {
  const capability = clickable({ tabIndex: 0 })
  return (
    <>
      <Card is={capability}>信息</Card>
      <Button on={{ click: () => capability.controller.focus() }}>聚焦</Button>
    </>
  )
}
```

能力结果返回时 Controller 已经是完整、稳定的功能入口：约定的方法和状态从调用起就存在，不用可选调用。它不读取节点是否安装，也不挂到组件 Controller；`is` 只消费 `plugin`。

节点没有接入（例如 `if=false`）、已经卸载以及被重新创建时，Controller 不会被替换。依赖 DOM 的方法在没有节点时是 no-op，不抛错；状态操作仍然有效。节点接入与退出只影响元素资源，不使方法消失。

同一份能力结果可以交给多个节点，节点按既有契约各自自然产生结果；不做引用去重、相同节点判断或多宿主管理。需要每个节点独立状态时，分别调用能力工厂。

不需要控制时直接使用内联结果，例如 `is={clickable(options)}`。父 Plugin 需要子能力时，构建子能力并通过 `is` 提交其声明，再使用 `child.controller` 的成员；这不会将成员注入组件 Controller。组件原有 ref 与 Plugin 控制入口各自负责自己的状态。
