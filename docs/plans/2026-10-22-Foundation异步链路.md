# Foundation 异步链路改造 Plan

## 当前轮：删除 followState（已完成）

用户明确授权删除 followState。原生计算在执行函数时读取来源便能建立动态依赖；现有 createState 计算来源与 map 已承担派生，检索没有 followState 业务调用。因此删除它独立创建运行器、向另一个 State 写值及返回停止函数的接口，不给派生再保留一条复制路径。函数壳本身不会使普通值响应式，本轮不改变 createAsyncSignal 的值/函数分流。

范围仅 stateUtils 的 followState 与专用 imports、仅包含其 3 项测试的 stateUtils.test.ts、Hooks 出口注释/SPEC 和 Foundation SPEC/API 说明。mapSource、derive、mapStateView、createReactionFn 与既有映射依赖及异步测试保留。旧 Plan 中的 followState 记录保留历史身份，由本轮删除裁决替代。独立前置审核通过；不改 index、不回退。

验证 type-check、unit、browser、build、git diff --check 与 index 指纹，证据位于 agents/run/follow-state-removal；不为删除无消费者能力新增测试。

已删除函数及专用 imports、3 项专属测试和现役文档说明；src 检索无 followState 残留。stateUtils.ts 净减少 21 行，专属测试文件减少 56 行，mapSource/derive 代码及原生映射测试未改。type-check、build、差异检查通过；unit 63 文件 482 项、browser 28 文件 211 项全部通过，四项运行退出码为 0。index 指纹不变，独立实际差异与最终证据复核通过；本轮没有临时原型、服务或待清理附件。无剩余实施项。


## 前轮：删除 State 的空释放接口（已完成）

用户明确授权删除 State 的空 Symbol.dispose；本轮只删 state.ts 接口声明与空实现，以及 API 文档对应一行。全 src 检索未发现使用该接口的消费者。ReactiveRunner 的真实 dispose/Symbol.dispose 保留；followState 仅作必要性评估，不修改。独立前置审核通过，保留全部暂存工作，不改 index、不回退。

验证沿用用户的完整要求：type-check、unit、browser、build 与差异检查；不为删除空操作新增测试。证据保存在 agents/run/state-dispose，index 指纹和实际修改范围已核对。

实际只删除 state.ts 7 行与 API 文档 1 行，测试和其他生产文件未改。type-check、build、git diff --check 通过；unit 64 文件 485 项、browser 28 文件 211 项全部通过，四个运行退出码均为 0。index 指纹与行动前一致；本轮仅保留基线指纹和验证日志，无临时原型或服务需要清理。


## 前轮：val、Promise 转换与 UI 边界各归其责（已完成）

用户要求继续整理 val、Promise 转换与 fallback，优先使用 Solid 2 原生异步机制，不为旧契约保留补偿，也不将复杂度搬给业务。行动前上一轮 28 个文件已全部暂存，本轮只修改工作树；index 快照与指纹保存于 agents/run/val-native。

### 当前需求与实施裁决

- val 负责递归读取完成值。第二参数只在最终完成值为 null/undefined 时选用；普通 Promise 与 StateView 一致，等待和失败继续进入 Solid/UI 的 Loading、Errored。
- 本轮方案删除 Promise 转换的 defaultValue/errorValue/onRejected 策略，以及对应类型、重载和出口。它们是此前 Foundation 选择的兼容策略，不是本轮用户逐字列出的 API；删除是落实读取与 UI 边界分工的实现裁决。全 src 非测试调用审计仅找到 Foundation 内部分派及公开类型出口，没有业务消费者需要迁移。
- read.ts 删除 Promise 专用 owner 探查、catch 与二次转换；promise-like.ts 只负责协议识别与原生计算，退出多层默认/错误选择与动作通知；state-view.ts 只负责身份复用、转换和已有映射选项。
- 保留固定 Promise 的身份缓存和无 owner 原生计算：响应式重算重复读取需保持同一异步节点，首消费者卸载不应终止其他消费者；现有跨 owner、失去订阅后复读成功/失败测试继续验证，不为机械删 owner 而丢失生命周期。
- State、Source、Map、createAsyncSignal 和 cleanupAction 本轮不扩展。公开 options.map 及函数映射简写保留。

