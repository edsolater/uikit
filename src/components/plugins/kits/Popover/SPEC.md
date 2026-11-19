# 职责

`createPopoverPlugins` 为实际节点提供成对浮层能力：关联触发端与正文端，处理原生显隐、状态、事件和锚点定位。正文、内容布局与外观仍由 Button／Card 等宿主或业务样式负责；Plugin 不创建内容外壳，也不绘制背景、箭头或阴影。

# 构建与使用

组合工具统一汇集两端的能力结果和 Controller；Popover 直接声明两端 core，并通过组合工具的 controller 配置补充快捷操作。在组件内调用一次 `createPopoverPlugins`，得到 `{ plugins, controller }`。`plugins` 的 `trigger`、`body` 是保留自身 `plugin` 和 `controller` 的原始能力结果，可直接交给 `is`；`controller` 集中提供两端控制入口。集合 `plugins` 本身不交给 `is`。无需外传共享 id、Scope 或组件 ref：

```tsx
function Example() {
  const [initialFocus, receiveInitialFocus] = createDomRef<HTMLButtonElement>()
  const { plugins: popoverPlugins, controller: popoverController } =
    createPopoverPlugins({
      body: {
        $anchorPosition: 'top',
        $anchorGap: 'md',
        autoFocus: initialFocus,
      },
    })

  return (
    <>
      <Button is={popoverPlugins.trigger}>打开说明</Button>
      <Card is={popoverPlugins.body}>
        <Text>正文由调用者提供。</Text>
        <Button
          domRef={receiveInitialFocus}
          on={{
            click() {
              popoverController.body.hidePopover()
            },
          }}
        >
          关闭说明
        </Button>
      </Card>
    </>
  )
}
```

`controller` 的 `trigger`、`body` 分别是完整的 `PopoverTriggerController`、`PopoverBodyController`，与整体入口共享同一个 `isOpen`。不同组合调用相互独立。组件结构查看展示实际 Button／Card，不新增 Popover 的组件 Marker。输入配置使用 `trigger`、`body` 字段。

示例中的 `createDomRef` 取得原生元素引用，传给 Button 的是 `domRef`，不是组件 Controller 的 `ref`。

# 配置

