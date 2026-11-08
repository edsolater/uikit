# Popover 与 Tooltip 能力重构

## 状态、前置与授权

本文是 Popover／Tooltip 能力改造的唯一现役 Plan。基础协议由 [is 声明解析与 Plugin 调用协议统一](261105_is声明解析与Plugin调用协议统一.md) 接管；现有 `domProxy` 与单元／组合构建工具已经可用，本文不重新设计这些工具。

**用户本轮已明确授权先实施 UIKit 的 Popover，Tooltip 能力重构留待后续。** 用户随后进一步明确：Popover 只承担功能；样式只服务浮层定位、锚点关联和显隐，不承担内容布局或绘制。这条新边界覆盖此前把背景、箭头和材质归给 Plugin 的方案，不是将这些工作另列为 Plugin 未完成项。

打开／关闭过程生命周期目前只记录方案，尚未实施。当前原生状态回调与后文尚未实现的 Start／End／Progress／Cancel 目标分别说明；Popover 讨论和相应实现尚未结束前，不转入 Tooltip 施工。原有三篇 TODO 全部保留，不以生命周期小节替代 Task 机制。

| 阶段 | 当前状态与交付 |
| --- | --- |
| A：Popover | 本轮获准；交付实际 Button／Card 的双端能力、原生显隐与定位、Popover 消费迁移和 UIKit 验证 |
| B：Tooltip | 后续尚未施工；在 A 的能力上迁移提示交互，并退出旧 Tooltip 仍依赖的 Surface／Controller／样式 |
| 真实 RuleDetail | 保留最终验收，当前没有外部项目修改授权，不随 UIKit 施工自动启动 |