### 顺序与验收

1. 先保存基线、审查生产调用点并取得独立前置约束审核；已完成。
2. 依次精简 val、Promise 转换、stateView 分派和公开出口，同步领域 SPEC/API 文档。逻辑必须是读来源 → 判断最终空值，不能改名或搬迁旧异步 fallback 图。
3. 重审测试：退出等待/失败被转换为默认值及 onRejected 策略测试；保留完成值、错误、嵌套来源、身份复用、默认函数惰性与订阅边界。增加必要实际 UI 断言，确认 raw Promise/StateView 都交由 Loading/Errored，完成空值才显示 fallback。
4. 运行全量 unit、browser、type-check、build，独立审查实际差异；不补 flush 或扩大 ownedWrite。最后记录失败尝试、退出依据、验证结果及工作区完整性，清理本轮无用临时产物。

### 实施结果与语义变化

- val 现为递归读取最终值 → 判断空值 → 按需求值默认来源。已删除 runWithOwner 探查、catch 及 Promise 专用二次转换，没有新增替代边界。
- Promise 转换只创建一个原生可写计算并公开读取端；删除 defaultValue/errorValue/onRejected 类型与配置、默认值身份 memo、来源选择 memo、error boundary、通知 effect 和最终选择 memo。stateView 统一缓存与 map 分派，包根与 Foundation 类型出口同步删除。
- 这是明确的 API/行为调整：默认值不再代替等待或失败；这些状态由 UI 边界显示。Promise 转换 options 现在只保留 map。普通值读取同时修复 `val(null)` 旧实现返回 undefined 的不一致，未传默认值时保留 null；显式 null 默认值也保留 null。
- 固定 Promise 的 WeakMap 与无 owner 原生 Signal 保留原职责。原生 createMemo 在无 owner/失去观察时可释放，createSignal(fn) 关闭 AUTO_DISPOSE，故替换成 memo 会重复进入异步等待；身份与生命周期回归完整通过。

### 测试裁决与失败修正

- Promise 转换测试删除 5 项旧策略：默认错误回退通知、独立 errorValue、异步默认/错误选择、onRejected 动作释放、默认 getter Promise 身份；完成 undefined 测试保留并改为原生等待后读取。
- stateView 删除 2 项旧 defaultValue/errorValue 分派测试，Promise map 测试改为等待后才执行映射；映射、身份复用、跨 owner、全部失观察后的成功/失败保持测试均保留。
- val 原有等待/错误回退断言改为原生等待和原始错误传播；默认函数测试验证空值订阅与非空后停止订阅，异步默认来源仅在完成空值后选择；新增 1 项普通/嵌套空值及 null 默认值矩阵。因此 unit 净减少 6 项，不靠保留旧策略达到绿灯。
- 现有领域浏览器文件增加 3 项：raw Promise 与 StateView 同屏验证等待→null、等待→undefined 后使用默认值，以及拒绝进入 Errored；原有换源、迟到、动作释放、DOM 卸载断言不变。
- 首轮聚焦测试暴露测试写法错误：effect 简写返回 push 长度触发原生 REACTIVITY_HALTED，后续测试受污染；改为 void 动作。旧 expectTypeOf(val(pending)) 实际执行读取，改成函数返回类型检查；同步错误被原生 StatusError 包装，改核消息，resolve 仍核原始错误身份。生产源码未为这些失败加任何补偿。

### 验证与当前状态