| 配置位置  | 字段              | 行为与默认值                                                                                                                                         |
| --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger` | `triggerAction`   | `'toggle'`／`'show'`／`'hide'`／false，默认 `'toggle'`；键盘使用实际按钮的原生行为。false 只保留锚定，不注入按钮 target 关联和 dialog／expanded 语义 |
| `body`    | `$anchorPosition` | `Source<'top' \| 'right' \| 'bottom' \| 'left' \| undefined>`，默认 `'top'`；按来源更新定位，空间不足时由浏览器原生翻向                              |
| `body`    | `$anchorGap`      | `Source<'sm' \| 'md' \| 'lg' \| undefined>`，默认 `'md'`；指定锚点与主体的间距档位，实际距离由 `popover.style.ts` 映射                               |
| `body`    | `popover`         | `'auto'`／`'hint'`／`'manual'`，默认 `'auto'`；外部点击、Escape 等关闭行为沿对应原生模式                                                             |
| `body`    | `defaultOpen`     | `Source<boolean \| undefined>`，默认 false；只用于首次挂载的初始化判断，不随来源后续变化持续开关                                                     |
| `body`    | `autoFocus`       | `Partial<HTMLElement> \| false`，接受实际 DOM 元素或既有 `createDomRef` 的元素引用；省略时选择 body 内第一个可聚焦元素，false 禁用这份自动聚焦声明   |

`defaultOpen` 读取的是 Source 的完成值，不能把 State／Promise 对象本身的真值当成 true。位置与间距是持续来源，默认打开是一次初始化，两者用途不同。

`$` 前缀表示调用者明确指定系统选择，不表示 CSS 变量。间距只使用 `sm`／`md`／`lg` 关键字，调用者无需指定像素，也不使用 `var()`。

# 初始焦点与原生恢复

打开时，指定的 `autoFocus` 目标须在本组 body 范围内且可聚焦；body 自身已可聚焦时也可作为指定目标。未指定目标时，查找 body 内第一个可聚焦元素，跳过 disabled、hidden、inert 等不可用项。没有候选时，不临时给 body 增加可聚焦属性，也不强行聚焦它。

`autofocus` 声明由能力作用域持有：每次打开前先恢复上一选择的原属性，再按当前目标和内容建立本次标记并排除冲突；正常开关或取消不撤销声明，能力退出时恢复原属性。聚焦仍由浏览器在实际打开时执行，保留声明不会主动调用 focus，取消也不移动焦点；关闭后的焦点恢复完全原生，Plugin 不额外聚焦 trigger。

传入 false 时，不选择或声明默认聚焦目标，适用于只提供额外信息的 Tooltip。当前指定目标只支持 DOM 引用；`Partial<HTMLElement>` 用于兼容既有元素引用，不是 Partial Controller。以组件 Controller 或 Component 类型指定目标仍为 TODO，尚无统一 DOM 入口，不在本轮新增。

# 原生事件与回调

回调配置在 `body`，各自接收一个 context 对象并返回 `void`。其中 `event` 是实际原生事件，提供 `oldState`、`newState` 和 `preventDefault()`，状态值为 `'open'`／`'closed'`。

| 原生阶段 | 回调顺序 |
| --- | --- |
| `beforetoggle`，即将打开 | `onBeforeToggle({ open: true, event })` → `onBeforeOpen({ event })` |
| `beforetoggle`，即将关闭 | `onBeforeToggle({ open: false, event })` → `onBeforeClose({ event })` |
| `toggle`，实际状态改变 | 先按 `:popover-open` 写入同组状态，再调用 `onToggle({ open, event })` |

同一阶段转交同一个原生事件。可在 Before 回调中同步调用 `event.preventDefault()`。是否可以拒绝由原生事件的 `cancelable` 决定，例如原生关闭通常无法在这里阻止。

## 开关过程

`onOpenStart`、`onOpenEnd`、`onCloseStart`、`onCloseEnd` 和 `onCancel` 收到 `{ transaction }`。每个 transaction 代表一次打开或关闭，`direction` 为 `'open'` 或 `'close'`。Start 到达时可以登记这一次的结束与取消通知。

```ts
onOpenStart({ transaction }) {
  transaction.onEnd(({ transaction }) => 确认打开完成(transaction))
  transaction.onCancel(({ transaction }) => 清理打开资源(transaction))
}
```

结束时调用对应的 End，或者在过程被打断时调用 Cancel；该次订阅随即释放。已结束的 transaction 登记新回调时不会回放。打开途中改为关闭时，打开 transaction 取消，关闭过程取得新的 transaction。Before 阶段拒绝请求时，正在运行的过程继续。

Popover 默认淡入和淡出，无需配置。默认时长为 160 毫秒，缓动为 `ease`。需要调整时，在 `body.$animation` 中选填 `$duration` 或 `$easing`，其余沿用默认。

```ts
createPopoverPlugins({ body: { $animation: { $duration: 200 } } })
```

同一配置用于打开和关闭。`$duration: 0` 或启用系统减少动态效果时，确认显隐后依次发 Start 和 End。默认关闭会在淡出期间继续显示正文，由浏览器在过渡结束后释放顶层位置。宿主仍负责背景与布局。

同一个终态会送达配置回调和本次已登记的订阅。某个回调抛出的错误会报告给浏览器，其余订阅继续收到通知。`onProgress` 留作低优先级后续事项。

`onPopoverFlip` 指定位方向翻面，不是打开／关闭事件。本轮仅保留预留声明，不触发通知；当前参数类型是占位，真正的方向事件类型后续确定。CSS 的原生翻向照常工作，不用 `PopoverToggleEvent` 伪造定位通知。

# Controller 操作

两个角色提供相同的 Task，操作同组 body；Task 从构建返回时就存在，无需可选调用。整体入口另提供常用操作的直接引用，不包装转发：

```ts
const { trigger: triggerController, body: bodyController } = popoverController
const controller = popoverController

