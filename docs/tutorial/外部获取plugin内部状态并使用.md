# 怎样使用 Plugin 的控制入口

需要控制某个节点的 Plugin 时，在该节点所属组件内调用 `usePlugin`，把返回的 Plugin 交给 `is`，并通过另一个返回值使用功能成员。

```tsx
function Example() {
  const [plugin, controller] = usePlugin(clickable, { tabIndex: 0 })
  return <>
    <Card is={plugin}>信息</Card>
    <Button on={{ click: () => controller.focus?.() }}>聚焦</Button>
  </>
}
```

节点尚未安装、条件隐藏或已经卸载时，控制成员为 `undefined`；可选调用表达这一状态。挂载后控制入口指向该节点实际能力，卸载后释放。一个受控 Plugin 同时只安装一个节点；多个节点各自调用 `usePlugin`，互不共享状态。

不需要控制时直接使用 `is={clickable(options)}`。父 Plugin 需要子能力时直接执行子 Plugin 并取得成员；这不会将成员注入组件 Controller。组件原有 ref 与 Plugin 控制入口各自负责自己的状态。