- 聚焦测试 3 文件 25 项通过；全量 unit 64 文件 485 项通过；全量 browser 28 文件 211 项通过；type-check、build、git diff --check 通过。错误边界用例的预期拒绝在浏览器日志中由 Solid 打印，不是未处理测试失败。
- 证据：agents/run/val-native 的 focused.log / first-types.log 保留首次失败，focused-second.log / types-second.log / final-unit.log / final-browser.log / final-build.log 记录最终结果，三个全量运行退出码均为 0。
- 相对本轮 index，5 个生产文件合计 +24/-135，净减少 111 行。减少的是读取旁路与 Promise 的默认/错误策略图；没有把这些机制移至 State、Map、Source 或 cleanupAction。4 个测试文件合计净减少 137 行，新增浏览器边界证明实际语义。
- 独立实际差异审查通过；index 指纹与行动前一致（integrity.json）。未操作 Git index、回退或启动开发服务。本轮只创建基线及验证证据，无临时原型需要删除。独立最终 Plan/证据复核通过；主 Agent 已核全量日志与 index 逐字节一致，新增浏览器用例完成实际 DOM 验收，无需额外启动开发服务。无剩余实施项。

以下为已经完成的前轮记录；涉及旧 Promise fallback 契约的历史说明由本轮新裁决替代。


## 前轮：以 b0799cb 恢复原生两层职责（已完成）

本轮用户明确要求以最初提交 `b0799cb` 为基线，移除后来附加的契约与补偿。前轮将 HEAD `4225c00` 中已经改过的版本称为原版，基线判断错误；下方前轮结论保留为失败历史，不再约束当前实现。

### 需求、退出项与代码落点

- 保留普通值、Promise、计算函数输入；读取输出 `Awaited<T>`，由 Solid 的计算和 UI 边界处理等待、完成与错误。业务不接管 Promise 等待。
- `createAsyncSignal.ts` 恢复来源 Signal → 结果 Memo，删除独立 initial Memo、SourceRecord、待更新函数组合、内部占位与 owner 初始化探查。不将这些机制搬到其他文件。
- 退出首次派生尚无结果时保存多个 updater、首次完成按序消费、后续重新恢复裸派生的 Agent 契约；退出替所有未读取或已覆盖 Promise 统一观察拒绝的附加承诺。
- 原生 setter 实际直接调用 updater，后续写入 Promise 时 previous 可以是 Promise；不能用类型断言把它冒充完成值。先验证原生行为及最小适配，再明确类型和文档，不以旧测试反向定义需求。
- `state.ts` 只同步写入契约；`SPEC.md` 与领域 API 文档撤销旧机制描述。Map、读取 fallback、Piv 等相邻实现保持稳定。
- 测试按当前需求逐项保留或退出；DOM、异步 UI、错误、换源与卸载断言继续作为边界。退出旧测试时记录其原先维持的 Agent 策略。

### 实施顺序与验证

1. 已查 Git 原版及本地 Solid 2 `createSignal` / `setSignal` / `setMemo`。临时证据限 `agents/run/async-original/`；保留全部暂存工作，不执行 Git 回退或 index 操作。
2. 先验证原版直接行为，再实现最少必要修正。执行负责人负责代码与测试；独立审核核对需求、原生复用、类型诚实性及精简结果。
3. 运行完整 unit、browser、type-check、build；实际页面由主 Agent 验收。失败先判断用户需求还是失效测试，不能补 flush 或全局 ownedWrite。
4. 对最终实际差异再次挑刺，按同层级比较逻辑链，不以删注释或行数代替简化。记录验证结果、失败尝试与未完成项。

### 失败尝试与最终职责

