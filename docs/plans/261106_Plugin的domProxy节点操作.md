# Plugin 的 domProxy 节点操作

## 当前状态与全局位置

本文记录的 `Promise<boolean>` 后续目标已由 [PromiseResultProxy 完整 Promise 与惰性计算](../../../fnkit/docs/plans/261108_PromiseResultProxy完整Promise与惰性计算.md) 的第二阶段统一接管。先完成 FNKit 代理能力与现有消费者兼容验证，再明确各操作的真实成功条件；本篇其余历史施工说明不据此改写。

**实施中：用户已授权继续完成剩余 Plugin。** 此前资源迁移的两个缺口已按下述责任路径落实，实际结果仍须独立审查和验收；不能把方案写入 Plan 当作完成证据。

本文对应[基础协议全局运行图](261105_is声明解析与Plugin调用协议统一.md#全局运行图与本-plan-定位)的 B、C、H：能力构建时准备完整 Controller 和声明，节点接入仍经统一 ShadowProps／domRef；本文在此基础上提供可等待的 DOM 操作入口。基础协议的其余责任继续由原 Plan 承担。[Popover 与 Tooltip 能力重构](261106_Popover与Tooltip能力重构.md)保持原有用户许可闸门。

## 目标：整个消费者链简化

Plugin 基础设施承担节点取得、必要转换和临时接入；使用节点完成业务的代码只表达业务。这里的消费者不止 pluginCore：clickable、draggable、droppable、PointerDrag、dragSession 中的目标登记以及 TopLayer 本身都受简化要求约束。

目标使用效果：

```ts
pluginCore({ domProxy }) {
  return { focus: () => domProxy.focus() }
}

// 拖动本来就能从已有事件取得真实节点，无需额外等待 domProxy。
callback({ event, element }) {
  pointerDrag ??= createPointerDrag({ source: element, payload, enabled })
  pointerDrag.start(event)
}
```

读取 domProxy 会准备获取，操作结果可以等待。core 每次能力构建时只执行一次，立即返回完整 Controller；is 展开、挂载和状态变化不重跑 core。Plugin 的声明继续直接使用 ShadowProps；保留现有 is／shadowProps 展开顺序、字段融合、组合身份与组件协议。

不得仅让入口少写一层，再让 PointerDrag、目标登记或 TopLayer 为代理新增判别、节点接入、节点镜像、实例保存、Controller 外壳与方法转发。把补偿搬到这些消费者内部仍是业务负担。日后替换临时核心，消费者不能被迫逐处改写。前版强制拖动把 domProxy 当 source 是 Agent 的示例，并非用户规定的调用；已有事件能提供节点时，直接使用该节点更简单。

## 用户决定与妥协

| 已确认决定                                                  | 本阶段含义                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 首次取得的 DOM 身份暂按固定处理                             | if 重建、换宿主与后续换源暂不支持；在负责的基础设施集中留 TODO，不为通过旧换源测试补回机制 |
| 完整的对象即 State／Source、成员与 val／symbol 协议暂不实现 | 本轮只接通根节点的现有 Source 读取，不实现对象成员传播，也不把未来完整增强当迁移前置       |
| 公开操作最终目标是 Promise<boolean>，暂不实现               | clickable 暂保 PromiseResultProxy<void>；不伪造成功值，也不补造原生 Promise 的全部协议     |
| 直接复用 FNKit 现有 toPromiseResultProxy                    | 不修改 FNKit 的源码、类型、测试或文档，不重写递归代理                                      |
| Popover 与 Tooltip 暂不重构                                 | 既有 Tooltip 所需 withDom 保留，不改产品、目录、几何或样式                                 |
| 临时措施可以不完整，但业务无感                              | 妥协和 TODO 留在责任层；不能要求每个消费者自行接入或额外包装                               |

固定的是 DOM 身份，不代表能力声明永远存在。现有 [Piv 说明](../../src/components/Piv/SPEC.md)与[基础协议 Plan](261105_is声明解析与Plugin调用协议统一.md)要求动态移除 is 时释放对应资源、重新加入时接入；组件最终销毁时也须清理。用户没有将这些行为纳入首次节点固定的妥协，不能自行删减。

本轮不预设 Foundation 必须修改，也不将它绝对禁止：此前 Plan 的“不修改 Foundation”没有找到明确用户裁决，应退出这一绝对限制。若规划所需的局部通用设施确实归其负责，先证明必要性和实际契约；不能借此实现完整对象 State，或扩大为无依据的框架改造。涉及严重代码风格或重大公开 API 变化，先说明并按用户已定边界处理。

## 现状与此前修改审查

以下以当前工作树和本轮只读检查为准；历史实施记录只说明当时发生过什么，不表示当前文件仍是那种状态。

| 对象                                                     | 当前事实与处理                                                                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| createInactivePlugin 的 domProxy                         | 按需缓存 FNKit 代理与首次节点来源；根内部接通已有 Source 视图，并在节点退出时更新当前可用性，换源仍为 TODO                             |
| clickable                                                | 已用 domProxy 代替保存元素；当前 Controller 返回 PromiseResultProxy<void>，首次前等待，后续换源不承诺                                  |
| createInactivePlugins                                    | 已直接转交同一 context 并补内部 id，避免展开时触发 getter；保持现有配对语义                                                            |
| draggable、droppable、topLayer core                      | 已采用事件、声明及普通 Source 分别承担自身业务；本次实现仍待独立审查                                                                   |
| createPointerDrag、dragSession、createTopLayerController | PointerDrag 保留真实 HTMLElement 输入；drop 目标改由节点属性承载；TopLayer 接收普通 Source。不使用 domProxy 专用分支或 Controller 转发 |
| Piv 的 consumeDomRefs                                    | 既有 ShadowProps／domRef 消费者随声明项和节点退出执行清理，是保留行为的事实依据                                                        |

此前决策的来源必须区分：

| 事项                                                                   | 来源与结论                                                                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 节点重挂后更新代理目标                                                 | 当时曾是用户要求，后来被“首次 DOM 固定”的明确妥协覆盖；不能追溯说最初未经授权                                               |
| 将 withDom 消费迁到 domProxy、同步调整相关测试                         | 用户曾明确授权；问题在实施方式和验收范围，不是迁移意图本身未经授权                                                          |
| 对象 State、Promise<boolean>、节点换源                                 | 用户明确同意暂缓；不能用测试全绿要求补回                                                                                    |
| onAccess 等探索                                                        | 属于共同讨论后退出的方案，不是现役要求；不应当作 Agent 单方发明再添加回去                                                   |
| 消费者内 domRef／Effect、再到内部 WeakMap 桥及各工具代理分支／实例转发 | 是 Agent 为迁移自行选择的历史做法，不是用户要求；它把接入负担转移给消费者，用户已否定。现已不在当前工作树，不要假定仍需删除 |
| 旧 Plan 只验证 core 直传、声称资源包装已退出／可验收                   | 是 Agent 缩小消费者边界并沿旧实现放行；当前事实不支持该完成判断，本次撤销                                                   |

历史操作及当时测试见[实施详情](../../agents/run/261106-dom-proxy/实施详情.md)。测试通过仅证明当时覆盖的行为，不能证明用户要求的整体简化；本次不改写历史记录。

## 统一节点入口与资源责任

能力首次同步读取 domProxy 时，只准备一份首次 Promise 和一个稳定代理；根层也将当前节点可用性关联到 Foundation 已有的 Source 视图：

```ts
// 职责示意：具体类型与清理由实际 ShadowProps 契约承接。
const first = Promise.withResolvers<HTMLElement | undefined>()
const domProxy = toPromiseResultProxy(first.promise)
// 根层接通已有 Source 缓存；domRef 接入时记录并通知节点，退出时清空并通知。
// first.resolve(el) 仅在首次接入完成等待。
```

后续读取同一 getter 复用这一份结果；未读取时不准备。await domProxy 等待首次节点，val(domProxy) 使用已有 Source 读取当前接入节点或 undefined。由于 Solid 的响应通知会批处理，根层记录当前可用节点并用 Signal 通知，确保退出后立即读取也能观察到清空；这份临时状态集中在根层，不是完整对象 State／成员传播。FNKit 现有代理负责递归读取、方法接收者和异步结果，不由 UIKit 重写；外层换源 Proxy、currentProxy 切换和退出时重置 Promise 已退出，换源未实现的 TODO 留在节点来源责任处。

这里有明确的公开类型变化：PluginCoreContext.domProxy 从 PromiseResultProxy<HTMLElement> 改为 PromiseResultProxy<HTMLElement | undefined>，使用者通过 val 读取时必须处理未接入或已退出的 undefined。await 的运行时仍等待首次真实节点，但其公开类型也包含 undefined，不能宣称调用者完全没有类型影响；此变化不代表 if 重建换源或完整对象 State 已经实现。

这只解决**首次节点的操作入口**，不能据此说资源型消费者已迁移。旧换源断言须按用户新决定调整为首次节点范围的真实验证，不得借此删除动态声明清理、实际交互或组件销毁等仍有效断言。

## 资源接入：沿已有业务输入和声明

| 步骤                     | 责任与原理                                                                                   | 退出与验收                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 构建                     | 同步解构 getter，准备唯一 Promise 与声明；core 返回完整 Controller 一次                      | 首次获取入口有明确责任与退出内容                                                         |
| 首次接入与普通命令       | domRef 收到真实节点时完成首次 Promise，并通知当前 Source 可用；退出时清空当前 Source         | focus 等代理操作可等待；val 读取当前可用性，不需业务保存节点                             |
| PointerDrag 事件         | pointerdown 既有事件载荷提供真实 element；首次按下时创建原事务，保持原有同步事件、捕获和算法 | 声明事件的注册级 cleanup 取消并清空事务；不使用 localCleanup，以免第二次按下误取消       |
| Droppable 目标           | 目标作为已有 prop:* 声明写入真实节点，命中时从该节点读取目标；Piv 原有声明消费负责恢复       | 删除额外 WeakMap／register；动态 is 移除和重加随节点属性恢复与重设                       |
| TopLayer 几何            | 单个 Controller 消费普通 Source；enter 通过 val 取得当前节点，普通 HTMLElement 输入仍同步    | Plugin 的普通 Effect 表达节点存在时自动进入、退出时恢复，不负责获取元素或转发 Controller |
| 声明移除、重加与最终销毁 | domRef 退出更新根 Source，事件声明 cleanup 与节点属性恢复沿用 Piv 原有作用域                 | 保留同节点重加与最终销毁；退出后的 Controller 不得重新提升旧节点                         |
| if 重建或换宿主          | 首次身份固定后不保证代理改指新节点                                                           | 保留集中 TODO，不把该失败当本阶段必须修复的行为                                          |

此前两项缺口分别是同步算法如何取得真实节点，以及声明退出如何释放资源。前者不强制所有消费走代理：事件已有真实元素，接收目标已有节点属性通道；只有 TopLayer 的自动进入需要作为 Source 观察节点。后者分别复用事件注册级 cleanup、Piv 属性恢复和根 Source 清空，而非新建消费者接入管理器。对应实现必须经真实交互和声明退出验证，不能仅凭本表宣布完成。

Foundation 已有 Source／val 与 PromiseLike 视图缓存；根层为 domProxy 复用该缓存，避免初次读取 Promise 的 NotReady 状态影响节点可用性的同步读取。缓存承载位置从 state-view 内部移至相邻内部模块，使根层能关联同一视图；Effect 对 PromiseLike 优先读取 Source，避免将可调用的 Promise 代理误当计算函数。Piv 的 prop:* 运行时已接收对象，类型同步为 unknown，以表达接收目标的真实声明。以上根层成本各对应节点可用性、既有缓存或已有属性契约，不实现未来的完整对象 State。

Plan 中已有及后续 Agent 自行提出的方法，都须在采用前按[Plan 落地契约](../how-to-apply-plan.md#变更审查以需求覆盖范围为边界)反复从原目标检验并给出充分理由：采用该方法能消除什么获取或补偿、是否已有设施、删去会失去什么，以及是否将负担转给消费者。依据不足时先不加入；出现新前提、额外补偿或反例时回到原目标重新检验。历史消费者桥接与转发因转移负担而退出；本次方案同样需由未参与设计的审查者核对实际差异和反例。

## 拟改位置、接管与完成状态

| 位置                                                             | 已明确可做／待闭合的责任                                                                                       | 退出或完成状态                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| plugins/tools/createInactivePlugin.ts 的 domProxy getter         | 单一首次 Promise、现有 addProps、FNKit 代理和根 Source 可用性；说明接入时机与换源 TODO                         | 退出额外 Proxy 和重置链；core 仍一次、Controller 完整、同 getter 复用 |
| plugins/tools/createInactivePlugins.ts                           | 检查现有直接 context 转交与共享 id；无新责任时保持                                                             | 不因组合展开提前激活 getter，不另造连接系统                           |
| clickable.ts、相邻 SPEC 与测试                                   | 保留 focus／blur／click 代理调用及状态动作；修正退出后等待新节点的过期承诺，在责任处记 Promise<boolean> 后续项 | 保留首次接入前等待与真实调用，不将重建换源冒称完成                    |
| draggablePluginCore、droppablePluginCore、topLayer 的 pluginCore | 退出节点获取的 withDom 包装；分别使用已有事件、节点属性和普通 Source                                           | 拖动事务正常取消、目标随声明恢复、TopLayer 自动进入与退出仍须验收     |
| createPointerDrag、dragSession、createTopLayerController         | 保持 PointerDrag 真实元素 API；目标登记交给节点属性；TopLayer 使用普通 Source 与单个 Controller                | 不新增识别代理、节点镜像或方法转发；目标 WeakMap／register 退出       |
| Piv／ShadowProps／consumeDomRefs                                 | 复用现有声明和清理，prop:* 类型承接运行时已有对象值；不更改字段合并顺序                                        | 声明退出、重加和最终销毁须有证据，不新建平行节点消费者                |
| Foundation 的 Source 与 Effect                                   | 既有 PromiseLike 视图缓存由相邻内部模块共享；Effect 优先识别 PromiseLike，再读取 Source                        | 让根代理可使用已有 Source 语义，不实现对象成员 State 传播             |
| Tooltip／Popover、FNKit、withDom 公共能力                        | 本阶段排除重构；Tooltip 仍需要 withDom                                                                         | 不删除仍有调用方的 API，不改 FNKit 或浮层实现                         |

上述入口、方法和退出对象构成施工范围的具体检查。若实际工作树再发生变化，先按真实差异重新核对，不回退、暂存或覆盖已有工作。

## 后续执行顺序与验收

1. 按用户授权完成根节点来源、现有 Source 的接通和三个消费者的责任迁移；不改 FNKit 或 Popover／Tooltip。
2. 由未参与方案设计的独立审查者，从用户原始目标、已接受妥协和完整消费者链建立验收，再检查实际 Plan 与差异；未满足或证据不足不能放行。
3. 沿真实业务调用验收：clickable 首次等待与正确 this、拖动同步事件／取消、目标真实节点命中与声明移除／重加、TopLayer 初次无节点／自动进入／退出恢复、组件销毁清理；再核类型、相关测试和构建。验收必须能拒绝“入口变短而消费者增加代理补偿”。
4. 用户明确不支持的 if 换源、未来对象 State 和 Promise<boolean> 保持未完成；不为让旧测试全绿而加回它们，也不以测试全绿代替目标和责任验收。独立审查及用户检验完成前，不进入 Popover／Tooltip。

## 执行依据

- [仓库入口](../../AGENTS.md)、[Plan 撰写契约](../how-to-write-plan.md)、[Plan 落地契约](../how-to-apply-plan.md)：核对代码授权、范围与实际验收。
- [AI Rules 入口](../../../ai-rules/AGENTS.md)、[任务分工](../../../ai-rules/rules/Agent-任务分工.md)：独立审查先从原要求列验收；作者不能自定边界放行，参与设计者不能审自己的方案。
- [第一性原理](../../../ai-rules/rules/Code-第一性原理.md)、[黑盒化](../../../ai-rules/rules/代码清洁工具--黑盒化/规则.md)：对新增接入与补偿先判断真实必要性，并沿完整消费者链检查。
- [代码修改验收](../../../ai-rules/rules/Code-代码修改验收.md)：保留行为、用户妥协、代码质量与责任完整性分别验证；测试通过不能抵消业务复杂化。