本文引用前置 Plan 唯一维护的[全局运行图](261105_is声明解析与Plugin调用协议统一.md#全局运行图与本-plan-定位)：接收 I 的基础协议交付及 J 的用户明确许可，负责 L 至 N 的双端能力、原生浮层功能及 UIKit／RuleDetail 验证。其样式责任按本次用户裁决收敛为功能定位，不再把整体外观绘制当作本环节交付。前置负责 A 至 I；本 Plan 不反向重做其 API，也不另建总图。

执行前读取[仓库入口](../../AGENTS.md)、[Plan 落地](../how-to-apply-plan.md)、[任务分工](../../../ai-rules/rules/Agent-任务分工.md)、[代码修改](../../../ai-rules/rules/Code-代码修改.md)。沿用前置已获用户认可的完整 Controller、能力结果和内部组身份，不恢复 usePlugin、外传组 ID、Host、组件 Controller 注入或自动 ref 推导。

## 接收的基础协议

`defineInactivePlugin({ name, pluginCore })` 只定义可调用能力；在组件内调用 inactivePlugin 才执行一次 core，同步返回完整 `{ plugin, controller }`。`defineInactivePlugins` 每次组合调用内部创建共享身份并复用单元构造，各角色结果已经是 PluginResult，交给 `is` 时不再调用。不同组独立，调用方不传组 id。

`is` 接受真实 Plugin 或携带有效 `plugin` 字段的对象；Piv 只展开已构建的 ShadowProps，不重跑 core。字段、原生事件与子能力直接经 `addProps` 提交；实际 DOM 操作复用当前 `domProxy`，不恢复已退出的 `withDom`、`usePlugin` 或节点执行 core 协议。业务正文由实际组件提供，Plugin 不承担业务界面中的独立节点身份。

当前代理只缓存首次 DOM，本轮保持这一妥协。以下能力尚未实现，不能重新引入 State／Source 换源机制，也不能因它们未完成而强迫每个消费者添加等待、重试或生命周期桥：

- [if 显隐复用 DOM](../todo/261107_if显隐复用DOM.md)：当前不能假定条件重建已复用原对象。
- [Task 与 TaskResult](../todo/261107_Task与TaskResult异步操作.md)：慢 DOM、浮层尚未就绪及等待后晚执行的问题仍按已知缺口记录，不在本 Plan 实现任务队列、abort 或失效控制。
- [PromiseResultProxy 兼容 Promise 协议](../todo/261107_PromiseResultProxy兼容Promise协议.md)：当前可等待不等于完整 Promise，也不伪造操作成功 boolean。

当前源码已有成对 Popover 能力，旧 Surface 与 Tooltip 组装链仍暂留。新生命周期是后续目标，不能据已有原生状态事件宣布它已实现；旧共享设施也不能在 Tooltip 接管前强删。

## 调用、效果与职责

### 1. 调用 API 与预期交互

下面是 Popover 的调用 API；当前详细契约由相邻 [Popover SPEC](../../src/components/plugins/kits/Popover/SPEC.md) 维护，实施状态以实际代码和验证为准。

```tsx
function PopoverExample() {
  const { popoverTrigger, popoverBody } = popover({
    popoverBody: {
      $anchorPosition: 'top',
      $anchorGap: 'md',
    },
  })

  return <>
    <Button is={popoverTrigger}>打开说明</Button>
    <Card is={popoverBody}>
      <Text>调用者提供正文，复杂内容仍写在这里。</Text>
      <Button on={{ click() { popoverBody.controller.hidePopover() } }}>
        关闭说明
      </Button>
    </Card>
  </>
}

// 阶段 B 的目标，本轮不施工：Tooltip 描述自身，不要求另一端或关闭按钮。
<Text is={tooltip({ content: <Text>补充说明</Text> })}>正文</Text>
```

Popover 是成对能力，不是负责生成 Button、标题或正文的内容组件。Button／Card／Piv 等实际节点保持界面层次；Card 或调用者的 `.style.ts` 负责内容布局和外观。Plugin 只让这个实际 body 成为可定位、可显隐的原生浮层，不生成背板或新的外观组件。`popover` 由 `defineInactivePlugins` 定义，调用一次在内部配对两端；用户不传共享 id，也不获取一个全组 Controller。

以下代码块记录当前已实现的 API。现有 `onOpen`／`onClose` 是原生 toggle 后的状态通知，不是 CSS 过程开始或结束；目标生命周期在下一小节单独定义。`Source`、`State` 和 `PivProps` 使用现有 UIKit 类型，不另造同义类型。

```ts
type AnchorPosition = 'top' | 'right' | 'bottom' | 'left'
type PopoverTriggerOptions = {
  triggerAction?: 'toggle' | 'show' | 'hide'
}
type PopoverBodyOptions = {
  $anchorPosition?: Source<AnchorPosition | undefined>
  $anchorGap?: Source<'sm' | 'md' | 'lg' | undefined>
  popover?: 'auto' | 'hint' | 'manual'
  defaultOpen?: Source<boolean | undefined>
  autoFocus?: Partial<HTMLElement>
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
  anchorPosition?: Source<AnchorPosition | undefined>
  triggerMargin?: Source<string | undefined>
}
type PopoverNodeController = {
  isOpen: State<boolean>
  showPopover(): void
  hidePopover(): void
  togglePopover(options?: { force?: boolean }): void
}
```

`PopoverToggleEvent` 保留当前原生事件的 `oldState`、`newState` 和 `preventDefault()` 能力，类型归新 Popover 领域。两端各自结果返回完整的 `PopoverNodeController`，不能再额外返回全组 Controller。方法直接调用，不写 `?.()`；Controller 完整不等于元素已经可操作。阶段 B 的 Tooltip Controller 保留 `isOpen`、`showPopover`、`hidePopover`，当前不为它增改接口。

| API | 固定含义 |
| --- | --- |
| `popover(...)` | 返回 `{ popoverTrigger, popoverBody }`，两项各为 PluginResult；每次调用的两端独立于其他组 |
| `popoverTrigger` 配置 | 只表达触发节点特性；默认点击切换，保留 show／hide／toggle 动作选择。键盘使用实际按钮语义，不能再加一套导致双触发的处理 |
| `popoverBody.$anchorPosition` | `'top' \| 'right' \| 'bottom' \| 'left'`，默认 bottom；这是 body 定位特性，不放到 trigger 或工具层 |
| `popoverBody.$anchorGap` | `'sm' \| 'md' \| 'lg'`，默认 md；指定锚点到实际 body 的间距档位，实际距离由 `popover.style.ts` 映射，不包含箭头绘制语义 |
| `popoverBody.popover`、`defaultOpen` | 原生模式默认 auto；defaultOpen 是默认 false 的 Source，只对首次挂载初始化读取完成值一次，后续来源变化不持续控制显隐，不增加缺端队列或重试策略 |
| `popoverBody.autoFocus` | 接受实际 DOM 或既有 createDomRef 的 Partial<HTMLElement> 引用；目标须在 body 范围内且可聚焦，省略时选择 body 内首个可聚焦元素；不接组件 Controller 或 Component 类型 |
| body 的事件配置 | 原生前／后事件各先调用通用 Toggle 回调，再调用同方向的 Open／Close 专用回调；先按原生事实写入打开状态再分发后置回调，取消打开不能报告成功 |
| `onPopoverFlip` | 表达定位翻面，不是开关切换；本轮只保留预留声明，不触发，方向事件类型后续确定 |
| 两端的 Controller | 各属实际节点，提供 `isOpen`、`showPopover`、`hidePopover`、`togglePopover`，操作同一组 body；经各自结果 `.controller` 访问 |
| `tooltip({ content, ... })` | 自身目的的一元能力；内容在本节点配置，内部承担附属 body 与配对。默认优先上方，位置／间距可复用 body 的同名配置 |

配对的必要事实归 Popover 领域：同次组合的两端使用本组原生身份与锚名，不能靠 DOM 祖先或全局默认浮层推测对象。原生触发属性、body 的 `popover` 属性和事件声明优先沿现有 Props 链完成；程序操作使用已构建的控制入口和异步元素引用。

本组打开事实只维护一份，两端读取同一份原生状态，不各建 State 再用 Effect 相互复制。声明监听与资源沿现有作用域清理；不增加单宿主守卫、重复角色拒绝、引用去重、调用计数或全局活跃组管理器。重复输入按基础解析的自然行为执行，不为此扩建协议。

`defaultOpen` 保留 body 的一次默认打开用途；原生 beforetoggle 取消后保持关闭，不自动重试。缺端、不同挂载时机、卸载重挂与慢 DOM 不另立“安全关闭／重新连接／请求排队”的保证；沿原生语义、首次 DOM 的现有边界和上述 TODO 如实记录。不能为了旧生命周期断言全绿而补回用户已暂缓的换源或 Task 机制。

打开状态以 body 的原生 `:popover-open`／toggle 为事实来源。Escape、点击外部和程序关闭都更新同一状态；程序打开不能伪造布尔状态，也不能在被取消时留下 aria-expanded=true。

本次焦点裁决只增加 body 的初始目标选择。`autoFocus` 可传实际元素或 `createDomRef` 的原生元素引用；后者的 Partial 类型不代表 Controller，运行时沿原生节点身份取得实际目标。指定目标须在本组 body 范围内，body 自身已经可聚焦时也可指定；省略时查找 body 内首个可聚焦元素，跳过 disabled、hidden、inert 等不可用项，无候选不强行聚焦 body。

`autofocus` 是由能力作用域持有的原生焦点声明：每次打开前先恢复上一选择的原属性，再按当前目标和内容建立标记并排除冲突；正常开关或取消不撤销声明，能力退出时恢复原属性。浏览器在实际打开时执行聚焦，声明仍存在不表示 Plugin 主动调用 focus，取消也不移动焦点；不再要求事件分发后立即恢复，不增加计时器、常驻监听或全局焦点栈。关闭只调用原生关闭，`hidePopover()` 无参数，`togglePopover({ force })` 只选择开关方向，焦点恢复完全交给浏览器，不额外执行 trigger.focus()。

`resolveFocusTarget(body, requested)` 独立负责将输入解析成 body 范围内的实际元素，当前只支持 DOM 引用；未指定时由 `findFirstFocusableElement(body)` 查找首项，临时属性交给 `preparePopoverAutoFocus`。Controller／Component 输入支持仍为本 Plan 的 TODO，未来只增强同一解析函数，后续焦点流程和调用方式保持，不在本轮新增共享 DOM 入口，也不改变生命周期未实现状态。

关闭模式仍按原生 auto／hint／manual 处理，manual 不新增外部点击关闭；不同组隔离不取消 auto 模式自身的原生互斥。旧 Tooltip 的焦点与关闭 API 不随本次 Popover 修改扩张施工。

Tooltip 保留现有真实用途：hover／键盘焦点显示、Escape 退出、从宿主跨到提示正文继续阅读，以及当前 150ms 离开关闭与取消计时。内容清空时关闭并移除附属 body、释放定时器；数字 0 是有效内容，JSX／Source 更新不能重建错误的宿主身份或冻结旧值。无需为 Tooltip 设计可见关闭按钮；交互表单等复杂用途使用 Popover body。

Tooltip 内部 body 使用原生 hint 模式及 `role="tooltip"`，宿主保持描述关系；不能套用普通 Popover 的点击切换或 dialog 宣告而造成双触发。它复用同一配对、显隐与 body 定位职责，自身仍负责阅读触发和 aria 描述。宿主已有 id／aria 及调用者的声明优先级保持，不强行覆盖。

#### 后续生命周期：已定名称，尚未实现

用户已认可打开的 Before／Start／End 三阶段、关闭的对称阶段，以及 Progress、Cancel。当前 `PopoverBodyOptions` 已有 `onBeforeOpen`、`onBeforeClose`、`onToggle`；Start／End／Progress／Cancel 仍是尚未实现的目标字段。下表区分它们要表达的阶段：

| 目标回调 | 表达什么 |
| --- | --- |
| `onBeforeOpen`／`onBeforeClose` | 对应过程开始前的通知；能否拒绝仍遵守实际原生事件的取消能力 |
| `onOpenStart`／`onCloseStart` | 对应过程已经开始，不等于在等待或刚收到请求 |
| `onOpenEnd`／`onCloseEnd` | 对应过程完成，不把原生开关状态变化直接当作视觉过程完成 |
| `onProgress` | 已开始过程中的进度通知；参数与通知节奏尚未确定 |
| `onCancel` | 已开始的过程被中断；Before 阶段拒绝、尚未开始，不算 Cancel |
| `onToggle` | 保留不分打开／关闭方向的原生状态变化快捷回调，不承担逐帧进度或动画完成语义 |

现有 `onBeforeToggle` 保留。目标调用关系用伪代码表达为：

```text
正常打开：BeforeOpen → OpenStart → 运行过程 → OpenEnd
开始后中断：BeforeOpen → OpenStart → 运行过程 → Cancel
开始前拒绝：BeforeOpen 拒绝 → 不进入 Start，不派发 End／Cancel
关闭过程对称。
```

目标配置的简短伪代码如下，Start／End 的具体参数仍待确定，不能当作当前已支持的接口：

```ts
popover({ popoverBody: {
  /** 打开过程已开始，不是刚收到请求。 */
  onOpenStart() { 记录打开开始() },
  /** 打开过程已完成，不是原生状态刚变为 open。 */
  onOpenEnd() { 记录打开完成() },
  /** 一处处理打开与关闭的原生状态变化，不表示动画进度。 */
  onToggle(open) { 更新状态提示(open) },
} })
```

`onCancel` 是已开始过程被中断后的通知，不等同于 [TaskResult.abort](../todo/261107_Task与TaskResult异步操作.md) 取消异步任务的操作；本节不因此实现 Task 机制。

这不是浏览器事件的逐项映射，也不承诺 Progress 的次数。当前 `onOpen`／`onClose` 将退出旧命名，由新生命周期及保留的 `onToggle` 接管；不能简单改名为 Start，就把原生状态通知伪装成 CSS 已开始。具体映射需随下面的未决项明确后再施工，不保留一组同义旧别名。

#### CSS 底层事实与实现边界

原生显隐状态与宿主提供的 CSS 过渡是两条事实线：

```text
原生状态线：beforetoggle → 实际开关状态变化 → toggle 通知
CSS 过渡线：transitionrun → 等待 delay → transitionstart → transitionend
                                               ↘ transitioncancel
```

两条线不是一一对应的固定总顺序。`toggle` 不是 `transitionend`；CSS 可以没有过渡，也可以同时运行多个属性。依据 [CSS Transitions 事件规范](https://www.w3.org/TR/css-transitions-2/#transition-events)：

| 底层事件 | 对接时必须区分的事实 |
| --- | --- |
| `transitionrun` | 过渡已产生，可能还在 delay；不能当作活动过渡已经开始 |
| `transitionstart` | 进入活动阶段；与 run 区分，elapsedTime 不计正 delay |
| `transitionend` | 一个属性的该次过渡正常结束，不天然代表整个 Popover 已完成 |
| `transitioncancel` | 过渡中断而不正常结束；也可能发生在 delay，不能不加语义区分地上报目标 Cancel |

过渡按属性产生事件，子节点事件也会冒泡，需要区分宿主、属性和伪元素。未生成过渡时，例如零时长且无延迟，不会自动补出 Start／End。浏览器没有 `beforeEnd` 或 `transitionprogress` 事件，不能把它们写成现成设施。

top layer 的进退过渡涉及 `@starting-style`、离散 `display` 过渡和 `overlay` 的退出保留；这些原生机制见 [Chrome top-layer 过渡说明](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/animate-to-from-top-layer)。宿主或业务样式决定是否配置及怎样绘制过渡，Popover Plugin 只感知其过程，不因此新增 opacity、transform、材质或内容布局规则。

若后续选择 CSS animation，则区分 `animationstart`／`animationend`／`animationcancel` 及迭代事件，不能与 TransitionEvent 混称；其事件携带 animationName，参见 [CSS Animations 事件](https://www.w3.org/TR/css-animations-1/#animation-events)。当前没有选择它替代 transition，也不增加双实现兼容层。

#### 按回调需要观测过程

过程观测按实际配置的回调启用，不增加 `progressEnabled` 之类的独立开关，也不预设统一动画引擎。原生 toggle、`isOpen` 与 aria 同步仍由必要监听负责，不受以下额外观测条件影响。

Start／End 使用 `onOpenStart`、`onOpenEnd`、`onCloseStart`、`onCloseEnd`，不另设 Popping 同义名称；Before、Progress、Cancel 和 Toggle 保留各自职责。

| 配置情况 | 需要的额外工作 |
| --- | --- |
| 没有过程回调 | 不启动额外过程观测 |
| 只有 Start／End 等阶段回调 | 只接入所需阶段通知，不依赖进度采样 |
| 配置 `onProgress` | 过程运行期间按需采样并通知；采样方式与节奏仍待确定 |

```text
过程开始 → 若配置 onProgress，开始进度采样
过程结束或中断 → 停止该过程的观测和采样
所属作用域退出 → 释放尚在运行的观测和采样
```

同一底层过程信息供多个已配置回调使用时共享，不为每个回调重复观测。没有 `onProgress` 时不逐帧运行、不启动 rAF，也不持续读取 Web Animations 状态；这不妨碍独立使用 Start／End。具体采样机制、多属性如何汇总完成以及事件参数仍按下方未决处理。

#### 未决、落点与验收

以下只保留会决定协议的未决，不先补造执行机制：

- Start 的过程起点怎样与真实 CSS 事件对接；多个属性的结束如何汇总为一次 End。
- 没有有效过渡、零时长或减少动态效果时，怎样表达过程完成。
- 开始后反向切换与中断如何归属前后两个过程；进度范围、通知节奏及各回调具体参数类型。

`onProgress` 没有现成 transition 事件可直接透传；配置该回调时可以按需采样，具体方式尚待确定。这些未决没有裁决前，不能宣称新生命周期已可完整施工。

后续落点限定在 `popover.ts` 的 `PopoverBodyOptions`／`popoverBodyCore` 事件协议、相邻 SPEC 和 `popover.browser.test.tsx`：确定映射后补真实阶段说明与最小调用例子，迁移当前 `onOpen`／`onClose` 消费并退出旧名字；SPEC 继续区分已实现接口与目标接口。注释须写清 Begin、完成、中断和拒绝，不用“打开后”掩盖状态通知与过程完成的差别。

验收覆盖正常打开／关闭、Before 拒绝不产生 Cancel、开始后中断、delay、子事件与多属性、无过渡及反向切换，并核对 `onToggle` 仍只报告原生状态变化。这里只记录后续验证目的，不在本次文档修订中修改测试或实现 Task。

另验收：未配置 `onProgress` 时不进行进度采样，Start／End 可以独立工作；配置 `onProgress` 时仅在过程运行中采样，结束、中断或作用域退出后停止。

### 2. 功能样式与实际宿主的责任

旧问题的实际来源是 `PopoverSurface.tsx` 中 `.PopoverGeometry`、`.PopoverPaint` 两层附属 DOM，配合独立 fixed 定位和尺寸容器重新绘制整块背板；内容却在 Surface 本身排版。当前没有应删除的同名 JS Geometry 文件，不能虚构 JS 测量层的迁移清单。

接管办法是直接定位调用者提供的实际 body，退出独立背板盒子的结构归属，而不是要求 Plugin 重新画出完整外观。Card 自己的背景和正文随同一宿主移动；Plugin 不再生成 Geometry／Paint 或负责其装饰。原生 top layer 可使用定位所需的 `position`，不通过滚动时关闭、清空内容或冻结锚点位置掩盖功能错误。

| 责任 | 负责位置 | 本轮边界 |
| --- | --- | --- |
| 原生显隐、目标关联、状态与事件 | `popover.ts` 的两端 core | 模式、点击／键盘、取消打开及焦点语义沿原生功能处理 |
| 浮层功能定位 | `popover.style.ts` 与角色声明 | 仅定位所需的 position、inset、margin、anchor 关联、position-area、fallback、锚点隐藏等 |
| 内容、尺寸与排版 | 实际 Card／业务组件及其 `.style.ts` | Plugin 不设置 padding、宽高约束、内容排布或普通 overflow 裁剪策略 |
| 背景、边框、圆角、阴影、箭头等绘制 | 实际宿主或业务样式的自身职责 | 不进入 Popover Plugin，不新增外观组件，也不另开本 Plan 的外观待办 |

| 技术 | 在本 Plan 负责什么 | 依据与边界 |
| --- | --- | --- |
| 原生 Popover API | top layer、显隐、外部点击／Escape 和原生事件 | [Chrome Popover](https://developer.chrome.com/blog/introducing-popover-api)；不用另一套 Portal／render 管理器 |
| `anchor-name`、`position-anchor` | 将本组 body 关联实际 trigger；不同组的名称不串联 | [Chrome Anchor Positioning](https://developer.chrome.com/docs/css-ui/anchor-positioning-api) |
| `position-area`、`position-try-fallbacks` | 实际 body 的四向位置与空间不足翻向 | 浏览器负责定位；不增加 scroll／resize 测量循环，也不接管宿主内容布局 |
| 定位所需的 inset／margin | 解除原生默认居中约束，由 `.style.ts` 映射 `$anchorGap` 档位 | 只为位置与锚点到 body 的间距服务，不扩成通用布局样式 |
| 原生 position-visibility | 处理锚点滚出其滚动容器时的显示 | 执行时验证目标 Chrome 实际支持的语法，不照抄过时拼写，不做生产兼容分支 |

功能验证针对实际宿主：原生打开／关闭、滚动跟随、四向定位、空间不足翻向、间距和锚点离开可见区域后的显示。沿现有浏览器测试取得证据；不再把箭头连体、材质绘制或此前的最小箭头 CSS 实验作为 Plugin 源码与交付闸门。

此前实验记录保留其历史事实，但其基于过宽职责所设的外观目标已被本次裁决覆盖。普通内容 overflow 怎样裁剪仍由实际组件决定，不能借“浮层功能”替宿主增加该策略。

### 3. 文件、函数与阶段接管

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
      tooltip.style.ts           B 后续：按 Tooltip 自身职责核对，A 不改产品
      tooltip.browser.test.tsx   B 更新：自身交互、动态内容、清理与滚动回归
```

这是一组最少载体，不为图再拆 manager、instance、geometry、paint、host 等模块。必要的组事实归 `popover.ts`；若需要按内部身份共享数据，复用组合提供的身份，不扩大为所有插件共享的注册中心。

本轮关键 core 的责任是：

```text
popover = defineInactivePlugins({ popoverTrigger: 触发端core, popoverBody: 正文端core })
  → 一次组件内调用，内部共享身份
  → 触发端声明自己的原生关联、锚点与 aria
  → 正文端声明自己的 popover、定位、事件与实际打开状态
  → 各自同步返回完整 controller
  → 调用者把角色结果交给实际 Button／Card
```

字段经 `addProps` 进入已有合并链，命令使用 `domProxy`；不为了取 DOM 再包一层内容组件。新 Plugin 直接定位实际正文宿主，布局和绘制继续由该宿主承担。方法、状态与功能定位效果分别验收，不能只改调用名称，也不能把能力接入变成外观接管。

以下是本次真实调用盘点形成的施工清单，路径均以 `src/` 为根：

| 文件与关键声明 | 阶段 A：本轮改什么、删什么 | 接管与阶段 B 边界 |
| --- | --- | --- |
| `components/plugins/kits/Popover/popover.ts` | 新增 `popover`、`popoverTriggerCore`、`popoverBodyCore` 及前述 Options／Controller／事件类型；构建两端声明和同组打开事实 | 只用既有单元／组合工具，不修改组件 Props 或 Controller 类型推导 |
| `components/plugins/kits/Popover/popover.style.ts` | 新增实际 body 的定位、间距、原生翻向和锚点可见性规则；不生成独立背板 | 不导入旧材质 Token，不设置背景、箭头、阴影、padding、尺寸或普通 overflow；旧材料只随真实旧 Tooltip 依赖保留 |
| `components/plugins/kits/Popover/popover.example.tsx`、`popover.browser.test.tsx` | 用实际 Button／Card 展示和验证前述 API、默认打开、取消打开、焦点、滚动和功能定位 | 外观沿实际组件或业务 `.style.ts`，不新增外观组件，不把旧私有 Paint 断言原样搬入 |
| `components/kits/Popover/Popover.tsx` | 迁移后删除 `Popover` kit、`PopoverProps`、`PopoverController`、`parsePopoverVariantProps` 与自动 Button／header／body 内容编排 | 内容、禁用／加载等节点配置由调用者直接交给实际组件；显隐和关联由新 core 接管 |
| `components/kits/Popover/Popover.prop.ts`、`Popover.style.ts` | 删除组件专属 `popoverPropsDefinition`、`popoverVariantGroups`、`getPopoverPropsDirectorOptions` 与外壳样式 | 不将旧 Props Director／变体壳复制到 Plugin，不保组件别名 |
| `components/kits/Popover/Popover.example.tsx`、`Popover.test.tsx`、`Popover.browser.test.tsx` | 迁移有效 Popover 功能用途和断言后退出旧文件 | 改验实际交互、关联和定位，不要求新 API 维持旧内容编排或外观结构 |
| `app/example-dashboard/pages/ExampleDashboard.tsx` | `popover` 项改载新能力示例，移除旧 `PopoverExample` 导入 | `popover-surface` 项暂保其真实旧 Surface 示例，B 再退出，不顺带改 Tooltip 示例 |
| `components/index.ts`（由根 `index.ts` 汇出） | 删除旧 `Popover` 导出，公开新 `popover` 及必要类型 | Surface、旧显隐 Controller 和材质仍有真实依赖，本轮保留；无现有 plugins/index.ts，不为此另造聚合层 |
| `Architecture.md`、`docs/guide/组件Props与Controller状态.md`、`docs/guide/组件结构查看.md`、`components/plugins/index.spec.md` | 跟随说明 Popover 的 Plugin 归属、各端 Controller、实际宿主 Marker 和功能样式边界，退出旧组件 ref／`.props` 描述 | 只更新 Popover 相关现役事实，不重写其他组件契约，不把旧 Tooltip 暂留写成迁移完成 |
| `components/tools/test/组件调用与集合的类型约束.test.tsx` | 旧 Popover 调用改为实际组件配合 PluginResult 的调用 | 不扩张 Card／Button 泛型，不加入自动 Controller 注入 |
| `components/tools/KitMarker/KitMarker.browser.test.tsx` | 迁移旧 Popover 专属场景，核对实际 Button／Card 的 KitMarker 与能力行为 | 旧 Tooltip／Surface 场景保留；Plugin 不新增业务组件身份 |
| `components/plugins/kits/tooltip/tooltip.browser.test.tsx` | 只把其中旧 Popover 独立用例迁到新能力测试，退出其对已删除 Popover 组件的导入 | Tooltip 自身 hover／focus／150ms／动态内容／箭头断言不在 A 重写或删掉 |
| `components/kits/Popover/PopoverSurface.tsx`、`.prop.ts`、`.style.ts`、`createPopoverVisibilityController.ts` | A 保留：旧 Tooltip 生产仍直接依赖，不能为了清目录提前删除 | B 迁移 Tooltip 后再删除 Surface kit、Geometry／Paint DOM、`createPopoverOutline`、旧 Controller＋bindings 及旧身份计数器；新 Popover 不复用旧双层绘制 |
| `components/kits/Popover/PopoverSurface.example.tsx`、`components/kits/Page/Page.browser.test.tsx`、`components/kits/Button/Button.browser.test.tsx` | A 保留旧 Surface 演示、Surface Marker 与旧材质的有效消费 | B 随共享设施退出更新；不能把真实依赖伪装成无用代码强删 |
| `components/plugins/kits/tooltip/tooltip.tsx`、`.style.ts` 及 Help／Label／Field 消费 | A 不修改产品行为或改组装链 | B 复用新 body／定位与显隐能力，保留帮助入口、内容、Marker 和各自样式；更新 Help／Label 的 SPEC |

最终 `src/components/kits/Popover/` 仍须完整退出，不保转发、组件别名或兼容 Surface。**阶段 A 结束时目录内仍可能有 Tooltip 使用的共享设施，属于尚待 B 接管的实际责任，不得宣称目录已经清空。** B 完成时逐项核对生产、导出、示例和测试均无旧路径，才删除余下目录。

### 4. 验收及外部交接

| 场景 | 必须看见的结果 |
| --- | --- |
| 点击与键盘 | 正常按钮仅切换一次；Escape／外部点击和程序操作同步原生状态与 aria，取消打开有效 |
| 多组与节点边界 | 两组不串联，两端控制同组 body；按已有首次 DOM 边界报告结果，不虚构缺端队列、重复宿主守卫或换源保证 |
| 页面及嵌套滚动 | 锚点可见时实际 body 跟随；不生成独立背板使其与内容脱节；锚点离开滚动区域时按原生锚点可见性处理 |
| 视口四边 | 实际 body 按配置定位，空间不足时使用原生翻向；不以箭头或装饰绘制作为功能通过条件 |
| 动态内容 | 调用者更新正文后，实际宿主照常排版并继续定位；Plugin 不测量、缓存或接管内容尺寸 |
| Tooltip | A 保持现有能力不被 Popover 迁移破坏；B 验证 hover／focus、跨提示阅读、Escape、延时取消、内容为空及数字 0，不增加关闭按钮 |
| 职责与优先级 | Plugin 不接管宿主的内容布局、绘制或普通 overflow；调用者原 Props／id／aria 的优先关系不被隐式覆盖 |
| 旧设施退出 | A 退出旧 Popover 组件及其消费；B 接管 Tooltip 仍需的共享设施后，才达到旧目录、双绘制层和旧函数全部退出 |

几何与截图读取可以用于功能验收，不能移进生产作为定位补偿。新 Popover 测试不继承依赖 `.PopoverPaint`／border-shape 字符串的绘制断言；旧 Tooltip 自身仍使用它们的测试，在本阶段保留，不借重构 Popover 顺带删改。

阶段 A 在 UIKit 内验证新组合示例、实际 body 的功能定位、组件结构和样式边界，以及旧 Tooltip／Help／Label 没有因共享依赖退出而被破坏；不把回归测试当成已经实施 Tooltip 重构。阶段 B 再验提示新链路。各阶段完成相应类型检查、构建和适当单元／浏览器验证，记录实际浏览器与观察结果，不宣称控制台没有未检查的警告。已明确接受的 Task／首次节点缺口单独标记，不为取得全绿引入新机制。

原始问题的最终验收仍包括 bcoin StrategyView 的 RuleDetail。外部接口和实际源码状态在获得对应项目授权后核实，不能把历史旧接口记录直接当成当前事实，也不能只构建 UIKit 就称真实页通过。届时完成适配与关联构建，在真实页打开 Tooltip，滚动、切换指标／天数，检查实际宿主内容与定位没有独立背板脱节；不把业务外观重新归给 Plugin。当前明确保留“RuleDetail 验收未完成”，不删除该验收、不靠 UIKit 旧别名绕过，也不自行修改外部项目。

## 实施顺序、未决与完成判定

1. 依据本次 Popover 授权核对前述实际清单与基础 API；保护已有 Git 修改，不自动暂存或回退。约束检查者先交付适用约束，执行者必须遵从 [Plan 撰写](../how-to-write-plan.md) 与 [Plan 落地](../how-to-apply-plan.md) 的实际要求，不能只记录已读。
2. 在独立审查通过后完成阶段 A 的 `popover`、两端 core、完整 Controller、示例、导出及调用迁移，退出旧 Popover 内容组件；复用原生属性和事件，验证点击／键盘只触发一次、原生状态、取消打开、焦点与 defaultOpen。没有新的 Tooltip 施工许可时，不迁其产品组装链。
3. 实现仅服务功能的定位样式，并在实际宿主上验证滚动、翻向、`$anchorGap` 与锚点可见性。`$` 表示明确指定系统选择，间距只接受 sm／md／lg 关键字，不要求调用者提供像素。背景、内容布局、阴影和箭头绘制不进入 Plugin，也不以额外绘制实验作为功能实施前置。
4. 交付阶段 A 的协议、消费迁移和功能验证，注明旧 Tooltip 仍依赖的文件。界面节点和样式归属须按现有 KitMarker、真实依赖与样式责任检查，不能只凭类型通过。
5. 用户随后允许阶段 B 时，迁移 Tooltip 的 body／显隐／定位，保留 hover、focus、150ms 关闭、跨区域阅读和动态内容；接管全部旧共享消费后删除旧 Surface、Controller、Geometry／Paint、旧出口和余下目录。
6. 完成各阶段 UIKit 验收后，在获得外部项目授权时适配并验证真实 RuleDetail。任一部分未完成均如实标出，不将 UIKit 通过当成最终页完成。

此前箭头和材质实验不再构成本 Plan 的技术未决或施工阻断，也不另列为 Plugin 的后续任务。Task、Promise 兼容与 if 复用分别沿已链接 TODO，当前不实现；外部 RuleDetail 修改与运行权限仍需另获授权。

本轮 Plan 由独立约束检查者前置核对，修订稿还须由独立实例对照原始需求、最新功能边界与实际清单复核并完整复述；写入本节不代表已审查通过。实施详情按仓库规则记录实际修改、删除接管、测试和受阻项，历史[实施记录](../../agents/run/261105-inactive-plugin-pilot/实施记录.md)不能替代本次证据。只有本 Plan 的功能、全部旧设施退出和真实消费者验证都完成，才可标为全部完成。