1. 先恢复原版强制 `() => initialSource` 的来源计算，再仅接续已有 Promise。原生探针与首轮测试证明：普通 Promise 被这层函数提前交给来源计算等待，首次 updater 实际取得 undefined；在原始请求尚未结束时，替换值的读取也可能仍被初始等待挡住。这是原版包装方式的问题，不能为机械复刻而损失真实 UI 换源能力。
2. 改为原生值入口与函数入口：普通 Promise 直接存入 Signal，函数才由可写计算执行。来源不再无条件 await，结果 Memo 统一处理普通 Promise；计算函数的等待、手动写入与重派生沿原生时序。两种输入仍只有两个节点，没有初始副本或命令记录。
3. 原生 createSignal 的 TypeScript 重载分开值与函数，直接联合参数无法通过；一度将公开 StateSource 改成 Exclude，破坏泛型转发及函数数据推断，候选退出。保留原公开类型，isFunction 判定后分别调用对应重载，仅非函数分支补充已确定事实的 Exclude 类型收窄，不伪造 updater 的完成类型。
4. 裸 thenable 直接交付嵌套 Promise 的既有 State 测试识别结果未完全展开；结果 Memo 内用标准 Promise.resolve 归一化。它只负责协议展开，不保存状态、不接管调度。已有 Promise 的相对更新同样通过标准 then 接续，业务回调不接 Promise。
5. 最终核心链是原生来源 → 原生结果计算，setter 只替换值或接续已有值。删除 initial Memo、SourceResult/SourceRecord、函数组合、内部 loadingValue、owner/isPending/untrack 初始化与执行补偿、captureResult 的统一拒绝观察。Map、read fallback 及其他 Foundation 已有改动保持不动。

### 测试重新裁决

- 删除 3 项未读/同批覆盖 Promise 必须由 UIKit 统一观察拒绝的测试：它们在要求额外吞拒绝机制，已被本轮退出。
- 删除函数初始异步计算必须让后续手动值永久胜出的测试：计算入口按 Solid 原生派生，普通 Promise 换源与迟到隔离仍由正式浏览器测试验证。
- 删除 2 个 lazy 组合下的首次派生待更新序列测试，以及其嵌套 thenable、直接覆盖取消、失败/卸载取消 3 项专门变体；这些测试在维持已退出的命令保存策略。
- 惰性首次等待直接写入专例退出，保留独立的计算作用域拒绝写入断言；lazy 测试改为首次读取建立当前值后更新，不要求 setter 另起初始化流程。
- 保留普通 Promise 初始/后续接续更新、完成类型、错误恢复、迟到结果、equals/options、函数数据与原生依赖。state.test.ts 原有裸 thenable 嵌套 Promise 与后续更新断言完整保留。
- 正式浏览器测试全部保留，包括首个请求未完成时替换第二请求、第二请求完成后显示、迟到隔离、动作及 DOM 卸载。没有新增 flush 或扩大 ownedWrite。

### 验证结果与审查

- focused：2 文件 26 项通过；完整 unit：64 文件 491 项通过；完整 browser：28 文件 208 项通过；type-check、build、git diff --check 通过。
- 日志位于 agents/run/async-original：first-unit.log 保留原版包装失败，direct-source-second.log 保留旧契约及 thenable 失败，focused.log / final-unit.log / final-browser.log / final-build.log / types-fourth.log 记录最终结果；完整运行 .exit 均为 0。
- 主 Agent 实际页面已核 Button 外观、尺寸、disabled/loading；异步页等待→完成与刷新→拒绝均正确，截图 async-error.png。生产逻辑在验证后保持稳定。
- 相对本轮 index：createAsyncSignal.ts +16/-58，state.ts +1/-1；生产实现净减少 42 行。核心从计算来源的 3 个响应式节点及命令状态分支，收回 2 个节点；没有把复杂度移到其他模块。测试 +6/-178，9 项附加策略退出；减少测试数不替代保留需求的完整验证。
- 独立审查已确认原生入口、thenable 展开、已有 Promise 接续、类型收窄与测试退出依据，最终实际差异和 Plan 复核通过。主 Agent 确认 index 与行动前逐字节一致。dev session5664 已停止，5173 无监听，临时验收浏览器页已关闭。
- 已清理本轮 native.mjs 原型及重复的 direct-source.log、types-first.log；保留必要失败日志、两次类型失败依据、全量验证日志与退出码、页面截图。未更改旧轮证据。无剩余实施项。

以下均为被本轮替代的历史实施记录。


## 前轮：误用已修改版本作为原版（结论已被替代）

