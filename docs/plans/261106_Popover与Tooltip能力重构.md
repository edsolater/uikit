# Popover 与 Tooltip 能力重构

## 状态、前置与授权

本轮只拆分和更新 Plan，不修改源码、不运行浏览器实验。本文是 Popover／Tooltip 产品改造的唯一现役 Plan，当前锁定待许可，不是已完成实现。原合并 Plan 的基础协议职责由 [is 声明解析与 Plugin 调用协议统一](261105_is声明解析与Plugin调用协议统一.md) 接管，本文保留浮层 API、效果、旧设施退出与真实 RuleDetail 验收。

**只有用户亲自检验前置基础协议 Plan、明确认可并允许开始本文后，才能施工。** 前置测试或审查通过、本文获认可、换程序接手、收到泛称“按 Plan 执行”或用户未回复，都不能代替这一许可。未获许可时只交付文档，不启动本文的生产改造或浏览器实验。

本文引用前置 Plan 唯一维护的[全局运行图](261105_is声明解析与Plugin调用协议统一.md#全局运行图与本-plan-定位)：接收 I 的基础协议交付及 J 的用户明确许可，负责 L 至 N 的双端能力、原生整体浮层及 UIKit／RuleDetail 效果验证。前置负责 A 至 I；本 Plan 不反向重做其 API，也不另建总图。

执行前读取[仓库入口](../../AGENTS.md)、[Plan 落地](../how-to-apply-plan.md)、[任务分工](../../../ai-rules/rules/Agent-任务分工.md)、[代码修改](../../../ai-rules/rules/Code-代码修改.md)。沿用前置已获用户认可的完整 Controller、能力结果和内部组身份，不恢复 usePlugin、外传组 ID、Host、组件 Controller 注入或自动 ref 推导。

## 接收的基础协议

inactivePlugin 配置时执行 pluginCore，准备完整 Controller 并收集声明；返回普通 `{ plugin, controller }`。Plugin 只在创建前向 Piv 提交统一 ShadowProps，不接收 element 或节点 onCleanup；真实节点接入与清理由声明 domRef 承担，children 由直接 Props 提供。Popover／Tooltip 的监听、原生元素绑定和附属结构都在 domRef 接入；不能将旧节点执行 core 协议带回本 Plan。

当前源码仍有旧 Popover／Surface 和 Tooltip 组装链。本文以下内容是未来目标，不是现实现事实；旧几何层与 Controller 的接管完成前不能声明迁移已交付。

## 调用、效果与职责

### 1. 调用 API 与预期交互

下面是建立在前置基础协议 Plan 目标上的未来 API；不能拿它当当前源码示例直接运行。

```tsx
function PopoverExample() {
  const { popoverTrigger, popoverBody } = popover({
    popoverBody: {
      anchorPosition: 'top',
      triggerMargin: '4px',
    },
  })

  return <>
    <Button is={popoverTrigger}>打开说明</Button>
    <Card is={popoverBody}>
      <Text>调用者提供正文，复杂内容仍写在这里。</Text>
      <Button on={{ click: () => popoverBody.controller.hidePopover() }}>
        关闭说明
      </Button>
    </Card>
  </>
}

// Tooltip 描述自身，不要求调用者声明另一端，也不放关闭按钮。
<Text is={tooltip({ content: <Text>补充说明</Text> })}>正文</Text>
```

Popover 是成对能力，不是负责生成 Button、标题或正文的内容组件。Button／Card／Piv 等实际节点保持界面层次。`popover` 由 `defineInactivePlugins` 定义，调用一次在内部配对两端；用户不传共享 id，也不获取一个全组 Controller。

以下字段名称也是 API 边界，不能自行换成 `action`、`mode` 或旧 `placement`。`Source`、`StateView` 和 `PivProps` 使用现有 UIKit 类型，不另造同义类型。

```ts
type AnchorPosition = 'top' | 'right' | 'bottom' | 'left'
type PopoverTriggerOptions = {
  triggerAction?: 'toggle' | 'show' | 'hide'
}
type PopoverBodyOptions = {
  anchorPosition?: Source<AnchorPosition | undefined>
  triggerMargin?: Source<string | undefined>
  popover?: 'auto' | 'hint' | 'manual'
  defaultOpen?: boolean
  onToggle?: (open: boolean, event: PopoverToggleEvent) => void
  onBeforeToggle?: (open: boolean, event: PopoverToggleEvent) => void
}
type TooltipOptions = {
  content: PivProps['children']
  anchorPosition?: Source<AnchorPosition | undefined>
  triggerMargin?: Source<string | undefined>
}
type PopoverNodeController = {
  isOpen: StateView<boolean>
  showPopover(): void
  hidePopover(restoreFocus?: boolean): void
  togglePopover(force?: boolean): void
}
```

`PopoverToggleEvent` 保留当前原生事件的 `oldState`、`newState` 和 `preventDefault()` 能力，类型归新 Popover 领域。两端各自结果都返回完整的 `PopoverNodeController`，不能再额外创建全组 Controller；Tooltip 自身的完整 Controller 保留 `isOpen`、`showPopover`、`hidePopover`。这些方法直接调用，不写 `?.()`；缺端时由方法内部按下文规则处理，不使方法缺席。

| API | 固定含义 |
| --- | --- |
| `popover(...)` | 返回 `{ popoverTrigger, popoverBody }`，两项各为 PluginResult；每次调用的两端独立于其他组 |
| `popoverTrigger` 配置 | 只表达触发节点特性；默认点击切换，保留 show／hide／toggle 动作选择。键盘使用实际按钮语义，不能再加一套导致双触发的处理 |
| `popoverBody.anchorPosition` | `'top' \| 'right' \| 'bottom' \| 'left'`，默认 bottom；这是 body 定位特性，不放到 trigger 或工具层 |
| `popoverBody.triggerMargin` | CSS 长度，默认 4px；表示锚点边缘与箭头尖端的间距。箭头高度与 body 边缘间距必须按同一定义计算 |
| `popoverBody.popover`、`defaultOpen` | 原生模式默认 auto；defaultOpen 默认 false，并按下文两端首次齐备规则初始化 |
| body 的事件配置 | 保留真实 `onToggle`／`onBeforeToggle` 含义，事件时读取最新回调；取消原生打开后 isOpen 不能报告成功 |
| 两端的 Controller | 各属实际节点，提供 `isOpen`、`showPopover`、`hidePopover`、`togglePopover`，操作同一组 body；经各自结果 `.controller` 访问 |
| `tooltip({ content, ... })` | 自身目的的一元能力；内容在本节点配置，内部承担附属 body 与配对。默认优先上方，位置／间距可复用 body 的同名配置 |

配对与状态必须有唯一负责位置：Popover 领域按内部组身份配合两端，不能靠 DOM 祖先、全局默认浮层或“最后挂载节点”。一组只允许一个存活 trigger 和一个 body。允许两端挂载顺序不同；缺端时保持关闭，操作不排队、不定时重试。缺端卸载时关闭并释放关联，重挂后重新连接；双方都退出后释放该组信息。

本组打开事实只维护一份，两端完整 Controller 读取同一事实；不得各建一份 isOpen 再用 Effect 相互复制。需要跨两端存活的状态和引用按前置基础协议 Plan 核实的生命周期准备，不能随第一端退出就冻结，也不能把内部节点引用可能缺席变成公开方法可选。真实节点的监听、挂载引用仍分别清理，不加全局活跃组管理器。

`defaultOpen` 是 body 的一次初始化策略：body 先挂而 trigger 未出现时等待，不执行一次失败的打开就丢弃初始化；两端第一次均可用、原生 popover 属性已绑定后，若 defaultOpen=true 则尝试打开一次。使用现有节点就绪回调检查，不轮询。若 beforetoggle 取消此次打开，保持关闭，不自动重试。已初始化的 body 遇到 trigger 卸载再重挂时保持关闭；body 自身卸载后重新安装，才按新一次 body 安装的 defaultOpen 再初始化。缺端期间的普通 show／toggle 调用仍不排队，不能与这条初始化规则混淆。

打开状态以 body 的原生 `:popover-open`／toggle 为事实来源。Escape、点击外部和程序关闭都更新同一状态；需要恢复焦点时回到本组有效 trigger，Tooltip 的悬停关闭不抢焦点。程序打开不能伪造布尔状态，也不能在被取消时留下 aria-expanded=true。

关闭遵守所选原生模式：auto／hint 使用相应原生关闭行为，manual 不擅自增加外部点击关闭。不同组不串联指配对及操作对象正确，不取消 auto 模式本身的原生互斥语义。`hidePopover()` 默认允许恢复有效 trigger 的焦点，传 false 时不抢焦点；Tooltip 的悬停关闭使用不恢复焦点的路径。

Tooltip 保留现有真实用途：hover／键盘焦点显示、Escape 退出、从宿主跨到提示正文继续阅读，以及当前 150ms 离开关闭与取消计时。内容清空时关闭并移除附属 body、释放定时器；数字 0 是有效内容，JSX／Source 更新不能重建错误的宿主身份或冻结旧值。无需为 Tooltip 设计可见关闭按钮；交互表单等复杂用途使用 Popover body。

Tooltip 内部 body 使用原生 hint 模式及 `role="tooltip"`，宿主保持描述关系；不能套用普通 Popover 的点击切换或 dialog 宣告而造成双触发。它复用同一配对、显隐与 body 定位职责，自身仍负责阅读触发和 aria 描述。宿主已有 id／aria 及调用者的声明优先级保持，不强行覆盖。

### 2. 整体效果、技术与验证门槛

旧问题的实际来源是 `PopoverSurface.tsx` 中 `.PopoverGeometry`、`.PopoverPaint` 两层附属 DOM，配合独立 fixed 定位和尺寸容器重新绘制整块背板；内容却在 Surface 本身排版。当前没有应删除的同名 JS Geometry 文件，不能虚构 JS 测量层的迁移清单。

目标是一个原生 popover 宿主承载内容、背景、边框和阴影；箭头是这个宿主的装饰。删除重新定位整块背板的 Geometry／Paint 链。`position: fixed` 本身并不是错误：原生 top layer 可以使用它，问题是让背板和内容由独立盒子分别定位。不能通过滚动时关闭、清空内容或冻结锚点位置掩盖脱节。

| 技术 | 在本 Plan 负责什么 | 依据与边界 |
| --- | --- | --- |
| 原生 Popover API | top layer、显隐、外部点击／Escape 和原生事件 | [Chrome Popover](https://developer.chrome.com/blog/introducing-popover-api)；不用另一套 Portal／render 管理器 |
| `anchor-name`、`position-anchor` | 将本组 body 关联实际 trigger；不同组的名称不串联 | [Chrome Anchor Positioning](https://developer.chrome.com/docs/css-ui/anchor-positioning-api) |
| `position-area`、`position-try-fallbacks` | 整个 body 的四向位置与空间不足翻向 | 浏览器负责定位；不增加 scroll／resize 测量循环 |
| `anchor()` 的 inset 用法 | 箭头沿锚点中心和边缘定位 | 不等于可把 anchor() 任意塞进 shape() |
| anchored container queries | 读取 body 实际采用的 fallback，让箭头同步换边 | [Chrome 143 文档](https://developer.chrome.com/blog/anchored-container-queries) |
| 原生 position-visibility | 处理锚点滚出其滚动容器时的显示 | 执行时验证目标 Chrome 实际支持的语法，不照抄过时拼写，不做生产兼容分支 |
| `border-shape`／局部伪元素 | 原生轮廓与箭头绘制候选 | [Chrome 147](https://developer.chrome.com/blog/new-in-chrome-147) 已发布 border-shape，但不证明边缘箭头所有要求已自动解决 |

**本 Plan 先做一个最小浏览器验证，再重写生产样式。** 使用直接绘制背景的单 body 和只绘箭头的伪元素，先验证滚动、翻向和边缘平移。实验写到仓库 `agents/run/`，记录实际 Chrome 版本、使用的 CSS、截图及测量结果；本次编写 Plan 没有运行该实验。

通过条件包括：箭头尖端沿垂直方向浮层的锚点水平中心、沿水平方向浮层的锚点垂直中心，误差不超过 1 CSS px；body 避边平移后箭头仍连接主体，圆角处不脱落；背景、渐变、边框和阴影没有可见断缝。不能只测中心位置而不测连体。

[Chrome 示例](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-atoms/position-aware-tooltips) 已说明定位和翻向；并未证明极边缘处箭头基底与主体始终连体。现行规范对 `anchor()` 的位置使用有限制，`shape(... anchor(center) ...)` 对应的[CSSWG 提案](https://github.com/w3c/csswg-drafts/issues/13716)仍在设计，不能把提案当成当前可用实现。

若最小原生结构未同时通过这些条件，停止受影响的生产改造，交回具体失败截图与方案取舍。不得静默改成固定居中箭头、删除箭头、降低精度，或恢复旧 Geometry／Paint、JS 几何补偿。视觉要求保持，尚未验证的技术选择不能伪装成已完成。

### 3. 文件归属与删除接管

```text
src/components/plugins/
  tools/                         保留前置基础协议 Plan 已认可的基础协议
  kits/
    Popover/
      popover.ts                 组合定义、两端 core 与本领域配对／显隐
      popover.style.ts           body 整体定位、材质、箭头；不再独立绘制整块背板
      popover.example.tsx        实际 Button／Card 调用，不提供额外组件外壳
      popover.browser.test.tsx   成对交互、整体视觉与生命周期
    tooltip/
      tooltip.tsx                一元自身能力，复用 Popover 的绑定／body／显隐职责
      tooltip.style.ts           只选择紧凑提示材料，不另写定位和箭头
      tooltip.browser.test.tsx   自身交互、动态内容、清理及滚动回归
```

这是一组最少关键载体，不要求为了图再拆 manager、instance、geometry、paint、host 等模块。配对所需的内部信息归 Popover 领域；若需要按内部对象身份查两端，仅使用本领域必要的弱引用记录，生命周期随两端解除，不能扩大为所有插件共享的注册中心。

| 旧位置／责任 | 本 Plan 怎么处理 | 新负责位置 |
| --- | --- | --- |
| `kits/Popover/Popover.tsx` 及 `.prop.ts`、`.style.ts` | 删除组件、自动创建 Button、title／header／body 内容编排、组件 Controller 与 Props Director 外壳 | 调用方实际 Button／Card 内容；`plugins/kits/Popover/popover.ts` 只增加能力 |
| `PopoverSurface.tsx`、`.prop.ts` | 删除 Surface 组件协议与额外 Kit 身份，移除 Geometry／Paint DOM | 使用方 body 宿主；Tooltip 的附属 Piv 使用相同 body 能力 |
| `PopoverSurface.style.ts` | 材质 Token 迁移；定位／轮廓重写，删除旧两层规则、`createPopoverOutline` 及其方向派生 | `popover.style.ts`，保持需要的公开 Token 名称，不保旧路径别名 |
| `createPopoverVisibilityController.ts` | 原生事件与取消／焦点语义接管后删除旧 Controller＋bindings 双 domRef 协议 | 配置时准备的完整控制面、声明 domRef 接入及本领域配对／显隐职责；DOM 字符串身份如有需要先查 FNKit `IdGenerator`，不复制旧计数器 |
| `tooltip.tsx`、`.style.ts` | 保自身交互与动态内容，退出独立 Surface／旧 Controller 组装链 | 复用本 Plan 同一绑定、body 和定位能力；附属结构继续用 Piv `createPivStructure` |
| 旧 Popover／Surface Examples、测试、Dashboard 入口、根出口 | 迁移有效行为与示例后删除旧主体和路径；无锚点旧演示不能成为恢复旧外壳的理由 | 新组合 Kit 示例／测试，公开 `popover`、Tooltip 与需要的材质类型 |
| Help、Label、Field 等现有消费 | 保当前帮助入口、问号、内容、Marker 和各自样式职责 | 仅沿 tooltip 新能力接入；不得给业务组件再加一套定位逻辑 |
| KitMarker、按钮主题等跨组件测试 | 移除对旧 Surface Kit／私有 Paint 的依赖，保实际节点边界、材料与可操作效果 | 实际 body 宿主及公开 Token；不能为旧断言保留空组件 |

最终 `src/components/kits/Popover/` 源码目录须完整退出，不保旧导出、转发、组件别名或兼容 Surface。执行时以真实消费者盘点补齐具体文件，不能只改新示例而留旧生产入口。

### 4. 验收及外部交接

| 场景 | 必须看见的结果 |
| --- | --- |
| 点击与键盘 | 正常按钮仅切换一次；Escape／外部点击和程序操作同步原生状态与 aria，取消打开有效 |
| 多组与节点生命周期 | 两组不串联；缺端安全关闭；两端挂载顺序可互换；卸载、重挂及重复角色有确定结果，Controller 不指向别组 |
| 页面及嵌套滚动 | 锚点仍可见时整个浮层持续跟随；背景、内容、箭头不分别漂移；锚点离开滚动区域时不留下漂浮说明 |
| 视口四边与圆角附近 | 自动翻向、适当避边；箭头继续指锚点中心且连接主体，没有断缝 |
| 动态内容与尺寸 | 打开时切换天数、指标或文字，值和排版更新；不出现背板保留旧尺寸或内容跑出旧框 |
| Tooltip | hover／focus、跨提示阅读、Escape、延时取消、内容为空及数字 0 均符合上文；不创建用户未要求的关闭按钮 |
| 外观与优先级 | 字体、颜色、圆角、边框、阴影、渐变与主题材料可用；调用者原 Props／id／aria 的优先关系不被隐式覆盖 |
| 旧设施退出 | 所有现役路径指向能力领域，无旧组件、双绘制层或旧函数残留；不是新实现与旧设施并存 |

几何与截图读取可以出现在测试／浏览器实验中，不能移进生产作为测量修补。旧 `readOutlineTip` 依赖 `.PopoverPaint` 和特定 border-shape 字符串的断言应替换为实际视觉与几何效果验证，不能靠保留旧 DOM 让测试通过。

UIKit 内应覆盖新组合示例、Tooltip、Help／Label、真实 body 材质及组件结构查看，并完成当次类型检查、构建和适当单元／浏览器验证。交付记录写清实际测试、实际浏览器及截图，不宣称控制台没有未检查的警告。

原始问题的最终验收仍包括 bcoin StrategyView 的 RuleDetail。当前外部消费者还有旧 `plugin={tooltip(...)}` 与旧 Surface 接口，不能只构建 UIKit 就称真实页已通过。需在获得对应项目修改授权后完成外部适配、关联构建并在真实页打开 Tooltip，滚动、切换指标／天数并验证内容、箭头与背景。未获得外部授权或未完成实际验证时明确标“RuleDetail 验收未完成”，不能删除这一验收、保留 UIKit 旧别名或自行修改外部项目来掩盖。

## 实施顺序、未决与完成判定

1. 核实用户已经亲验并明确许可；重新盘点前置交付与实际消费者，保护已有 Git 修改，不自动暂存或回退。
2. 先完成本文约定的最小原生浏览器验证，记录版本、滚动、翻向和边缘箭头连体证据。技术未同时满足硬条件时停止受影响改造，提交失败与取舍，不降低原效果要求。
3. 在通过的技术路线下实现双端配对、唯一打开事实、完整 Controller 和 body 整体样式；按 domRef 负责节点接入，验证缺端、挂载顺序、取消打开及 defaultOpen。
4. Tooltip 复用同一 body／显隐／定位语义，保留自身 hover、focus、150ms 关闭、跨区域阅读及动态内容；迁完 UIKit 消费、示例、测试、导出和材质，删除旧组件及双绘制链。
5. 完成 UIKit 当次类型、构建、行为和视觉验收，再在获得外部项目授权后适配并验证真实 RuleDetail。任一部分未完成均如实标出，不将 UIKit 通过当成最终页完成。

未决技术是原生 CSS 在极边缘仍精确指向锚点且箭头与主体连体的可行性，须以本文最小实验判断；外部 RuleDetail 修改与运行权限须另获授权。两者均不能靠旧测试数量或方案描述代替证据。

Scope 活动源码已退出，但两张旧截图与 scope.webp 曾被自动策略拒删，旧资产和目录未完全清空。这个既有受阻事实不因拆分消失；不换工具绕过，也不把残留宣称为已删除。

按仓库有效入口记录实施详情、删除接管、真实结果与受阻项；历史[实施记录](../../agents/run/261105-inactive-plugin-pilot/实施记录.md)不替代本文证据。只有本文效果、旧设施退出和真实消费者验证都完成，才可标为全部完成；未获外部授权或未实测时保留“RuleDetail 验收未完成”。
