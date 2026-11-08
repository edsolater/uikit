# 职责

`createPopoverPlugins` 为实际节点提供成对浮层能力：关联触发端与正文端，处理原生显隐、状态、事件和锚点定位。正文、内容布局与外观仍由 Button／Card 等宿主或业务样式负责；Plugin 不创建内容外壳，也不绘制背景、箭头或阴影。

# 构建与使用

组合工具统一汇集两端的能力结果和 Controller；Popover 直接声明两端 core，并通过组合工具的 controller 配置补充快捷操作。在组件内调用一次 `createPopoverPlugins`，得到 `{ plugins, controller }`。`plugins` 的 `trigger`、`body` 是保留自身 `plugin` 和 `controller` 的原始能力结果，可直接交给 `is`；`controller` 集中提供两端控制入口。集合 `plugins` 本身不交给 `is`。无需外传共享 id、Scope 或组件 ref：

```tsx
function Example() {
  const [initialFocus, receiveInitialFocus] = createDomRef<HTMLButtonElement>()
  const { plugins: popoverPlugins, controller: popoverController } = createPopoverPlugins({
    body: {
      $anchorPosition: 'top',
      $anchorGap: 'md',
      autoFocus: initialFocus,
    },
  })

  return <>
    <Button is={popoverPlugins.trigger}>打开说明</Button>
    <Card is={popoverPlugins.body}>
      <Text>正文由调用者提供。</Text>
      <Button domRef={receiveInitialFocus} on={{ click() {
        popoverController.body.hidePopover()
      } }}>关闭说明</Button>
    </Card>
  </>
}
```

`controller` 的 `trigger`、`body` 分别是完整的 `PopoverTriggerController`、`PopoverBodyController`，与整体入口共享同一个 `isOpen`。不同组合调用相互独立。组件结构查看展示实际 Button／Card，不新增 Popover 的组件 Marker。输入配置使用 `trigger`、`body` 字段。

示例中的 `createDomRef` 取得原生元素引用，传给 Button 的是 `domRef`，不是组件 Controller 的 `ref`。

# 配置

| 配置位置 | 字段 | 行为与默认值 |
| --- | --- | --- |
| `trigger` | `triggerAction` | `'toggle'`／`'show'`／`'hide'`，默认 `'toggle'`；键盘使用实际按钮的原生行为 |
| `body` | `$anchorPosition` | `Source<'top' \| 'right' \| 'bottom' \| 'left' \| undefined>`，默认 `'bottom'`；按来源更新定位 |
| `body` | `$anchorGap` | `Source<'sm' \| 'md' \| 'lg' \| undefined>`，默认 `'md'`；指定锚点与主体的间距档位，实际距离由 `popover.style.ts` 映射 |
| `body` | `popover` | `'auto'`／`'hint'`／`'manual'`，默认 `'auto'`；外部点击、Escape 等关闭行为沿对应原生模式 |
| `body` | `defaultOpen` | `Source<boolean \| undefined>`，默认 false；只用于首次挂载的初始化判断，不随来源后续变化持续开关 |
| `body` | `autoFocus` | `Partial<HTMLElement>`，接受实际 DOM 元素或既有 `createDomRef` 的元素引用；省略时选择 body 内第一个可聚焦元素 |

`defaultOpen` 读取的是 Source 的完成值，不能把 State／Promise 对象本身的真值当成 true。位置与间距是持续来源，默认打开是一次初始化，两者用途不同。

`$` 前缀表示调用者明确指定系统选择，不表示 CSS 变量。间距只使用 `sm`／`md`／`lg` 关键字，调用者无需指定像素，也不使用 `var()`。

# 初始焦点与原生恢复

打开时，指定的 `autoFocus` 目标须在本组 body 范围内且可聚焦；body 自身已可聚焦时也可作为指定目标。未指定目标时，查找 body 内第一个可聚焦元素，跳过 disabled、hidden、inert 等不可用项。没有候选时，不临时给 body 增加可聚焦属性，也不强行聚焦它。

`autofocus` 声明由能力作用域持有：每次打开前先恢复上一选择的原属性，再按当前目标和内容建立本次标记并排除冲突；正常开关或取消不撤销声明，能力退出时恢复原属性。聚焦仍由浏览器在实际打开时执行，保留声明不会主动调用 focus，取消也不移动焦点；关闭后的焦点恢复完全原生，Plugin 不额外聚焦 trigger。

