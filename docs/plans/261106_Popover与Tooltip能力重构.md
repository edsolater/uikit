# Popover 与 Tooltip 能力重构

## 状态、前置与授权

本文是 Popover／Tooltip 能力改造的唯一现役 Plan。基础协议由 [is 声明解析与 Plugin 调用协议统一](261105_is声明解析与Plugin调用协议统一.md) 接管；现有 `domProxy` 与单元／组合构建工具已经可用，本文不重新设计这些工具。

**UIKit 的阶段 A Popover 基础能力和阶段 B Tooltip 迁移已交付。** Popover 的样式职责是浮层定位、锚点关联和显隐，内容布局及绘制由宿主负责。

**2026-11-19 [Popover 开关过程](#popover-开关过程)已实现并通过 UIKit 验证。** 本阶段在 Plan 修订和独立复核后施工，从原生状态通知扩展到 Popover 自身的 Start、End、Cancel 和单次过程订阅。实际差异和验证见[实施详情](../../agents/运行方案/261106_Popover与Tooltip能力重构_实施详情.md)。此前 Tooltip 迁移、外部验收及其他 TODO 按各自范围处理。

| 阶段            | 当前状态与交付                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------ |
| A：Popover      | 已完成双端能力、原生显隐与定位及 UIKit 消费迁移；B 仅为 Tooltip 补充必要的原生触发／聚焦关闭选项 |
| B：Tooltip      | UIKit 迁移已交付；复用 A 的能力接管旧 Surface／Controller／样式的生产消费                       |
| 真实 RuleDetail | 保留最终验收，当前没有外部项目修改授权，不随 UIKit 施工自动启动                                  |

本文引用前置 Plan 唯一维护的[全局运行图](261105_is声明解析与Plugin调用协议统一.md#全局运行图与本-plan-定位)：接收 I 的基础协议交付及 J 的用户明确许可，负责 L 至 N 的双端能力、原生浮层功能及 UIKit／RuleDetail 验证。其样式责任按本次用户裁决收敛为功能定位，不再把整体外观绘制当作本环节交付。前置负责 A 至 I；本 Plan 不反向重做其 API，也不另建总图。

执行前读取[仓库入口](../../AGENTS.md)、[Plan 落地](../how-to-apply-plan.md)、[任务分工](../../../ai-rules/rules/Agent-任务分工.md)、[代码修改](../../../ai-rules/rules/Code-代码修改.md)。沿用前置已获用户认可的完整 Controller、能力结果和内部组身份，不恢复 usePlugin、外传组 ID、Host、组件 Controller 注入或自动 ref 推导。

## 接收的基础协议

`createInactivePlugin({ name, pluginCore })` 只定义可调用能力；在组件内调用 inactivePlugin 才执行一次 core，同步返回完整 `{ plugin, controller }`。`createInactivePlugins` 每次组合调用内部创建共享身份并复用单元构造，组合统一返回 `{ plugins, controller }`，`plugins` 内各角色保留 PluginResult，`controller` 按角色直接引用其原 Controller；角色交给 `is` 时不再调用，集合本身不交给 `is`。不同组独立，调用方不传组 id。

`is` 接受真实 Plugin 或携带有效 `plugin` 字段的对象；Piv 只展开已构建的 ShadowProps，不重跑 core。字段、原生事件与子能力直接经 `addProps` 提交；实际 DOM 操作复用当前 `domProxy`，不恢复已退出的 `withDom`、`usePlugin` 或节点执行 core 协议。业务正文由实际组件提供，Plugin 不承担业务界面中的独立节点身份。

当前代理只缓存首次 DOM，本轮保持这一妥协。以下能力尚未实现，不能重新引入 State／Source 换源机制，也不能因它们未完成而强迫每个消费者添加等待、重试或生命周期桥：

- [if 显隐复用 DOM](../todo/261107_if显隐复用DOM.md)：当前不能假定条件重建已复用原对象。
- [Task 与 TaskResult](../../../fnkit/docs/plans/261108_Task与Result执行.md)：慢 DOM、浮层尚未就绪及等待后晚执行的问题仍按已知缺口记录，不在本 Plan 实现任务队列、abort 或失效控制。
- [操作成功 boolean](../../../fnkit/docs/plans/261108_PromiseResultProxy完整Promise与惰性计算.md)：完整 Promise 兼容与惰性计算已完成；业务操作的 `Promise<boolean>` 属于尚未实施的第二阶段，不伪造成功值。

阶段 A 的成对 Popover 能力及阶段 B 的 Tooltip 组装链是本轮开关过程的实施基线。

## 调用、效果与职责

### 1. 调用 API 与预期交互

下面是 Popover 的调用 API；当前详细契约由相邻 [Popover SPEC](../../src/components/plugins/kits/Popover/SPEC.md) 维护，实施状态以实际代码和验证为准。

```tsx
function PopoverExample() {
  const { plugins: popoverPlugins, controller: popoverController } =
    createPopoverPlugins({
      body: {
        $anchorPosition: 'top',
        $anchorGap: 'md',
      },
    })
  const { trigger: popoverTrigger, body: popoverBody } = popoverPlugins

  return (
    <>
      <Button is={popoverTrigger}>打开说明</Button>
      <Card is={popoverBody}>
        <Text>调用者提供正文，复杂内容仍写在这里。</Text>
        <Button
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

// 阶段 B：Tooltip 描述自身，不要求调用者提供另一端或关闭按钮。
;<Text is={tooltip({ content: <Text>补充说明</Text> })}>正文</Text>
```

Popover 是成对能力，不是负责生成 Button、标题或正文的内容组件。Button／Card／Piv 等实际节点保持界面层次；Card 或调用者的 `.style.ts` 负责内容布局和外观。Plugin 只让这个实际 body 成为可定位、可显隐的原生浮层，不生成背板或新的外观组件。`createInactivePlugins` 统一汇集角色结果与 Controller，`createPopoverPlugins` 直接由工具定义 trigger／body core，并在第二参数的 controller 回调中声明本领域快捷引用，一次调用内部配对两端；用户不传共享 id。返回对象的 `plugins` 保留两端原始能力结果，`controller` 只引用角色 Controller 和常用操作，不新建状态或生命周期。

以下代码块记录 A/B 阶段实施时的 API 快照；`triggerAction: false` 与 `autoFocus: false` 是 B 为 Tooltip 在 Popover 责任层补充的最小选项，其余沿阶段 A 的现有协议。现有 `onOpen`／`onClose` 是原生 toggle 后的状态通知，不是 CSS 过程开始或结束；目标生命周期在下一小节单独定义。`Source`、`State` 和 `PivProps` 使用现有 UIKit 类型，不另造同义类型。

```ts
type AnchorPosition = 'top' | 'right' | 'bottom' | 'left'
type PopoverTriggerOptions = {
  triggerAction?: 'toggle' | 'show' | 'hide' | false
}
type PopoverBodyOptions = {
  $anchorPosition?: Source<AnchorPosition | undefined>
  $anchorGap?: Source<'sm' | 'md' | 'lg' | undefined>
  popover?: 'auto' | 'hint' | 'manual'
  defaultOpen?: Source<boolean | undefined>
  autoFocus?: Partial<HTMLElement> | false
  onOpen?: (event: PopoverToggleEvent) => void
  onBeforeOpen?: (event: PopoverToggleEvent) => void
  onClose?: (event: PopoverToggleEvent) => void
  onBeforeClose?: (event: PopoverToggleEvent) => void
  onToggle?: (open: boolean, event: PopoverToggleEvent) => void
  onBeforeToggle?: (open: boolean, event: PopoverToggleEvent) => void
  // 定位翻面通知仅预留；当前参数类型占位，通知与真正事件类型尚未实现。
  onPopoverFlip?: (event: PopoverToggleEvent) => void
}
type TooltipOptions = {
  content: PivProps['children']
  $anchorPosition?: Source<AnchorPosition | undefined>
  $anchorGap?: Source<'sm' | 'md' | 'lg' | undefined>
}
type PopoverTriggerController = {
  isOpen: State<boolean>
  showPopover(): void
  hidePopover(): void
  togglePopover(options?: { force?: boolean }): void
}

// 正文端同样提供这些完整方法；它是独立角色，不是触发端的子类型。
type PopoverBodyController = {
  isOpen: State<boolean>
  showPopover(): void
  hidePopover(): void
  togglePopover(options?: { force?: boolean }): void
}

type PopoverController = {
  trigger: PopoverTriggerController
  body: PopoverBodyController
  isOpen: State<boolean>
  showPopover: PopoverTriggerController['showPopover']
  hidePopover: PopoverBodyController['hidePopover']
  togglePopover: PopoverTriggerController['togglePopover']
}

type PopoverPlugins = {
  trigger: PluginResult<PopoverTriggerController>
  body: PluginResult<PopoverBodyController>
}

// 返回值：{ plugins: PopoverPlugins, controller: PopoverController }
```

`PopoverToggleEvent` 保留当前原生事件的 `oldState`、`newState` 和 `preventDefault()` 能力，类型归新 Popover 领域。返回对象的 `plugins` 是两端原始能力结果集合；`controller: PopoverController` 的 `trigger`、`body` 分别与能力结果的 `.controller` 引用相等，并共享原来的 `isOpen`。整体 `showPopover`、`hidePopover`、`togglePopover` 分别直接引用触发端显示、正文端关闭、触发端切换方法，严格保持函数引用相等，不包装转发。方法直接调用，不写 `?.()`；Controller 完整不等于元素已经可操作。阶段 B 的 Tooltip Controller 保留 `isOpen`、`showPopover`、`hidePopover`，当前不为它增改接口。

| API                           | 固定含义                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createPopoverPlugins(...)`   | 返回 `{ plugins, controller }`；`plugins` 保留两端原始能力结果，`controller` 为两端控制入口及快捷引用；每次调用的两端独立于其他组。输入配置使用 trigger／body                                    |
| `trigger` 配置                | 只表达触发节点特性；默认点击切换，保留 show／hide／toggle 动作选择；false 仍建立锚定，但不注入按钮的原生 target 关联及 dialog／expanded 语义。键盘使用实际按钮语义，不能再加一套导致双触发的处理 |
| `body.$anchorPosition`        | `'top' \| 'right' \| 'bottom' \| 'left'`，默认 top，空间不足时由浏览器原生翻向；这是 body 定位特性，不放到 trigger 或工具层                                                                      |
| `body.$anchorGap`             | `'sm' \| 'md' \| 'lg'`，默认 md；指定锚点到实际 body 的间距档位，实际距离由 `popover.style.ts` 映射，不包含箭头绘制语义                                                                          |
| `body.popover`、`defaultOpen` | 原生模式默认 auto；defaultOpen 是默认 false 的 Source，只对首次挂载初始化读取完成值一次，后续来源变化不持续控制显隐，不增加缺端队列或重试策略                                                    |
| `body.autoFocus`              | 接受实际 DOM 或既有 createDomRef 的 Partial<HTMLElement> 引用；目标须在 body 范围内且可聚焦，省略时选择 body 内首个可聚焦元素；false 不设置默认聚焦；不接组件 Controller 或 Component 类型       |
| body 的事件配置               | 原生前／后事件各先调用通用 Toggle 回调，再调用同方向的 Open／Close 专用回调；先按原生事实写入打开状态再分发后置回调，取消打开不能报告成功                                                        |
| `onPopoverFlip`               | 表达定位翻面，不是开关切换；本轮只保留预留声明，不触发，方向事件类型后续确定                                                                                                                     |
| 两端的 Controller             | 经 `controller.trigger`／`controller.body` 访问，提供 `isOpen`、`showPopover`、`hidePopover`、`togglePopover`，操作同一组 body；整体快捷操作只引用现有函数                                       |
| `tooltip({ content, ... })`   | 自身目的的一元能力；内容在本节点配置，内部承担附属 body 与配对。默认优先上方，位置／间距可复用 body 的同名配置                                                                                   |

配对的必要事实归 Popover 领域：同次组合的两端使用本组原生身份与锚名，不能靠 DOM 祖先或全局默认浮层推测对象。原生触发属性、body 的 `popover` 属性和事件声明优先沿现有 Props 链完成；程序操作使用已构建的控制入口和异步元素引用。

本组打开事实只维护一份，两端读取同一份原生状态，不各建 State 再用 Effect 相互复制。声明监听与资源沿现有作用域清理；不增加单宿主守卫、重复角色拒绝、引用去重、调用计数或全局活跃组管理器。重复输入按基础解析的自然行为执行，不为此扩建协议。

`defaultOpen` 保留 body 的一次默认打开用途；原生 beforetoggle 取消后保持关闭，不自动重试。缺端、不同挂载时机、卸载重挂与慢 DOM 不另立“安全关闭／重新连接／请求排队”的保证；沿原生语义、首次 DOM 的现有边界和上述 TODO 如实记录。不能为了旧生命周期断言全绿而补回用户已暂缓的换源或 Task 机制。

打开状态以 body 的原生 `:popover-open`／toggle 为事实来源。Escape、点击外部和程序关闭都更新同一状态；程序打开不能伪造布尔状态，也不能在被取消时留下 aria-expanded=true。

本次焦点裁决只增加 body 的初始目标选择。`autoFocus` 可传实际元素或 `createDomRef` 的原生元素引用；后者的 Partial 类型不代表 Controller，运行时沿原生节点身份取得实际目标。指定目标须在本组 body 范围内，body 自身已经可聚焦时也可指定；省略时查找 body 内首个可聚焦元素，跳过 disabled、hidden、inert 等不可用项，无候选不强行聚焦 body；false 禁用这份默认聚焦声明，供 Tooltip 保持阅读焦点。

`autofocus` 是由能力作用域持有的原生焦点声明：每次打开前先恢复上一选择的原属性，再按当前目标和内容建立标记并排除冲突；正常开关或取消不撤销声明，能力退出时恢复原属性。浏览器在实际打开时执行聚焦，声明仍存在不表示 Plugin 主动调用 focus，取消也不移动焦点；不再要求事件分发后立即恢复，不增加计时器、常驻监听或全局焦点栈。关闭只调用原生关闭，`hidePopover()` 无参数，`togglePopover({ force })` 只选择开关方向，焦点恢复完全交给浏览器，不额外执行 trigger.focus()。

`resolveFocusTarget(body, requested)` 独立负责将输入解析成 body 范围内的实际元素，当前只支持 DOM 引用；未指定时由 `findFirstFocusableElement(body)` 查找首项，临时属性交给 `preparePopoverAutoFocus`。Controller／Component 输入支持仍为本 Plan 的 TODO，未来只增强同一解析函数，后续焦点流程和调用方式保持，不在本轮新增共享 DOM 入口，也不改变生命周期未实现状态。

关闭模式仍按原生 auto／hint／manual 处理，manual 不新增外部点击关闭；不同组隔离不取消 auto 模式自身的原生互斥。Tooltip 使用 hint 模式与 autoFocus:false，避免提示出现时改变当前焦点；关闭仍完全遵循浏览器原生行为。

Tooltip 保留现有真实用途：hover／键盘焦点显示、Escape 退出、从宿主跨到提示正文继续阅读，以及当前 150ms 离开关闭与取消计时。内容清空时在常规内容来源 Effect 中清计时并请求关闭，再移除同一附属 body；不能依赖移出 document 派发 toggle 更新状态。数字 0 是有效内容，JSX／Source 更新不能重建错误的宿主身份或冻结旧值。无需为 Tooltip 设计可见关闭按钮；交互表单等复杂用途使用 Popover body。

Tooltip 内部 body 使用原生 hint 模式及 `role="tooltip"`，宿主保持描述关系；不能套用普通 Popover 的点击切换或 dialog 宣告而造成双触发。它复用同一配对、显隐与 body 定位职责，自身仍负责阅读触发和 aria 描述。宿主已有 id／aria 及调用者的声明优先级保持，不强行覆盖。

#### Popover 开关过程

本轮在全局图 L 至 N 的 Popover 正文事件接线处接收原生显隐请求和宿主实际过渡，向 UIKit 消费者交付状态通知与该次过程的通知。业务样式决定是否以及怎样过渡，Popover 负责观测实际宿主。现有 Controller 操作继续返回 FNKit TaskResult，生命周期回调只接收一个 context 对象并返回 void，继承 [On 系列约定](../../../ai-rules/rules/Code-回调写法.md)。

```ts
createPopoverPlugins({
  body: {
    onOpenStart({ transaction }) {
      transaction.onEnd(({ transaction }) => 确认打开完成(transaction))
      transaction.onCancel(({ transaction }) => 清理打开资源(transaction))
    },
    onToggle({ open }) {
      同步开关提示(open)
    },
  },
})
```

- 原生 Before 通知保留分方向与通用入口。方向通知收 `{ event }`，通用通知 `onBeforeToggle` 和 `onToggle` 收 `{ open, event }`。Before 延续浏览器原生的同步取消能力，实际状态和 `isOpen` 仍由原生显隐事实决定。
- 过程通知使用 `onOpenStart`、`onOpenEnd`、`onCloseStart`、`onCloseEnd` 和 `onCancel`，都收 `{ transaction }`。每段有独立的 `PopoverTransition`，提供本段 `direction: 'open' | 'close'` 及 `onEnd(listener)`、`onCancel(listener)`，订阅回调也收单一 context。订阅在存活期登记，终结时释放；终结后的新登记不回放。过程普通完成或取消只通知一次。各通知和订阅回调返回 void，Popover 不等待业务。
- 上一段已经开始且反向切换实际成立时，先结束旧过程并通知 Cancel，再交付新过程的 Start。旧过程不再派发 End。Before 拒绝或浏览器没有产生显隐变化时，不开始新过程，也不取消仍有效的原过程。期间没有进入 Start 的待启动过渡，若被替换或取消，不派发 Cancel。整个协议无 from，过程对象只表达自身方向和终结结果。
- 宿主进入活动过渡时发 Start。显隐已生效但没有实际过渡时，以同一 transaction 依序发 Start 和 End，包含零时长和样式禁用过渡的场景。作用域释放时停止观测，已开始且未终结的过程以 Cancel 收尾。

#### 默认开关动画

用户要求 Popover 的零配置用法自带完整的开关过程，外部只可通过 `$animation` 调整 `$duration` 与 `$easing`。Popover 内部定义淡入、淡出和原生关闭后的留层。调用者省略配置即可使用默认动画，也可只覆盖一项。

```ts
createPopoverPlugins()
createPopoverPlugins({
  body: {
    $animation: { $duration: 200 },
    onOpenStart({ transaction }) {
      transaction.onCancel(() => 清理打开资源())
    },
  },
})
```

默认时长为 160 毫秒，缓动为 `ease`，开关使用同一组设置。实际时长为零时，在原生显隐确认后依次发 Start 和 End，无需创建动画或留层。系统要求减少动态效果时同样按即时显隐处理。关键帧留在内部，淡入、淡出以宿主本来的不透明度为可见端点。

Popover 样式让原生显隐在同一次样式变化中启动透明度与 `display`、`overlay` 离散过渡。淡入起点由 `@starting-style` 给出，淡出期间浏览器保留正文和顶层位置，结束后自动释放。如此避免原生关闭后的异步 `toggle` 再另起一个视觉时钟。私有 CSS 属性承载两项配置，系统减少动态效果与零时长直接由同一套样式决定。业务布局、背景和材料仍由宿主样式承担。[原生浮层进出过渡](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/animate-to-from-top-layer)

实际显隐确认后，先终结上一段，再取得本段内置 CSS 过渡的原生完成信号。打开观察透明度，关闭观察透明度及本次留层；无实际过渡直接结束。只在配置过程回调时观察，检查的是 Popover 自己声明的固定属性，旧的属性清单与前后快照均退出。浏览器负责在视觉上反向，事务只处理一次 End 或 Cancel。Before 阻止显隐时保持原过程。回调保持单 context 和 void，订阅保持 transaction 身份，终态逐一交付并报告回调异常。[Web Animations 完成信号](https://drafts.csswg.org/web-animations-1/#the-current-finished-promise)

Chromium 实测同一任务内的打开、关闭可合并成一条原生 `toggle`。过程由确认后的宿主状态和实际过渡驱动，不能用 `toggle` 的数量推算。下一次 Before 到达时可用宿主当下状态确认上一请求，避免把已开始的过程归到后一请求。

**低优先级 TODO。** `onProgress` 需要持续采样，参数和节奏后续讨论。本轮不建立逐帧观测。定位翻面通知、DOM 就绪 Task、外部 RuleDetail 验收继续独立处理。

##### 接管位置与实施顺序

```text
src/components/plugins/kits/Popover/
  popover.ts【更新】公开 context 契约、原生状态接线和过程接入
  popover-transition.ts【新增】定义默认视觉过程并维护该次事务及终态
  popover.style.ts【更新】在原生关闭后保留本次淡出所需的显示与顶层位置
  SPEC.md【更新】当前可用事件及其含义
  popover.browser.test.tsx【更新】用真实宿主 CSS 验证过程
src/components/kits/SelectInput/SelectInput.tsx【更新】消费原生关闭状态
```

1. 接入正文事件与过程对象，验证真实宿主的多属性、延迟及反向，不给所有 Popover 配置默认动画。
2. 将状态回调统一成单参数 context。现有 `onOpen`／`onClose` 的原生状态通知由 `onToggle` 的方向分支接管，旧名退出；SelectInput 仍在原生关闭时结束编辑并调用自身的公开 `onClose`。
3. 验证正常双向 Start/End、订阅所获对象身份、结束只派发一次、反向及再次反向的 Cancel、Before 拒绝、无过渡、delay、子元素与多属性、卸载终止。原生 toggle、焦点、SelectInput 与 Tooltip 走既有回归。类型检查、单元测试、真实浏览器套件和构建通过后交付，写入 [实施详情](../../agents/运行方案/261106_Popover与Tooltip能力重构_实施详情.md)。

本轮验收零配置真实淡入、关闭后仍可见并保有顶层位置、单项时长及缓动覆盖分别保留另一项默认值、零时长即时完成、反向、中断、Before 拒绝、独立动画、终态异常及卸载。旧方向配置、keyframes 和 delay 退出公开协议，现役 SPEC 与包出口统一写法。Task 就绪 TODO 保留独立。

分工按 [任务分工](../../../ai-rules/rules/Agent-任务分工.md) 执行。独立约束检查者复核 Plan 后，实施者实现公开契约和原生接线，测试执行者从实际过渡验证，主 Agent 对照原始裁决独立验收。

### 2. 功能样式与实际宿主的责任

旧问题的实际来源是 `PopoverSurface.tsx` 中 `.PopoverGeometry`、`.PopoverPaint` 两层附属 DOM，配合独立 fixed 定位和尺寸容器重新绘制整块背板；内容却在 Surface 本身排版。当前没有应删除的同名 JS Geometry 文件，不能虚构 JS 测量层的迁移清单。

接管办法是直接定位调用者提供的实际 body，退出独立背板盒子的结构归属，而不是要求 Plugin 重新画出完整外观。Card 自己的背景和正文随同一宿主移动；Plugin 不再生成 Geometry／Paint 或负责其装饰。原生 top layer 可使用定位所需的 `position`，不通过滚动时关闭、清空内容或冻结锚点位置掩盖功能错误。

| 责任                               | 负责位置                            | 本轮边界                                                                               |
| ---------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| 原生显隐、目标关联、状态与事件     | `popover.ts` 的两端 core            | 模式、点击／键盘、取消打开及焦点语义沿原生功能处理                                     |
| 浮层功能定位                       | `popover.style.ts` 与角色声明       | 仅定位所需的 position、inset、margin、anchor 关联、position-area、fallback、锚点隐藏等 |
| 内容、尺寸与排版                   | 实际 Card／业务组件及其 `.style.ts` | Plugin 不设置 padding、宽高约束、内容排布或普通 overflow 裁剪策略                      |
| 背景、边框、圆角、阴影、箭头等绘制 | 实际宿主或业务样式的自身职责        | 不进入 Popover Plugin，不新增外观组件，也不另开本 Plan 的外观待办                      |

| 技术                                      | 在本 Plan 负责什么                                          | 依据与边界                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 原生 Popover API                          | top layer、显隐、外部点击／Escape 和原生事件                | [Chrome Popover](https://developer.chrome.com/blog/introducing-popover-api)；不用另一套 Portal／render 管理器 |
| `anchor-name`、`position-anchor`          | 将本组 body 关联实际 trigger；不同组的名称不串联            | [Chrome Anchor Positioning](https://developer.chrome.com/docs/css-ui/anchor-positioning-api)                  |
| `position-area`、`position-try-fallbacks` | 实际 body 的四向位置与空间不足翻向                          | 浏览器负责定位；不增加 scroll／resize 测量循环，也不接管宿主内容布局                                          |
| 定位所需的 inset／margin                  | 解除原生默认居中约束，由 `.style.ts` 映射 `$anchorGap` 档位 | 只为位置与锚点到 body 的间距服务，不扩成通用布局样式                                                          |
| 原生 position-visibility                  | 处理锚点滚出其滚动容器时的显示                              | 执行时验证目标 Chrome 实际支持的语法，不照抄过时拼写，不做生产兼容分支                                        |

功能验证针对实际宿主：原生打开／关闭、滚动跟随、四向定位、空间不足翻向、间距和锚点离开可见区域后的显示。沿现有浏览器测试取得证据；不再把箭头连体、材质绘制或此前的最小箭头 CSS 实验作为 Plugin 源码与交付闸门。

此前实验记录保留其历史事实，但其基于过宽职责所设的外观目标已被本次裁决覆盖。普通内容 overflow 怎样裁剪仍由实际组件决定，不能借“浮层功能”替宿主增加该策略。

### 3. 文件、函数与阶段接管

下方阶段 A 表保留已完成的接管范围；本轮实际施工以紧接其后的阶段 B 清单为准。表中 A 暂留的旧设施，现在由 B 完整接管后删除。

```text
src/components/plugins/
  tools/                         保留前置基础协议 Plan 已认可的基础协议
  kits/
    Popover/
      popover.ts                 A 新增：组合定义、两端 core 与本领域配对／显隐
      popover.style.ts           A 新增：仅实际 body 的功能定位，不绘制外观
      popover.example.tsx        A 新增：实际 Button／Card 调用，无额外组件外壳
      popover.browser.test.tsx   A 新增：成对交互、定位与锚点可见性
    tooltip/
      tooltip.tsx                B 更新：一元自身能力，复用 Popover body／显隐
      tooltip.style.ts           B 更新：提示自有单body材料，复用Popover定位
      tooltip.browser.test.tsx   B 更新：自身交互、动态内容、清理与滚动回归
```

这是一组最少载体，不为图再拆 manager、instance、geometry、paint、host 等模块。必要组事实由既有组合构建传入，不恢复已退出的全局身份注册表。

阶段 A 既有 core 的责任是：

```text
createPopoverPlugins = createInactivePlugins(
  { trigger: 触发端core, body: 正文端core },
  { controller({ trigger, body }) { return 本领域快捷引用 } },
)
  → 一次组件内调用，内部共享身份
  → 触发端声明自己的原生关联、锚点与 aria
  → 正文端声明自己的 popover、定位、事件与实际打开状态
  → 各自同步返回完整 controller
  → 调用者把角色结果交给实际 Button／Card
```

字段经 `addProps` 进入已有合并链，命令使用 `domProxy`；不为了取 DOM 再包一层内容组件。新 Plugin 直接定位实际正文宿主，布局和绘制继续由该宿主承担。方法、状态与功能定位效果分别验收，不能只改调用名称，也不能把能力接入变成外观接管。

以下是阶段 A 的接管清单，路径均以 `src/` 为根；其中暂留项目由本轮 B 清单继续接管：

| 文件与关键声明                                                                                                                                       | 阶段 A：已完成的修改与删除                                                                                                            | 接管与阶段 B 边界                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/plugins/kits/Popover/popover.ts`                                                                                                         | 新增 `createPopoverPlugins`、`popoverTriggerCore`、`popoverBodyCore` 及前述 Options／Controller／事件类型；构建两端声明和同组打开事实 | 只用既有单元／组合工具，不修改组件 Props 或 Controller 类型推导                                                                                       |
| `components/plugins/kits/Popover/popover.style.ts`                                                                                                   | 新增实际 body 的定位、间距、原生翻向和锚点可见性规则；不生成独立背板                                                                  | 不导入旧材质 Token，不设置背景、箭头、阴影、padding、尺寸或普通 overflow；旧材料只随真实旧 Tooltip 依赖保留                                           |
| `components/plugins/kits/Popover/popover.example.tsx`、`popover.browser.test.tsx`                                                                    | 用实际 Button／Card 展示和验证前述 API、默认打开、取消打开、焦点、滚动和功能定位                                                      | 外观沿实际组件或业务 `.style.ts`，不新增外观组件，不把旧私有 Paint 断言原样搬入                                                                       |
| `components/kits/Popover/Popover.tsx`                                                                                                                | 迁移后删除 `Popover` kit、`PopoverProps`、`PopoverController`、`parsePopoverVariantProps` 与自动 Button／header／body 内容编排        | 内容、禁用／加载等节点配置由调用者直接交给实际组件；显隐和关联由新 core 接管                                                                          |
| `components/kits/Popover/Popover.prop.ts`、`Popover.style.ts`                                                                                        | 删除组件专属 `popoverPropsDefinition`、`popoverVariantGroups`、`getPopoverPropsDirectorOptions` 与外壳样式                            | 不将旧 Props Director／变体壳复制到 Plugin，不保组件别名                                                                                              |
| `components/kits/Popover/Popover.example.tsx`、`Popover.test.tsx`、`Popover.browser.test.tsx`                                                        | 迁移有效 Popover 功能用途和断言后退出旧文件                                                                                           | 改验实际交互、关联和定位，不要求新 API 维持旧内容编排或外观结构                                                                                       |
| `app/example-dashboard/pages/ExampleDashboard.tsx`                                                                                                   | `popover` 项改载新能力示例，移除旧 `PopoverExample` 导入                                                                              | `popover-surface` 项暂保其真实旧 Surface 示例，B 再退出，不顺带改 Tooltip 示例                                                                        |
| `components/index.ts`（由根 `index.ts` 汇出）                                                                                                        | 删除旧 `Popover` 导出，公开新 `createPopoverPlugins` 及必要类型                                                                       | Surface、旧显隐 Controller 和材质在 A 仍有真实依赖而暂保，B 按下表退出；无现有 plugins/index.ts，不为此另造聚合层                                     |
| `Architecture.md`、`docs/guide/组件Props与Controller状态.md`、`docs/guide/组件结构查看.md`、`components/plugins/index.spec.md`                       | 跟随说明 Popover 的 Plugin 归属、各端 Controller、实际宿主 Marker 和功能样式边界，退出旧组件 ref／`.props` 描述                       | 只更新 Popover 相关现役事实，不重写其他组件契约，不把旧 Tooltip 暂留写成迁移完成                                                                      |
| `components/tools/test/组件调用与集合的类型约束.test.tsx`                                                                                            | 旧 Popover 调用改为实际组件配合 plugins 两端能力结果与 controller 的调用                                                              | 不扩张 Card／Button 泛型，不加入自动 Controller 注入                                                                                                  |
| `components/tools/ComponentIdentityMarker/ComponentIdentityMarker.browser.test.tsx`                                                                  | 迁移旧 Popover 专属场景，核对实际 Button／Card 的 ComponentIdentityMarker 与能力行为                                                  | 旧 Tooltip／Surface 场景保留；Plugin 不新增业务组件身份                                                                                               |
| `components/plugins/kits/tooltip/tooltip.browser.test.tsx`                                                                                           | 只把其中旧 Popover 独立用例迁到新能力测试，退出其对已删除 Popover 组件的导入                                                          | Tooltip 自身 hover／focus／150ms／动态内容／箭头断言不在 A 重写或删掉                                                                                 |
| `components/kits/Popover/PopoverSurface.tsx`、`.prop.ts`、`.style.ts`、`createPopoverVisibilityController.ts`                                        | A 保留：旧 Tooltip 生产仍直接依赖，不能为了清目录提前删除                                                                             | B 迁移 Tooltip 后再删除 Surface kit、Geometry／Paint DOM、`createPopoverOutline`、旧 Controller＋bindings 及旧身份计数器；新 Popover 不复用旧双层绘制 |
| `components/kits/Popover/PopoverSurface.example.tsx`、`components/kits/Page/Page.browser.test.tsx`、`components/kits/Button/Button.browser.test.tsx` | A 保留旧 Surface 演示、Surface Marker 与旧材质的有效消费                                                                              | B 随共享设施退出更新；不能把真实依赖伪装成无用代码强删                                                                                                |
| `components/plugins/kits/tooltip/tooltip.tsx`、`.style.ts` 及 Help／Label／Field 消费                                                                | A 不修改产品行为或改组装链                                                                                                            | B 复用新 body／定位与显隐能力，保留帮助入口、内容、Marker 和各自样式；更新 Help／Label 的 SPEC                                                        |

最终 `src/components/kits/Popover/` 仍须完整退出，不保转发、组件别名或兼容 Surface。**阶段 A 结束时目录内仍可能有 Tooltip 使用的共享设施，属于尚待 B 接管的实际责任，不得宣称目录已经清空。** B 完成时逐项核对生产、导出、示例和测试均无旧路径，才删除余下目录。

#### 阶段 B：本轮施工、删除与责任接管

Tooltip 是描述宿主自身的一元能力：调用者仍写 `is={tooltip({ content })}`，不接触组 id、trigger／body 或额外内容组件。`TooltipOptions` 的位置／间距采用 `$anchorPosition`、`$anchorGap`（sm／md／lg），默认 top／md；本轮用户新裁决以 md 覆盖此前保留旧 8px 的 lg 方案。Source 完成值为 null／undefined 时回落默认，使用 createState/tools 的 withDefault 保留响应更新，不镜像 State。内部按 `trigger`／`body` 配置复用 `createPopoverPlugins`，不自行复制定位、原生显隐或打开状态。

```tsx
pluginCore({ pluginOptions, addProps, domProxy }) {
  const { plugins, controller } = createPopoverPlugins({
    trigger: { triggerAction: false },
    body: {
      popover: 'hint', autoFocus: false,
      $anchorPosition: withDefault(pluginOptions.$anchorPosition, 'top'),
      $anchorGap: withDefault(pluginOptions.$anchorGap, 'md'),
    },
  })
  const body = createComponent(Piv, {
    is: plugins.body, class: 'Tooltip', htmlProps: { role: 'tooltip' },
    children: pluginOptions.content,
  }) // 构建一次；不经临时 JSX memo／children 快照，正文持续读取原 Source。
  createEffect(内容是否存在的来源, (present) => {
    if (!present) { cancelClose(); controller.hidePopover() }
  }) // 常规内容响应；不是 Show／owner 退出清理。
  addProps({ is: plugins.trigger, htmlProps: 描述此body的aria关系, on: 阅读事件 })
  createPivStructure(domProxy).insertAfter(
    <Show when={hasTooltipContent(pluginOptions.content)}>{body}</Show>,
  ) // 只接入／移除同一节点；不在分支里重新构建body或能力。
  return { isOpen: controller.isOpen, showPopover: open, hidePopover: dismiss }
}
```

这是职责伪代码，不要求新增同名 helper。`open`／`enter` 取消离开计时并显示有内容的提示；`leave` 在宿主和正文均无阅读状态时沿现有 150ms 关闭；`dismiss` 取消计时再关闭。内容变空时由常规内容来源 Effect 清计时并调用现有 hidePopover，再移除同一附属 body；Show／owner 退出只清计时，不在退出清理中提交 DOM 命令。浏览器移出 document 虽会关闭，却不保证派发 toggle，不能依赖它同步状态。数字 0 必须保留。重新有内容时接回同一 body／pair，不借此实现全库 if 复用或代理换源。共享 `isOpen` 直接取 Popover Controller，不再维护第二份状态。

| 文件／关键函数                                                                                                                                                                    | 本轮修改或删除                                                                                                                                                                                                                | 责任由谁接管、清理到什么状态                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/components/plugins/kits/Popover/popover.ts`：`PopoverTriggerOptions`、`PopoverBodyOptions`、`popoverTriggerCore`、`popoverBodyCore`、`createPopoverGroup`                    | 增加 `triggerAction:false` 与 `autoFocus:false`；修正组 anchor 名必须带 --，避免依赖按钮隐式锚定掩盖无效 CSS；hidePopover 对已就绪的实际 body 仅在原生仍打开时 hide，再从 matches 读回同一共享状态；不伪造 false 或另建 State | Popover 自己关闭不适合 Tooltip 的按钮关联／dialog／expanded 与自动聚焦；Tooltip 不剥改内部 shadowProps                     |
| `src/components/plugins/kits/tooltip/tooltip.tsx`：`TooltipOptions`、`TooltipController`、`pluginCore`、`hasTooltipContent`、`open`／`enter`／`leave`／`dismiss`                  | 用现有组合构建一次两端和实际 Piv body；保留阅读与内容更新，删除旧 VisibilityController／Surface 导入                                                                                                                          | Popover 接管定位显隐与状态，Tooltip 只负责附属内容、阅读事件、描述关系及计时清理；调用方接口保持一元能力                   |
| `src/components/plugins/kits/tooltip/tooltip.style.ts`                                                                                                                            | 退出旧 Surface Token 依赖，把提示所需暗色材料直接声明在同一 `.Tooltip` body 上                                                                                                                                                | Tooltip 自有背景、文字、边框、圆角、padding、尺寸与阴影；定位间距由 Popover 管，不新建 Geometry／Paint／Outline 或箭头系统 |
| `src/components/plugins/kits/tooltip/tooltip.browser.test.tsx`                                                                                                                    | 旧 helper／Surface 组装改实际能力；退出私有双绘制层与箭头字符串断言                                                                                                                                                           | 验真实 hover／focus／跨提示阅读／Escape／150ms取消、动态内容0及空值、同body复用、焦点不被提示夺走和滚动整体                |
| `src/components/index.ts`                                                                                                                                                         | 删除旧 Surface、旧材料与 VisibilityController 出口                                                                                                                                                                            | 现有 `createPopoverPlugins`、tooltip 及必要类型保留，不增兼容别名                                                          |
| `src/app/example-dashboard/pages/ExampleDashboard.tsx`、`thumbnail/ExampleThumbnailCapture.thumbnail.tsx`                                                                         | 删除旧 surface 示例入口、导入与专用截图分支                                                                                                                                                                                   | 现有 Popover／Tooltip 示例承担真实展示，不保只能指向已删除设施的入口                                                       |
| `src/components/kits/Page/Page.browser.test.tsx`、`Button/Button.browser.test.tsx`                                                                                                | Page 旧 Surface Marker 样本改真实 Help；Button 删除旧材料导入                                                                                                                                                                 | 检查实际组件身份与现有按钮效果，不把 Tooltip 伪造成新 Kit                                                                  |
| `src/components/kits/Popover/` 的 `PopoverSurface.tsx`、`PopoverSurface.prop.ts`、`PopoverSurface.style.ts`、`PopoverSurface.example.tsx`、`createPopoverVisibilityController.ts` | 全部删除，旧目录退出                                                                                                                                                                                                          | 原生功能由新 Popover、提示材料／阅读由 Tooltip、内容由实际 Piv 接管；没有转发壳或兼容出口                                  |
| `Architecture.md`、`src/components/plugins/index.spec.md`、Popover／Help／Label 的相邻 SPEC 及真实旧引用说明                                                                      | 只跟随说明 Tooltip 新依赖及旧设施退出                                                                                                                                                                                         | Help／Label／Field 生产已通过 tooltip 使用，无旧直接依赖则不改产品；保留 Marker、业务内容和样式所有权                      |

旧目录删除前，以仓库检索核对生产、公开出口、示例、截图入口、测试与现役说明全部不再依赖旧设施；历史记录不改写。Tooltip 内容外观由 Tooltip 自己承担，不回填到 Popover 功能样式。

Task 的慢 DOM／晚执行缺口仍是已接受的未实现项；这不能免除当前可正常挂载场景的真实交互回归，也不能成为本轮重启异步任务系统或给消费者增加等待适配的理由。生命周期 Start／End／Progress／Cancel、if 全库复用与 Promise 完整协议仍按原文边界留后续。

### 4. 验收及外部交接

| 场景           | 必须看见的结果                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 点击与键盘     | 正常按钮仅切换一次；Escape／外部点击和程序操作同步原生状态与 aria，取消打开有效                                          |
| 多组与节点边界 | 两组不串联，两端控制同组 body；按已有首次 DOM 边界报告结果，不虚构缺端队列、重复宿主守卫或换源保证                       |
| 页面及嵌套滚动 | 锚点可见时实际 body 跟随；不生成独立背板使其与内容脱节；锚点离开滚动区域时按原生锚点可见性处理                           |
| 视口四边       | 实际 body 按配置定位，空间不足时使用原生翻向；不以箭头或装饰绘制作为功能通过条件                                         |
| 动态内容       | 调用者更新正文后，实际宿主照常排版并继续定位；Plugin 不测量、缓存或接管内容尺寸                                          |
| Tooltip        | A 保持现有能力不被 Popover 迁移破坏；B 验证 hover／focus、跨提示阅读、Escape、延时取消、内容为空及数字 0，不增加关闭按钮 |
| 职责与优先级   | Plugin 不接管宿主的内容布局、绘制或普通 overflow；调用者原 Props／id／aria 的优先关系不被隐式覆盖                        |
| 旧设施退出     | A 退出旧 Popover 组件及其消费；B 接管 Tooltip 仍需的共享设施后，才达到旧目录、双绘制层和旧函数全部退出                   |

几何与截图读取可以用于功能验收，不能移进生产作为定位补偿。阶段 B 退出旧 `.PopoverPaint`、Geometry、Outline／border-shape 私有结构断言，改验同一实际 body 的内容、材料、几何与阅读交互，不为保留旧断言重造背板或箭头系统。

阶段 A 在 UIKit 内验证新组合示例、实际 body 的功能定位、组件结构和样式边界，以及旧 Tooltip／Help／Label 没有因共享依赖退出而被破坏；不把回归测试当成已经实施 Tooltip 重构。本轮阶段 B 验证提示新链路与旧设施完整退出。各阶段完成相应类型检查、构建和适当单元／浏览器验证，记录实际浏览器与观察结果，不宣称控制台没有未检查的警告。已明确接受的 Task／首次节点缺口单独标记，不为取得全绿引入新机制。

原始问题的最终验收仍包括 bcoin StrategyView 的 RuleDetail。外部接口和实际源码状态在获得对应项目授权后核实，不能把历史旧接口记录直接当成当前事实，也不能只构建 UIKit 就称真实页通过。届时完成适配与关联构建，在真实页打开 Tooltip，滚动、切换指标／天数，检查实际宿主内容与定位没有独立背板脱节；不把业务外观重新归给 Plugin。当前明确保留“RuleDetail 验收未完成”，不删除该验收、不靠 UIKit 旧别名绕过，也不自行修改外部项目。

## A/B 阶段的历史实施顺序与外部验收

本节保存 A/B 阶段的施工范围，当前 Popover 过程施工以 [Popover 开关过程](#popover-开关过程) 为准。

1. 依据本轮 Tooltip 授权核对阶段 B 清单与既有基础 API；保护已有 Git 修改，不自动暂存或回退。约束检查者先交付适用约束，执行者必须遵从 [Plan 撰写](../how-to-write-plan.md) 与 [Plan 落地](../how-to-apply-plan.md) 的实际要求，不能只记录已读。
2. 阶段 A 已交付 `createPopoverPlugins`、双端能力与实际宿主迁移；本轮只补阶段 B 必需的两个 false 选项，确认普通点击／键盘、原生状态、取消打开、焦点与 defaultOpen 不回归。
3. 复用已有功能定位样式，在 Tooltip 实际单body上验证滚动、翻向、`$anchorGap` 与锚点可见性。`$` 表示明确指定系统选择，间距只接受 sm／md／lg 关键字，不要求调用者提供像素。背景、内容布局、阴影和箭头绘制不进入 Popover 功能 Plugin；Tooltip 的提示材料由自身 .style.ts 承担，不因此新增箭头系统或绘制实验。
4. 完成 Tooltip 单元内部配对、同body复用、阅读交互和材料接管，按 B 清单迁移剩余旧消费者。界面节点和样式归属须按现有 ComponentIdentityMarker、真实依赖与样式责任检查，不能只凭类型通过。
5. 按本轮已获许可实施阶段 B：迁移 Tooltip 的 body／显隐／定位，保留 hover、focus、150ms 关闭、跨区域阅读和动态内容；接管全部旧共享消费后删除旧 Surface、Controller、Geometry／Paint、旧出口和余下目录。
6. 完成各阶段 UIKit 验收后，在获得外部项目授权时适配并验证真实 RuleDetail。任一部分未完成均如实标出，不将 UIKit 通过当成最终页完成。

此前箭头和材质实验不再构成本 Plan 的技术未决或施工阻断，也不另列为 Plugin 的后续任务。Task、Promise 兼容与 if 复用分别沿已链接 TODO，当前不实现；外部 RuleDetail 修改与运行权限仍需另获授权。

本轮 Plan 由独立约束检查者前置核对，修订稿还须由独立实例对照原始需求、最新功能边界与实际清单复核并完整复述；写入本节不代表已审查通过。实施详情按仓库规则记录实际修改、删除接管、测试和受阻项，历史[实施记录](../../agents/run/261105-inactive-plugin-pilot/实施记录.md)不能替代本次证据。只有本 Plan 的功能、全部旧设施退出和真实消费者验证都完成，才可标为全部完成。