用户否定前轮补偿叠加，现以 HEAD `4225c00` 中被认可的 createAsyncSignal 两层“来源结果记录→原生结果计算”为结构基线，重做后来引入的机制。前轮全部 28 文件现已由用户暂存；本轮取新 index 快照，只改工作树，不操作 index、不 Git 回退。证据目录 agents/run/foundation-async-redo，历史验证不能替代本轮结果。

### 需求与裁决来源

| 内容 | 权限与当前判断 |
| --- | --- |
| 普通值、Promise、计算函数统一输入，完成值类型，UI 负责等待/失败 | 用户原始契约，继续保留 |
| set updater 接收完成值，Promise 连续更新、失效及清理、lazy/options/函数数据 | 用户原始契约与原版已成立行为，不得削弱 |
| 首次派生 pending updater 消费一次，下一次恢复裸派生的具体机制 | 前轮 Agent 推导，不是用户指定队列；本轮重新比较原生表达，不默认保留 InitialSource 或独立 initial memo |
| 原生 dev 计算域写限制、异步提交及原生错误边界 | 已核平台约束，不用全局 ownedWrite、flush 或手写调度规避 |
| pending updater 旁读 factor 被订阅；已完成 Promise + fallback 每次建 7 节点 | 本轮已确认缺陷，正式回归并从责任主体修复 |

### 实施与验收顺序

1. 已保存 28 文件新 index 与工作树快照。重读原版来源和本轮来源，按普通/Promise/计算输入 × 直接写/updater × 等待/失败/完成列行为矩阵；查 native writable computed、resolve 与读取判定能力。
2. 比较可用原生机制，优先删掉 InitialSource、队列和额外初始化计算造成的职责混合；不能只是搬到另一层或删掉实际异步更新能力。以副作用不订阅、Promise 更新与取消、lazy 首写、错误/卸载的行为证据判断。
3. 在读取领域先读取完成来源，再只为真实等待/失败选择显式 fallback，去掉完成分支反复创建整套边界。保持 defaultValue/errorValue/onRejected、异步 fallback 和真正 undefined 的区别；不能用缓存掩盖无谓构图。
4. 更新必要同名回归与 API/SPEC 文案，不改 Map 主体。净减少相对本轮 index 的生产与测试代码，不能靠删断言或压缩语句交差。
5. 完成本轮类型、unit、browser、build；实际验证 Button 与异步页面，停止本轮服务。独立约束与精简复核，记录结构取舍、失败原因、净变动和 index 完整性。

### 本轮机制选择与失败依据

- 原版两层是责任起点，不机械要求所有输入恰好两个节点。普通值/现成 Promise 仍为来源+结果两层；计算函数保留一个唯一的 native 初始计算，防止等待更新时重复调用来源。resolve(initialSource) 与两层 read:initial 候选会重复源函数；resolve(readSource) 又会读到自己刚写入的 Promise，不能成立。原生重新派生结果为 10 不授权提前丢弃用户命令，因此不采用静默 no-op。
- 删除 InitialSource 对象、read/update 字段、readInitial 中转及 IIFE。来源只保有结果记录或待应用的更新函数；多次 updater 的函数组合仍保留，因为确有连续更新需要。真正应用函数时以 native untrack 保持命令旁读不订阅。额外 native 初始计算仍保留，不谎称回到全输入两节点，也不声称消灭了待转换事实。
- 完全去掉 source loadingValue 会使两条真实 set(7) 回归等待超时；使用 native 明确支持的 loadingValue:undefined，仅代表内部尚无来源结果，外层继续读唯一初始计算而保持真实 pending，没有 undefined 假就绪。
- 完成 Promise 的显式 fallback 先对固定来源作无 owner 原生读取，不让尚未处理的错误订阅绕过 fallback。成功直接使用结果；等待/失败才在原消费者作用域建立原生回退边界。结果含 StateView 时，后续 val 仍跟踪该动态视图。catch 仅包原始读，不捕获 fallback 自身的失败。
- 普通 try-read 与 untrack 都无法阻止原生 pending 强制订阅造成错误绕过边界，日志 read-fastpath/read-fastpath-second 留证；latest 窗口候选 22 项中 2 项超时，改变这条链的持有/读取语义，保留 read-verdict.log 后退出，不补 flush 修饰测试。最终单一 null-context 读取候选通过原行为。
- native 节点分配临时证据：同一已成功完成 Promise 配 fallback，十次读取从 70 个节点降为 0（allocation.json）。这是构图分配证据，不是页面速度或所有 settled 状态的承诺；已拒绝来源仍需回退边界。不新增全局位置缓存。
- 新 updater 旁读反例先红（11 被 factor 变化变成 10），现并入既有 lazy false/true 行为矩阵，保留所有连续更新/恢复派生断言，并断言来源总计两次（初始化悬挂尝试+完成后重算），factor 变化不重算。fallback 自身错误只执行一次新增同名回归。