当前只支持 DOM 引用；`Partial<HTMLElement>` 用于兼容既有元素引用，不是 Partial Controller。以组件 Controller 或 Component 类型指定目标仍为 TODO，尚无统一 DOM 入口，不在本轮新增。

# 原生事件与回调

回调配置在 `body`。`PopoverToggleEvent` 是实际原生事件，提供 `oldState`、`newState` 和 `preventDefault()`，状态值为 `'open'`／`'closed'`。

此处记录当前已实现的原生状态回调；Start／End／Progress／Cancel 生命周期仍是[现役 Plan 中的后续目标](../../../../../docs/plans/261106_Popover与Tooltip能力重构.md#后续生命周期已定名称尚未实现)，当前 `onOpen`／`onClose` 不表示 CSS 过渡完成。

| 原生阶段 | 回调顺序 |
| --- | --- |
| `beforetoggle`，即将打开 | `onBeforeToggle(true, event)` → `onBeforeOpen(event)` |
| `beforetoggle`，即将关闭 | `onBeforeToggle(false, event)` → `onBeforeClose(event)` |
| `toggle`，实际打开 | 先按 `:popover-open` 写入同组状态，再 `onToggle(true, event)` → `onOpen(event)` |
| `toggle`，实际关闭 | 先按 `:popover-open` 写入同组状态，再 `onToggle(false, event)` → `onClose(event)` |

同一阶段转交同一个原生事件，事件发生时读取当前回调。打开前可以在前置回调中调用 `event.preventDefault()`；取消后不能报告已经打开，也不会因此触发打开后的回调。能否取消由原生事件的 `cancelable` 决定，不能承诺用它阻止原生关闭。

`onPopoverFlip` 指定位方向翻面，不是打开／关闭事件。本轮仅保留预留声明，不触发通知；当前参数类型是占位，真正的方向事件类型后续确定。CSS 的原生翻向照常工作，不用 `PopoverToggleEvent` 伪造定位通知。

# Controller 操作

两个角色提供相同的方法，操作同组 body；方法从构建返回时就存在，无需可选调用。整体入口另提供常用操作的直接函数引用，不包装转发：

```ts
const { trigger: triggerController, body: bodyController } = popoverController
const controller = popoverController

controller.showPopover === triggerController.showPopover // true
controller.hidePopover === bodyController.hidePopover   // true
controller.togglePopover === triggerController.togglePopover // true

controller.showPopover()
controller.hidePopover()
controller.togglePopover()
controller.togglePopover({ force: true })
controller.togglePopover({ force: false })
```

| 方法 | 行为 |
| --- | --- |
| `showPopover()` | 请求原生打开，初始焦点由 body 的 `autoFocus` 配置决定 |
| `hidePopover()` | 请求原生关闭；Plugin 不再额外恢复触发端焦点 |
| `togglePopover(options?)` | `force` 省略时切换，true 请求打开，false 请求关闭；焦点遵守上述打开配置和原生关闭行为 |

方法当前不返回 TaskResult 或成功 boolean；原生状态仍以 `isOpen` 和实际事件为准。

# 功能定位与当前边界

`popover.style.ts` 只控制浮层的 position、inset、margin、anchor 关联、四向位置、fallback 和锚点可见性；不接管 padding、尺寸排版、材料或普通 overflow 裁剪。

Controller 完整不代表元素已经就绪。当前 `domProxy` 缓存首次 DOM；慢节点、未插入文档时的操作及清理后晚执行仍有已知时序缺口，不能把当前命令当成已具备可靠任务取消或成功判定。

- [Task 与 TaskResult 异步操作](../../../../../docs/todo/261107_Task与TaskResult异步操作.md)：后续统一就绪、结果与取消。
- [if 显隐复用 DOM](../../../../../docs/todo/261107_if显隐复用DOM.md)：当前不能假定条件重建已经复用原节点。
- [PromiseResultProxy 兼容 Promise 协议](../../../../../docs/todo/261107_PromiseResultProxy兼容Promise协议.md)：可等待不等于已完整兼容 Promise。

旧 Tooltip 仍使用旧 Surface 和显隐工具，本能力不表示 Tooltip 已迁移。
