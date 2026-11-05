# Plugin 的状态与控制能力怎样交给外部

单节点 Plugin 和多角色能力都可以有 Controller。需要在外部持有功能及其控制入口时，使用 `usePlugin`，直接取得统一二元返回值；不经过宿主组件的 ref 回流。

本文记录目标契约，迁移尚未实施。入口选择的原因与直接调用用法见[使用 Tutorial](什么时候应该使用hooks什么时候应该使用plugin.md)。

## 单节点返回 Plugin 与 Controller

单节点遵循 `const [plugin, controller] = usePlugin(definition, options)`：第一项是已经创建的 Plugin 对象，第二项是该功能的 Controller。`is` 只接第一项；既不接整个二元结果，也不再次调用这个对象。具体示例见[直接调用与提前创建的对照](什么时候应该使用hooks什么时候应该使用plugin.md#直接调用与提前创建的效果等价)。

如果只需要就地声明功能，可以直接使用 `is={focusable(options)}`。两种入口表达相同功能；`usePlugin` 让调用者可以提前持有实例和控制能力，不以多节点连接为前提。

## 多角色返回两组对应对象

Popover 的二元返回形状是 `[{ popoverTrigger, popoverBody }, { popoverTriggerController, popoverBodyController }]`，由 `usePlugin(popover, options)` 创建。完整配对示例见[使用 Tutorial](什么时候应该使用hooks什么时候应该使用plugin.md#统一二元返回结构)。

| 控制入口 | 归属 |
| --- | --- |
| `popoverTriggerController` | 入口侧控制及宿主引用，可注入入口所属业务组件的 Controller |
| `popoverBodyController` | 主体侧控制、宿主引用与实际状态，可注入另一个业务组件的 Controller |

拆分的是控制职责和交付入口，不是复制两份浮层或显隐状态再同步。具体方法与引用字段以能力契约为准，不为形式对称复制整张方法表。

## 不通过宿主回流

宿主负责承载内容和接受功能；Plugin 负责自己的状态及控制出口。先把控制对象注入宿主，再从宿主的组件 Controller 取回，会把宿主变成功能状态的中转站。

因此，`usePlugin` 创建功能后直接交付 Controller，不新增通用 `innerController` 管道，不要求调用者接线两次。普通组件 ref 与 Plugin Controller 保持各自职责。

## 有 Controller 不等于暴露全部内部状态

Controller 提供有意开放的读取与操作能力。内部状态仍由功能管理，不把所有细节交给外部，也不把普通内部状态都包装成新的公共对象。

现在已经明确统一 `usePlugin` 的二元顺序：第一项是 Plugin 对象或角色对象集合，第二项是 Controller 或控制集合。旧的“不规定返回 tuple”“只有连接才使用 use”“返回工厂再调用”等推荐不再适用。直接调用 `focusable(options)` 的使用结果仍是可放进 `is` 的 Plugin 对象，不要把它和 `usePlugin` 的二元结果混为一谈。

相关具体契约见[Popover Doc](../../src/components/kits/Popover/Doc.md)，旧接口退出事项见[迁移计划](../plans/261105_Plugin能力声明与Popover连接API迁移.md)。