controller.showPopover === triggerController.showPopover // true
controller.hidePopover === bodyController.hidePopover // true
controller.togglePopover === triggerController.togglePopover // true

controller.showPopover()
controller.hidePopover()
controller.togglePopover()
controller.togglePopover({ force: true })
controller.togglePopover({ force: false })
```

| 方法                      | 行为                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `showPopover()`           | 请求原生打开，初始焦点由 body 的 `autoFocus` 配置决定                                 |
| `hidePopover()`           | 请求原生关闭；Plugin 不再额外恢复触发端焦点                                           |
| `togglePopover(options?)` | `force` 省略时切换，true 请求打开，false 请求关闭；焦点遵守上述打开配置和原生关闭行为 |

每个指令都同步返回独立的 `TaskResult<void>`。`execution.isSuccess` 表示本次显隐是否成功，已经在目标状态时也为 `true`。未取得正文元素、取得正文后发现作用域已退出，或打开被 Before 拒绝时，`isSuccess` 为 `false`，`execution.result` 仍正常兑现。原生操作抛错或任务取消时，`isSuccess` 为 `false`，`result` 仍按原规则拒绝。等待这些结果不要求原生 `toggle` 已送达或 CSS 过渡已结束。

```ts
const opening = popoverController.showPopover()
const opened = await opening.isSuccess
await opening.result

const execution = popoverController.showPopover.lazyExec()
execution.cancel() // 取消尚未执行的原生操作。
await execution.result.catch(() => undefined) // 取消以 AbortError 拒绝。

await popoverController.hidePopover().result
```

取消检查发现本次已取消时，不再执行后续原生操作；取消不撤销已经完成的显隐。每次调用彼此独立，不自动取消前一次命令。

# 功能定位与当前边界

`popover.style.ts` 只控制浮层的 position、inset、margin、anchor 关联、四向位置、fallback 和锚点可见性；不接管 padding、尺寸排版、材料或普通 overflow 裁剪。

Controller 完整和拿到 `domProxy` 都不表示正文已经挂载。当前显隐 Task 等到元素并检查取消后尝试原生操作，再据实报告。需要等待挂载的具体操作可自行决定其就绪条件，统一机制留待后续讨论。

- [Task 与 TaskResult](../../../../../../fnkit/src/task.ts)：提供本次执行的结果、取消和动作报告。
- [Popover 正文挂载与 Task 就绪](../../../../../docs/todo/261119_Popover正文挂载与Task就绪.md)：记录取得元素与实际挂载的时序差。
- [if 显隐复用 DOM](../../../../../docs/todo/261107_if显隐复用DOM.md)：当前不能假定条件重建已经复用原节点。

# Tooltip 的复用

`tooltip` 仍是一元自身能力：

```tsx
<Text
  is={tooltip({
    content: '补充说明',
    $anchorPosition: 'top',
    $anchorGap: 'md',
  })}
>
  正文
</Text>
```

它的配置为 `Pick<PopoverBodyOptions, '$anchorPosition' | '$anchorGap'> & { content: PivProps['children'] }`。位置默认 top、间距默认 md，Source 完成值为 null／undefined 时也回落这些默认值；Popover 与 Tooltip 的默认位置／间距均为 top／md。

Tooltip 内部一次构建 `createPopoverPlugins`，使用 `triggerAction:false`、`popover:'hint'` 和 `autoFocus:false`；通过同一 Piv body 复用原生定位、显隐及打开状态，自身拥有阅读事件、aria 描述与提示材料，不再使用 Surface 或旧 VisibilityController。内容清空会关闭、清计时并移除正文，再次有内容时复用同一节点；数字 0 有效。Tooltip Controller 仍只提供 `isOpen`、`showPopover()`、`hidePopover()`，不扩大调用方接口。

Tooltip 的 `showPopover`、`hidePopover` 同样声明为 `Task<void>`，沿用同一次内部 Popover 操作的显隐结果。没有提示内容时，显示请求正常结束，`isSuccess` 为 `false`。外层取消目前不传递给已经启动的内部执行。hover、focus、150ms 离开关闭等阅读行为由 Tooltip 负责。