### 本轮当前进度

本轮全量 unit 64 文件 500 项、browser 28 文件 208 项、类型与 build 均退出 0，独立约束和精简 actualdiff 复核通过。相对新 index 的生产和测试净减少 16 行；退出的运行职责是额外初始状态对象/read 入口，以及成功完成读取的整套回退构图。read 注释同时清理不存在的 base-state、模板占位与误导 snapshot 指引；注释删除不作为运行结构改善的证据。

### 本轮最终验收与保留边界

- 验证日志为 agents/run/foundation-async-redo/final-unit.log、final-browser.log、final-types.log、final-build.log，对应 .exit 全为 0；最后仅文档及 EOF 空白调整，不重跑无关测试。
- root 实际页面：Button 各外观/尺寸/disabled/loading 显示完整；异步页等待→完成及刷新后拒绝均显示正确，AX 与截图配对保存 button-actual.png、async-completed.png、async-rejected.png。本轮 dev session17054/PID121260 已停止，5173 监听数为 0。
- 暂存基线 SHA256 为 ca0abc8b803cb496bed2b479cec8131376bd93fab9cb33746336e6eb7d991619，最终逐字节一致。28 个已暂存文件全部保留，本轮 6 文件工作树差异未暂存，未执行 Git 回退/暂存/提交/配置。
- 生产+测试精确差异：createAsyncSignal.ts +31/-44，read.ts +26/-47，createAsyncSignal.test.ts +10/-2，read.test.ts +10/-0，合计 +77/-93，净 -16；SPEC 与 Plan 另记文档差异。注释清理与实际运行机制改善分别解释，不把减少行数当充分证据。
- 仍保留：计算函数来源的唯一 initial native memo、尚未完成 updater 的函数组合、lazy 首写原生初始化探查。它们未搬去其他层；不能宣称全部输入都只有两节点或所有 pending 管理都已消失。
- 临时原型及不必要的 22 份旧文件副本已清理；保留完整 index/dirty 原始 patch、baseline hash、实际失败日志与结果、三张页面图，以及复现 70→0 构图证据所需的 6 份旧来源文件和测量脚本。无本轮剩余实施项。

以下是前轮实施历史，仅供证据，不是本轮默认保留的设计。

## 目标与当前事实

本轮从用户已回退后的 HEAD `4225c00` 开始，行动前工作区和暂存区均为空；快照保存在 agents/run/foundation-async-chain。上一轮 createStateView/fields 结构方案已退出，本轮不恢复它，不重划现有 State/mapStateView 构造。

目标是让 Promise 在 Foundation 的 State、Source、StateView、val、Effect 与跟随链中进入 Solid 2 的计算、等待、错误和清理机制，由 UI 处理异步。默认 pending/rejected 不再伪装成 undefined；明确请求的 defaultValue/errorValue/onRejected 仍是独立的可选业务契约。

## 文件职责与允许改动

