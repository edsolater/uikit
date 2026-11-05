# 什么时候使用组件、Plugin 与 usePlugin

组件表达界面运行中的节点，Plugin 描述已有节点具有什么功能。阅读 JSX 时，先看到界面层次中的对象，再通过 `is` 看出节点承担的目的。

本文记录已确定的目标设计，不表示当前包已完成迁移。实施事项见[Plugin 能力声明与 Popover 连接 API 迁移](../plans/261105_Plugin能力声明与Popover连接API迁移.md)。

## 先判断是否需要一个界面节点

**当一个事物在渲染系统或界面运行的心智模型中具有明确的节点身份与作用时，使用组件。** 它往往对应 DOM，但不要求每个组件额外生成一个 DOM；理解界面运行时需要把它作为明确节点来理解。

**给已有节点增加功能、交互能力或描述其自身时，使用 Plugin。** Plugin 的目的不是新增独立内容节点。Button 本身是操作入口；clickable 描述已有节点的可点击能力。Card 本身是信息体；Popover Body 能力让这张 Card 作为浮层，不另生产一张 Card。

选择不能只看内部 DOM 数量。Tooltip 可以有必要的附属说明呈现，但它对外表达的是当前节点的额外信息；反过来，也不能把本应在界面层次中明确表达的独立内容，藏进 Plugin 消除组件声明。

## 再决定在哪里创建功能、是否取得 Controller

| 使用需要 | 写法 | 得到什么 |
| --- | --- | --- |
| 在节点处直接声明功能 | `is={focusable(options)}` | 直接调用创建的 Plugin 对象 |
| 提前持有功能或取得它的 Controller | `const [plugin, controller] = usePlugin(focusable, options)` | 已创建的 Plugin 对象与 Controller；`is` 只接第一项 |
| 创建多个角色共同完成的能力 | `usePlugin(popover, options)` | 配对角色对象集合与角色 Controller 集合 |

**是否连接多个节点，不再是使用 usePlugin 的唯一条件。** clickable、focusable 等单节点 Plugin 也有 Controller，需要在外部控制时同样使用 `usePlugin`。多节点 Popover 的特殊性是返回一组联合角色，不是另用一个专属创建语法。

这里讨论 Plugin 的创建与使用，不限制普通数据 hook 的用途。内部有状态或生命周期不意味着调用者必须外部控制；需要何种控制，和功能内部如何实现，仍然是不同问题。

## 直接调用与提前创建的效果等价

~~~tsx
<Card is={focusable({ keyboardShortcur: 'ctrl + R' })}>
  当前信息
</Card>
~~~

需要外部持有 Controller 时：

~~~tsx
const [focusablePlugin, focusableController] = usePlugin(focusable, {
  keyboardShortcur: 'ctrl + R',
})

return <Card is={focusablePlugin}>当前信息</Card>
~~~

同样配置和宿主下，两种写法表达相同功能；区别在于是否提前持有创建结果及 Controller。等价不意味着执行两次创建会共享同一实例。

`usePlugin` 包裹并完成创建调用，返回的是对象，不是等待再次配置的工厂。因此 `is={focusablePlugin}` 正确，不能再写 `focusablePlugin()`。`is` 接受一个 Plugin 对象，或多个 Plugin 对象组成的数组。

## 统一二元返回结构

- 单节点：`[plugin, controller]`。
- 多角色：`[{ rolePlugins }, { roleControllers }]`。

`is` 接收 Plugin 对象或其中的角色对象，不接收整个二元结果。Controller 在创建时直接取得，不经过宿主组件 ref 回流。

~~~tsx
const [
  { popoverTrigger, popoverBody },
  { popoverTriggerController, popoverBodyController },
] = usePlugin(popover, {
  triggerMargin: '4px',
  anchorPosition: 'top',
})

return <>
  <Button is={popoverTrigger}>打开说明</Button>
  <Card is={[popoverBody, focusable({ keyboardShortcur: 'ctrl + R' })]}>
    这里是调用者自己的内容。
  </Card>
</>
~~~

Trigger、Body 仍描述各自宿主的功能；联合能力只建立关系，不增加公共内容节点。两个 Controller 可分别注入不同业务组件，但共同作用于同一组关系，不各自保存一份显隐事实再同步。

## 配置在创建时一次提供

`focusable(options)` 直接创建功能；`usePlugin(focusable, options)` 包裹这次创建，并返回控制入口。两者都在创建时提供配置，后者没有多出“返回工厂再配置”的阶段。

`usePlugin(popover, options)` 一次提供这组能力的连接与角色相关设置。配置语义仍由描述的事物决定：`anchorPosition` 描述相对方位，`triggerMargin` 是示例中选定的间距配置；不因同在一个参数对象里就变成相同职责。

**返回的角色对象直接使用，不再接配置。** 因此不继续采用“父 hook 给默认值，popoverTrigger(...)、popoverBody(...) 再配置覆盖”的旧分层。完整字段、参数结构和 Controller 成员由具体能力契约确定，不把旧组件 Props 整包搬进来。

## Tooltip 是描述自身的完整快捷功能

~~~tsx
<Card is={tooltip({ content: <Text>补充说明</Text> })}>
  当前信息
</Card>
~~~

Tooltip 是 Popover 能力的延伸和快捷应用。对调用者，它完整表达“当前节点有额外说明”，不需要再声明 Trigger、Body 或专门关闭按钮。内部可以使用 `usePlugin(popover, options)`，但这不是必须泄漏给调用者的步骤。

Popover Body 的正文已经由宿主的 children 表达；Tooltip 的 `content` 则是附加给宿主的说明，所以属于该完整功能的配置。Tooltip 还可以配置说明所需的整体能力，最终由内部 Popover 创建配置承接；不只允许配置某一个角色，也不机械规定全部字段原样透传。

## 控制与内容各有归属

内容层次由 Button、Card 及其 children 表达，Plugin 对象经 `is` 附加功能。Controller 由 `usePlugin` 直接交付；有 Controller 不意味着暴露全部私有状态，更不意味着让宿主组件成为功能状态的中转站。

进一步阅读：[状态与控制 Tutorial](外部获取plugin内部状态并使用.md)、[Popover 调用契约](../../src/components/kits/Popover/Doc.md)。

## 避免混淆

- 不把组件机械等同于一个额外 DOM，也不把 Plugin 当作隐藏独立内容节点的组件语法。
- 不把 `usePlugin` 限定为只能处理连接，或只让多节点能力具有 Controller。
- 不把创建函数和已创建对象混淆：直接工厂需要调用，`usePlugin` 的第一项结果直接放进 `is`。
- 不把整个 `[plugin, controller]` 放进 `is`，也不对返回的角色对象进行第二次调用。
- 不继续保留返回角色工厂及默认值覆盖层，与新的一次创建契约并行。
- 不把目标设计写成已经完成的实现，不在 Tutorial 中记录全局重命名施工步骤。