| 区域 | 当前问题 | 本轮职责与落点 |
| --- | --- | --- |
| createState/promise-like.ts | then(set)自行结算，吞错为undefined | Promise 转换直接进入 native 计算；显式fallback仅在明确配置下生效 |
| createState/state-view.ts | 全局缓存复用第一owner创建的view | 缓存身份与消费者owner解耦，固定Promise结果由native计算保存；不自建队列或清理注册体系 |
| createState/createAsyncSignal.ts | setter先读pending派生来源会抛NotReady，lazy首次write又可能被初始计算覆盖 | 选择native初始化/写入机制，同时保留pending updater、lazy及ownedWrite边界 |
| createState/source.ts、read.ts、createEffect.ts | Promise类型人为附undefined，显式泛型可能把Promise交动作 | Source/Val/Effect统一完成值类型，tuple位置和函数数据语义保留 |
| createState/createReactiveRunner.ts、hooks/stateUtils.ts | 动作在compute执行，结果只存local；followState在计算中写State | runner建立真实native结果，必要动作分compute/effect；followState读取和转换留compute，写入留effect |
| foundation UI入口 | 尚无包根异步边界 | 只公开最小原生Loading/Errored，验证真实UI的pending/完成/失败/释放 |
| SPEC.md、doc/State API契约与示例.md | 仍描述旧undefined及runner契约 | 同步成立的新契约、示例和native接入白名单 |

## 实施顺序与验证

1. 保留基线，审清原生memo观察释放、isPending/lazy初始化、Loading/Errored及现有调用方。先写能识别实测缺陷的回归，记录红结果。
2. 修默认Promise转换及缓存归属，保留同owner/重复val读取稳定身份；验证第一owner释放后第二owner、effect重算不会无限创建异步节点，原生pending/error真实可见。
3. 修pending派生来源的直接写入，验证普通set(7)、pending updater、首次lazy读/写与计算域写入限制。不得catch NotReady、补flush或扩大ownedWrite许可。
4. 对齐Source/Val/Effect完成类型，逐项根据tsc报错修必要泛型消费者；保持State/map节点与函数值、thenable行为，不恢复旧结构方案。
5. 修runner与followState compute→effect职责；getResult真实读取native pending/error/完成值，dispose停止通知并按可成立契约保留最后结果。
6. 接入Loading/Errored，写实际异步UI浏览器回归；同步SPEC和API文档。
7. 通过全类型、全单元、全浏览器和build，再启动本轮dev服务，实际查看Button与异步UI页面；核对DOM、事件、换源、卸载，停止本轮自建服务。
8. 独立约束与精简复核，检查逻辑链及补偿机制；更新本Plan的失败尝试、修正依据、最终验证与未完成项。保留用户stage/dirty，不Git回退、暂存、提交或配置。

## 实施前待证机制（结论见实际机制与失败修正）

- 缓存只读memo必须不属于第一个消费者，且不能通过简单删缓存制造effect重算永久pending；优先native无owner观察式memo，具体入口与资源释放由微型回归验证后决定。
- native isPending可在命令上下文启动lazy而不消费结果，但不同owner上下文存在首次NotReady差异；不得未验证便当通用异常捕获。需同时证明普通计算写入仍拒绝。
- 显式defaultValue若本身异步，完成类型与初始展示行为需通过原生计算衔接；onRejected及errorValue不能因默认传播改造而消失。
- runner旧单回调仅作为计算契约存在；生产followState迁入两阶段，其他必要测试按当前用户新契约审查，不为旧动作时序另造调度器。

## 当前进度

实现、全量验证与实际页面验收已完成。最终 unit 64 文件 499 项、browser 28 文件 208 项全部通过，类型与构建均退出 0；独立约束与精简审查通过。失败尝试与修正依据保留在下文及本轮 agents/run 目录。

## 实际机制与失败修正

1. 默认 Promise 原先 `.then(set)` 跳过 native pending/error；现在固定 Promise 用无 owner 的原生 `createSignal(fn)`，只公开读取。先试 ownerless memo，但全部观察结束会 AUTO_DISPOSE，复读重启异步 flight，错误短暂失真；该候选退出。固定 Promise 没有业务响应式上游或外部资源，WeakMap 生命周期随来源 GC，不将此方案外推到任意派生。
2. 显式 fallback 用来源选择、错误边界和最终读取各自负责；保留一个 lazy memo 缓存 default getter 产生的 Promise 身份。原 readError memo 已删除，在 error 分支选择时取一次即可。正式测试覆盖默认/错误 Promise、完成 undefined、onRejected 动作可写状态且卸载后停止。
3. 实验 `val(p, () => Promise.resolve(3))` 在每次 compute 重跑现场制造新 Promise 导致无限重试，已停止并保留日志。它违反既有“消费处不现场创建新 Promise”约定，不新增全局调用位置缓存；改测稳定异步默认来源，以及单次 stateView 转换 getter 身份。完成后默认函数不执行、不订阅的断言仍保留。
4. setter 直接读 pending 来源会抛 NotReady。函数初始来源现在保存未解包的同步结果记录；只在间接读取上游未完成时原生挂起，记录承接纯 updater，首次完成消费一次，后续依赖变化恢复裸派生。直接返回旧 Promise 若由 initial memo 提前等待，会在旧结果到达时覆盖较晚赋值；因此 initial memo 返回 captureResult 记录，保留已验证的晚到不覆盖行为。
5. 首次 lazy write 仍需启动原生来源，避免初始计算覆盖写入；仅启动探查在 null owner 执行，实际 setter 保留原上下文权限。初始独立 probe 漏 development 条件，误将 root owner 当合法命令；真实 dev native/UIKit 均拒绝任何普通 root owner 内写入，正式回归保留该拒绝，并以真正 Effect 动作验证合法写入。不扩 ownedWrite。
6. runner 原 compute 动作及局部结果退出，原生 memo 拥有结果，普通 Effect 拥有可选动作。尝试 RenderEffect 动作仍被原生 dev 写限制拒绝，已改正确的普通 Effect；followState 的读取变换在 compute、写入在动作，不模拟旧同步首写。thenable 先经标准 Promise 协议吸收，再由原生计算等待。
7. 新增最小原生 Loading/Errored 出口和 AsyncState 示例；真实浏览器验证等待→完成、失败展示、换源丢弃迟到与卸载。dev 页面由 root 独立核验，本轮服务最终会停止。

## 最终验收

- 最终全量：final-unit-second.log（499 项）、final-browser-third.log（208 项）、final-types-second.log、final-build-second.log，各自 .exit 均为 0。
- Button 与异步页面已由 root 实际浏览器核验：Button 外观/尺寸/disabled/loading 完整；异步页初始等待、完成点击显示请求已完成、刷新后拒绝显示原始失败，无白页。截图 button-actual.png、async-completed.png、async-rejected.png 保存在本轮运行目录；本轮 dev session10619 已停止，5173 无监听。
- 独立约束与精简 actualdiff 复核通过：删除 then(set)、假同步 local result、compute 写状态，readDefault 的单次转换身份职责有正式回归，readError 冗余层已删除。暂存差异仍为空，SHA256 与基线一致；未执行 Git 回退、暂存、提交或配置。


全量第一轮 unit 64 文件 498 项通过。browser 第一轮 207/208 通过，唯一失败是新增示例后首页条目数量从 11 变为 12，既有断言仍写 11；仅同步同名 Dashboard 浏览器测试的数量断言，原 DOM、样式、导航断言全部保留，重跑 browser 全量。


最后补齐 followState 异步 transform 的既有运行能力声明（AsyncValue<T>），真实完成值回归由 498 增至 499；它是完成后独立写入，不把目标变成该异步计算源，失败仍按原生 Effect 错误机制上报。最终 type/unit/build 在该修改后重跑通过，browser 第三轮测试的实际运行机制与最终一致（后续仅类型与文案修改）。跨 Foundation 来源切换流程回归已移入 foundation/test 中文领域文件；相邻 AsyncState.example 测试只测试同名示例。无本轮剩余实施项。
