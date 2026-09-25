# Style System 全量审查与第一层清理

## 当前状态与目标

2026-09-20，用户要求在第二层 `envPayload` 开始前清理第一层，并要求测试通过、清理后反向质疑是否进行了不必要的清理。随后用户明确要求：如果分析没有覆盖整个 Style System，先停止正在执行的工作，写 Plan。

此前分析只覆盖第一层改造涉及的文件及相邻调用链，没有完整覆盖整个 `src/style-system`。制定本计划时先停止实现，随后完成下文记录的全量审查。用户授权后，已把确定问题的清理与基础色、业务色及描述性 Cluster 选择完善一起完成；当前全量验证通过，证据见文末，不以此前测试通过替代本次验收。

目标是先取得全系统职责与调用链证据，再决定保留、清理、合并或拆分。全量审查不等于全量重写，也不预先认定此前提出的每个清理建议都正确。

原始需求继续以 [Value 状态移除与 Variable 创建、延伸及聚合改造](Value状态移除与Variable创建延伸及聚合改造.md) 和用户对话为准。本计划补充全量审查与第一层清理流程，不替换原计划的完整需求；第二层保持未开始。

## 暂停现场

暂停前已经产生未验收的工作区改动，后续审查必须把这些改动本身作为候选方案，而非正确基准。

| 区域 | 已产生的候选改动 | 验证状态 |
| --- | --- | --- |
| Variable 与 Key | Key 直接读取 Variable 名称；成员解析收敛到依赖激活；简化解析中的类型转换 | 未完成类型及完整行为验证 |
| 编译链 | 稳定内容返回单值；状态赋值结果归 Variable 编译；编译上下文归 Rule 编译；状态地址转换归状态注册模块；分支排序移出循环 | 未完成类型及完整行为验证，边界需要重新审查 |
| 材料与 Button | Button 私有材料集中到 `value-material/button.ts`；移除通用材料中的 Button 配方；收回部分中间别名；新增颜色名称改用完整单词 | sub-agent 报告 Button 定向浏览器测试 11/11 通过；不能代表当前整体工作区通过 |
| 文档 | 材料路径和直接使用说明随候选迁移更新 | 需要与全量审查后的最终代码统一 |

保留现场，不自动回退、暂存或提交。此前第一层的 162 项单元测试、62 项浏览器测试和构建通过，属于清理前快照；当前快照尚未取得全套验证。旧计划中的完成结论不覆盖这些新改动。

## 必须保留的需求与边界

- Value 只保存稳定内容与必要依赖；状态需求归 Variable，不重新引入智能 Value。
- Variable Cluster 接收通用选择函数，直接使用表现为默认成员，显式调用选择成员；所选成员保留自己的 State Condition。
- 层级选择固定在定义或编译阶段，状态变化不切换层级。
- State Condition 的主体约束、登记优先级、组合匹配、未知名称诊断保持完整。
- Rule、Declaration、Variable、Value 和延迟内容函数在最终消费前保留所需对象身份。
- 业务指令表达目的；Theme 定义配方，保留有语义作用的重复，不引入调配器。
- 保留规则登记原子性、声明顺序、原生 CSS 级联、变量覆盖、依赖激活与替换、循环检测、挂载失败保护和打包消费。
- 保留 Button 的主题、variant、tone、size、交互及禁用效果；不能把行为变化伪装成清理。
- 不实现 `envPayload`，不预建第二层缓存、身份系统或上下文设施。
- 不改相邻项目与无关组件，不修改 Git 暂存区，不提交或推送；源码、类型和字段使用英文，说明与注释使用简体中文，不新增只读类型或样式缩写。

## 全量审查范围

执行时先重新枚举 `src/style-system` 的全部文件，包括未被之前改动触及的文件、新增文件、删除或迁移前的对应实现。建立逐文件覆盖表，记录路径、行数、职责、消费者、阅读状态、判断和验证依据；不得只记录目录级“已看过”。测试截图等产物记录来源，不作为源码职责审查的替代。

| 范围 | 必须回答的问题 |
| --- | --- |
| `index.ts`、`打包后的公开入口仍能生成样式.test.ts` | 公开协议是否唯一；注册与按需定义在打包后是否保持；是否泄漏内部步骤 |
| `core/*` | Condition、Key、Declaration、Rule、Root、Valuable、Value、Variable 各拥有什么事实；注册、身份、生命周期是否有重复来源 |
| `compiler/*` | 从完整 Rule 到 CSS 的步骤是否连贯；上下文、状态赋值、依赖、记录和输出的归属是否自然；是否存在旧协议与额外适配 |
| `state-conditions.ts`、`selectors/*` | 主体状态与普通地址是否混淆；排序、去重、优先级及选择器权重怎样共同成立 |
| `properties/*` | Key 定义、别名与注册是否保持同一来源；重复是否来自必要属性清单，还是无效转发 |
| `values/*`、`values/functions/*` | 所有组合工具是否保持延迟读取、身份和稳定内容；自定义 CSS 函数、动画、列表、阴影与过渡依赖是否完整 |
| `value-material/*`、`value-material/color/*` | 每个材料的定义目的与状态归属；通用材料和组件 Theme 的边界；配方重复与无用别名的区别 |
| `component-handle-material/*` | 组件角色与材料是否混同；声明目标、继承和外部覆盖是否清楚 |
| `mixins/*` | 是否交付完整效果；是否出现只转发、逐项复刻属性或泄漏组件私有知识 |
| `fnkit/*` | Lazy Copy 与 Derivable Object 的实际消费者、存续理由、状态及复制责任；不能因名称像通用工具就预设移动或删除 |
| 全部相邻测试 | 断言是否覆盖现役需求；旧断言是否需要迁移；重复测试是否有不同失败路径；不能为测试数或整齐而删用例 |
| `architecture.md`、`样式系统对象与行为.md`、`样式系统命名.md`、`主体状态条件.md`、`编译器修正草案.md` | 区分现役契约与历史记录；核对名称、实现与文档，不以旧的代理结论替代用户要求 |

同时追踪系统外的正式连接：根 `Architecture.md`、样式文件写法、Button 定义/样式/测试、包入口、基础 CSS 材料来源、应用挂载入口、测试及打包配置。只为确认真实输入输出读取这些连接；修改仅限全量审查证明必要的直接接管项。

## 执行顺序与产出

### 1. 固定事实与覆盖清单

先区分原有暂存内容、暂停前清理差异、未跟踪文件和生成产物。完整读取全量审查范围，逐文件登记；被工具截断的内容必须补读。达到 1000 行的代码执行完整职责审计，低于阈值也检查完整职责，不以行数决定拆分。

产出：完整文件覆盖表、现役入口与调用关系、尚未读完或证据不足的位置。此阶段只读，不一边发现一处问题就立即修改。

### 2. 从正式入口走完业务链

至少追踪以下端到端场景，并记录每步的输入、输出、事实拥有者和副作用：

1. 组件样式登记、声明规范化、源账本、编译、挂载。
2. 普通属性、Value、延迟组合函数到最终 CSS 文本。
3. Variable 作为内容与声明目标，默认值、状态值与显式覆盖。
4. Cluster 默认成员、显式成员、嵌套引用、依赖激活与循环诊断。
5. State Condition 单独及共同成立，普通嵌套地址与不同选择器权重。
6. 根变量、注册、动画、自定义函数等依赖的激活、替换与退出。
7. Theme 材料、组件角色、Mixin、Button Rule 与外部覆盖。
8. 打包入口及应用挂载后的真实运行结果。

产出：能够连续解释以上场景的调用链，而非只有模块名称的图。

### 3. 全量分析后确定清理清单

每个候选问题填写：事实证据、原需求、复杂度来源、保留会怎样、删除会损失什么、候选改动、责任接管位置、受影响调用者与验收方式。

特别复审暂停前已经修改的部分：

- Cluster 字段转发与成员解析是否各有不可替代的作用；不能为减少行数引入更隐蔽的 Proxy 或第二份身份状态。
- 稳定单值协议是否确实缩短链条；编译上下文迁移是否仅搬走耦合，是否造成新的跨文件依赖。
- Variable 状态交集是否为优先级必需；减少重复计算与改变组合语义必须分开，不承诺未经证明的线性规模。
- 默认内容是否真的可以复用；不同消费地址和依赖副作用存在时，不为去重擅自加入缓存。
- Button 配方归属是否完整；保留有级联作用的声明和有语义用途的常态材料，不能把表面重复统一删除。

按《代码拆分》同时比较保留、内部整理、合并和拆分。两种结构都没有具体失败信号时维持现状；没有充分依据的候选不进入实施。先交回全量分析与清理清单，本次“先写 Plan”的指令不授权自动恢复实现。

### 4. 获准后按责任闭环清理

依赖顺序由全量分析决定，通常先确定核心协议，再接管编译消费者，最后整理材料及文档。每个改动同步接管直接消费者、测试、诊断和现役说明；不先拆出一批空壳或兼容转发层。暂停前的候选改动逐项保留、修正或撤回，不能因为已经写出而免于质疑。

可以用当前任务内的 sub-agent 承担相互独立的范围；共享协议先由主 Agent 确定，避免并行修改互相覆盖。独立审查者不参与所审代码的实现。不得用另建用户任务或跨任务发消息代替 sub-agent。

### 5. 验证行为与责任接管

先运行与实际改动对应的测试，补充能够区分正确行为和错误清理的回归用例。随后对同一最终工作区运行：

| 检查 | 通过条件 |
| --- | --- |
| `bun run type-check` | 类型检查通过 |
| `bun run test:unit` | 全量单元测试通过 |
| `bun run test:browser` | 全量浏览器测试通过，包括 Button 和正式 CSS 计算结果 |
| `bun run build` | 生产打包与声明文件生成通过 |
| 差异与完整性检查 | 无空白错误、旧入口遗漏、无授权改动和生成产物混入；暂存区保持原状 |

失败必须查明并修复，不能通过跳过、弱化断言或改掉原需求取得通过。记录最终实际命令、结果及覆盖范围；早于最后一次相关修改的测试不能冒充最终验证。

### 6. 反向质疑清理本身

在功能验证之外逐项检查最终完整差异：

1. 如果恢复这项清理前的写法，会重新出现哪个已证实的问题？无法指出的改动优先撤回。
2. 是否只是改名、搬文件、减少行数或新增转发，理解路径其实没有缩短？
3. 是否删除了不同作用域、级联权重、依赖时机或诊断所需要的重复？
4. 是否借第一层清理提前加入第二层的环境、缓存、可扩展框架？
5. 原先难以理解的责任是否真正被收回，还是被藏进更大参数对象、类型断言或辅助函数？
6. 全量覆盖表是否每个文件都有结论；“保留”是否有具体理由，而非默认无问题？

发现不必要改动时撤回该项，再检查受影响行为。最终交付列出实际改善、被否决的清理、刻意保留的必要复杂度、全量测试结果以及尚未解决的问题。存在未解决的必要清理或缺失验证时，不宣布第一层清理完成，不进入第二层。

## 依据

- [Plan 写法](../how-to-write-plan.md)：记录范围、顺序、落点、验证与未决，不把候选结构写成现役事实。
- [代码维护](../../../ai-rules/rules/Code-代码维护.md)、[代码拆分](../../../ai-rules/rules/Code-代码拆分.md)：从完整文件和正式调用链取得问题，双向判断保留、合并与拆分。
- [领域边界](../../../ai-rules/rules/Code-领域边界.md)、[公共协议归属](../../../ai-rules/rules/Code-公共协议归属.md)：让事实和协议归实际定义者。
- [第一性原理](../../../ai-rules/rules/Code-第一性原理.md)：同时拒绝无依据的清理和维持自造复杂度的补偿。
- [代码修改验收](../../../ai-rules/rules/Code-代码修改验收.md)：需求效果、代码质量与责任完整性分别验证，测试通过不能替代结构结论。

## 未决事项

全量审查后的确定问题与待裁决项见下文。F1–F11 已按文末记录修复；fnkit 保留独立工具，仅修已证边界错误。尺寸、间距、字号主题入口、公共包导出扩展等未决项不纳入本次迁移。以下审查记录保留发现时的事实，当前修复与验证见文末。

## 实施前全量审查结果：当时不能通过整体维护验收

2026-09-20，按用户追加要求，由主 Agent 与两个只读 sub-agent 完成逐文件审查。范围为 `src/style-system` 的全部 80 个文本文件（75 个 TypeScript、5 个 Markdown），另检查 1 张已跟踪测试截图及正式消费、基础 CSS 和启动/发布连接。不是只检查本次差异。所有系统内文本文件均完整读取，最长文件为 `compiler/compile-css.test.ts`，615 行；生产文件最长为 Button Theme 的 165 行。行数不作为通过依据。

下列发现及逐文件表保存修改前快照；后续用户复核揭示材料 Cluster 迁移仍不完整，因此表中对 tone/action 等材料的“通过”只覆盖当时检查的局部职责，不能作为完整需求通过。新增 F11 与原第一层 Plan 一起控制本次修改，最终结果另记。

审查阶段没有修改实现、测试或暂存区，仅补充本计划的审查记录。当时判断分为：

- **确定问题**：静态调用链与运行反例足以证明不满足现有责任。
- **待裁决**：事实已确认，但不能仅凭当前代码确定应保留还是迁移。
- **静态保留**：职责、阅读路径和修改边界有成立依据，不表示本轮已运行全套测试。

### 一、确定问题与证据

| 编号 | 位置 | 结论与影响 |
| --- | --- | --- |
| F1 | `core/css-variable.ts:58` | 当前类型检查失败。暂停前把成员解析中的中间量改成 `Variable` 后，`typeof current === 'function'` 分支被 TypeScript 缩窄成 `never`，调用报 TS2349。这是暂停前主 Agent 清理引入的问题，不能归因于用户设计。 |
| F2 | `value-material/motion.ts:19–30`、`src/css/tokens/motion.css:18–22` | 同一个 `--motion-duration-fast` 有两位定义者，分别读取 `--sys-motion-scale` 与私有 `--motion-duration-multiplier`。Button 的 `clickable()` 实际激活后者；无 layer 的根赋值覆盖原 tokens layer，改变既有消费者的系统倍率语义。 |
| F3 | `value-material/color/edge.ts:9`、`src/css/tokens/color.css:175,294` | 使用 `line` 会以新根配方重定义全应用 `--color-line`，覆盖基础 CSS 的明暗配方。当前 Button 不消费此材料；这是消费该材料即可触发的跨组件影响，不能写成 Button 已触发。 |
| F4 | `compiler/compile-css.ts:31–42,90–103` | 依赖替换只接管同址定义的输出，没有接管该定义先前激活的子资源。后续依赖替换已解析函数时，旧函数独有的根变量仍留在结果里。全局队列保留了“曾访问”，却没有完整表达“最终仍需要”。 |
| F5 | `values/transition.ts:10–12` | `Transition` 接受 Variable 作为目标，但只经 `propertyName()` 取得名称，未激活必要定义。仅把注册变量用于过渡目标时，CSS 有过渡名称却没有 `@property`。这条名称消费路径没有完整承接 Variable 使用语义。 |
| F6 | `core/css-variable.ts:79–94,123–127` | Cluster 明确提供 `name` setter，但注册闭包仍使用构造时的 `bareName`。通过 Cluster 改名后，引用指向新名称，`@property` 仍注册旧名称。需要统一身份契约，不能靠新增只读类型或回退层掩盖。 |
| F7 | `selectors/interaction.browser.test.ts:9–31` | “hover 与 active 的交集不增加权重压过变体”已不能证明其标题：状态写 Custom Property，变体写 `color`，两者不竞争同一声明目标。即使状态选择器恢复错误权重，测试仍可能通过。 |
| F8 | `compiler/compile-css.test.ts:53,310,397,530`；状态组合测试 | 存在同一递归 Rule、同一 Mixin 方向转换的重复测试；同时旧 VariableOverrides 反序及重复名称取最后内容的有效断言没有完整迁移。测试维护同时存在冗余与缺口，不能只做删重。 |
| F9 | `fnkit/lazy-copy.ts:27`、`fnkit/derivable-object.ts:49` | 稀疏数组首次写入会丢失尾部空槽对应的 length；派生对象显式定义不可配置属性会触发 Proxy 不变量错误。当前无正式消费者，影响范围局限于这些独立工具，不能据此扩大重写编译器。 |
| F10 | 根 `Architecture.md`、`主体状态条件.md:26–27`、palette 文件头、旧测试说明 | 当前根架构仍说 Style System 不承接 Button 配方，与已采用的 Theme 材料归属冲突；State 示例省略了影响权重的 `:where`；palette 查询仍被称为新的 Variable Cluster。说明会把后续维护带回错误前提。 |
| F11 | `value-material/color/*`、`value-material/button.ts`、`Button.style.ts` | 第一层仅包装了部分上层配方，仍公开并使用分散的强弱、Hover/Active 材料。基础色与业务色均须通过实际 Cluster 聚合；描述性选择允许，状态归成员自身。此项是原需求未完成，不能推迟到第二层环境 API。 |

F2、F3 的浏览器验证使用项目当前 CSS 和实际编译结果，在独立无头 Edge 页面中完成，不修改测试文件：

| 场景 | 激活前 | 激活后 | 证明范围 |
| --- | --- | --- | --- |
| 原有消费者读取 `--motion-duration-fast`，应用设置 `--sys-motion-scale: 0` | `transitionDuration = 0s` | `transitionDuration = 0.12s` | 激活新材料绕过原系统倍率；并非只影响新增组件 |
| 原有消费者读取 `--color-line`；固定 `--color-fg: black`，禁用过渡以读取终态 | `oklch(0.42 0.006 260 / 0.18)` | `oklab(0 0 0 / 0.18)` | 新材料改变原有线条颜色，和自身选择器是否匹配无关 |

F4 的内存复现：源 Rule 先消费旧 `--audit-size()`，旧函数读取带根值的 `audit-old-resource`；另一源 Value 的依赖稍后消费同名新函数，新函数只返回 `2px`。最终函数体已是 `result: 2px`，但结果仍包含 `:where(:root) { --audit-old-resource: 7px; }`。现有“后续替换”测试只检查函数体，现有“旧状态默认值退出”测试没有覆盖已访问的外部子资源。

F5 的内存复现：给 `audit-transition` 配置 `<length>` 注册，再仅消费 `transitionValue([registered, '100ms', 'linear'])`。输出为 `transition: --audit-transition 100ms linear`，没有对应注册。修复应由名称消费责任承接依赖，不能要求业务额外声明一次变量来补偿。

F6 的内存复现：创建名称为 `audit-before` 的注册变量，通过默认 Cluster 设置 `name = 'audit-after'`。结果同时出现 `var(--audit-after, 1px)` 与 `@property --audit-before`。这说明当前主动暴露的写入能力与定义生命周期不一致；是否保留改名能力须连同其责任一起确定。

F9 的内存复现：`lazyCopy([1, ,])` 的副本写入索引 0 后，来源长度仍为 2，副本长度变为 1。另对 `deriveable({ count: 1 })` 执行 `Object.defineProperty(item, 'count', { value: 2, configurable: false })`，触发 Proxy 不变量错误；省略 `configurable` 的例子在此次 Bun 运行中没有抛错，因此不把它列作已证反例。

### 二、复杂度的归属判断

**Variable 接管状态是必要复杂度，当前不能据此否定设计方向。** 一组状态只改写自己的 Custom Property，外层表达式保持一次引用，符合用户约束。为维持登记优先级且兼容不同选择器权重，需要表达状态交集或提供等价机制；直接删交集会改变语义。当前单个 Variable 的组合仍可能达到 `2^n`，不应宣称整个系统已经严格线性。

**稳定内容的单值返回有直接收益。** 当前 `compileValue()` 已返回 `string | undefined`，旧 `ValueResult[]` 不再是现役协议。暂停前把状态赋值结果归 Variable、路径转换归状态模块的方向成立，不能重复使用清理前的发现；但类型错误和整体接管未验收，因此不能把方向成立等同于实现完成。

**编译器文件不需要因为相互调用就强行合并。** Rule 结构递归、稳定内容求值和 Variable 自身赋值，是同一编译领域内部的不同结果。Value 引用 Variable，Variable 的取值又包含 Value，因此递归调用本身有数据模型依据。`RuleContext` 的类型引用也没有单独证明领域越界；应检查上下文是否只传必要消费事实。真正需要重审的是 F4 中资源替换生命周期不完整，而非增加一个 `common/types` 文件来消除表面依赖。

**Cluster 字段转发不应全部删除。** 可调用对象需要同时表现为默认 Variable，JS 函数的内置 `name` 也需要正确处理；明确的字段门面有存在理由。当前 Key 和引用编译已直接读字段，依赖激活才解析默认成员身份，原先三个地方重复解开的现象已收敛。仍需处理 F1/F6，并给嵌套 Cluster、字段写入及依赖身份补齐相应证据；不因显式字段较长就换成更隐蔽的通用 Proxy。

**Theme 配方集中合理，系统 token 的拥有者却尚未统一。** 当前 `value-material/button.ts` 已集中 Button 的颜色、层级与交互配方，按属性再拆会重新打散同一用途。F2/F3 的问题来自同名全局材料拥有两个不同定义源。应先决定材料是在引用已有 token，还是拥有独立配方，再处理名称与根定义，不能仅改文件位置。

### 三、待裁决项与否决的不必要清理

| 项目 | 已确认事实 | 当前判断 |
| --- | --- | --- |
| 尺寸、间距、字号两套入口 | TS 的 `space-scale-*`、`size-scale-*`、`font-size-normal/large` 与基础 CSS 的 `space-*`、`size-*`、`font-size-default/lg` 初始值相似但没有连接 | 可能是未完成的名称迁移，也可能是刻意独立材料；不能只按数值相同合并。需要裁决整个 UIKit 的主题调整入口。 |
| fnkit 存续 | `deriveable → lazyCopy` 及其测试形成封闭岛，无正式源码消费者，公共 index 未导出 | 不能判现役必要性已通过，也不能自动删除用户此前单独讨论过的能力；先决定独立保留还是退出。不能为保留而强行接入 Cluster。 |
| Button 重复颜色绑定 | variant/tone Rule 多次绑定相同角色，但各自选择器会参与对外级联 | 不是已证安全的删除；必须先验证外部覆盖契约。 |
| Variable fallback 重复求值 | 默认内容参与自身赋值，又作为引用 fallback 求值 | 不同消费状态可能影响依赖地址；不能为了减少次数加入未经证明的缓存。先测其代价与副作用边界。 |
| 公共包入口 | 包根仅导出 `cssRoot`、`compileCSS`；完整样式 API 的打包测试直接以 `src/style-system/index.ts` 为入口 | 当前包根符合其现役文档，但不能把该测试称为外部项目可使用全部样式 API 的证据；若下一阶段需要开放，再明确导出范围。 |

以下结构有保留依据：属性文件表达浏览器协议；`registerPropertyKeys()` 让打包器保留完整注册；Mixin 表达完整效果；`size()` 即使当前仅写 min-height，也有已确定的业务目的；color-mix、font、shadow、transition 等语法应继续在定义端；默认与 disabled 共用的常态配方必须保留；原生声明顺序及相邻块输出不能为减少重复而重排。当前不需要 selector 资格分析器、通用 Theme 调配器、第二层环境设施或全系统框架重建。

### 四、正式调用链审查

| 使用场景 | 当前正式链 | 判定 |
| --- | --- | --- |
| 登记并挂载 | `.style.ts → rule/rules → registerRule → Root.source → compileRules → resolveRules → stringifyCSS → mount` | 登记先完整验证、句柄拥有自己的条目、编译与提交分离，结构成立；不需要新增批处理或挂载层 |
| 稳定复合内容 | `Rule → compileValue → CSSFunction(read) → 原始内容/Value/Variable → 单个文本` | 具体语法留在定义处，状态不在消费表达式展开；保留 |
| Variable 内容及目标 | `compileValue → compileVariableReference`；目标进入 `compileVariableDeclaration`；自动赋值回到本次 Rule 输出 | 职责分工成立；依赖名称入口 F5、身份 F6 未收口 |
| Cluster | 创建时捕获默认成员；显式参数选择；字段服务普通读写；成员身份服务依赖去重 | 方向成立；当前 F1 阻止类型验收，不能算实现通过 |
| 状态匹配 | 中央登记/规范化 → Variable 自身分支组合 → 条件地址 → CSS 级联 | 状态归属合理；测试证明 F7 失效，不能据旧测试宣称所有权重契约已覆盖 |
| 依赖生命周期 | `onActive → pending → 各定义输出 → 同址替换 → 最终 records/defaults` | F4 未通过，缺少被替换定义与其独有子资源的完整接管 |
| 材料到组件 | `基础 CSS/Theme 材料 → 组件角色 → Mixin/Rule → Button` | Theme 和角色分工成立；F2/F3 让一项局部消费重写全局材料，整体未通过 |
| 应用启动与打包 | 包/Example/Storybook/缩略图静态导入 → 宿主准备 → mount → render | 当前静态顺序可追踪；没有引入组件渲染期间的编译或第二层机制 |

### 五、逐文件覆盖与维护判定

下表路径相对 `src/style-system`，行数为当前完整文件行数。“保留”仅表示本次静态职责和维护路径成立；“问题”对应上文证据；“待定”有明确未决责任。相关测试共同受 F1 阻止整体类型验收，表中不把静态阅读写成测试通过。

| 文件 | 行数 | 职责、消费者与判断 |
| --- | ---: | --- |
| `index.ts` | 23 | 内部公开入口与属性注册；组件和打包测试消费；保留，包级导出边界见待裁决表 |
| `打包后的公开入口仍能生成样式.test.ts` | 31 | 单独打包样式入口并验证声明/Cluster/注册；有效，但非完整包导出验证 |
| `core/css-condition.ts` | 37 | 条件与原生地址便捷构造；Rule/依赖使用；保留 |
| `core/css-declaration.ts` | 17 | 声明二元协议与识别；rules/Mixin 使用；保留 |
| `core/css-key.ts` | 55 | 名称注册、别名、Key 识别及输出名称；声明/编译使用；保留，不使其承担材料依赖副作用 |
| `core/css-rule.ts` | 109 | 路径与批量声明规范化、原子登记；业务入口；保留，无需按每种输入拆出适配文件 |
| `core/css-root.ts` | 72 | 唯一账本、句柄、快照编译与宿主提交；应用使用；保留 |
| `core/css-root.browser.test.ts` | 276 | 挂载、失败保护、状态交集、实际 CSS 计算；覆盖有效，需补依赖后续替换子资源路径 |
| `core/css-valuable.ts` | 16 | 按需依赖及消费地址共同协议；内容/变量/编译使用；保留 |
| `core/css-value.ts` | 38 | 稳定 Value 与延迟函数协议；内容定义使用；保留，已退出状态 |
| `core/css-value.test.ts` | 17 | 稳定内容及旧状态输入拒绝；覆盖有效 |
| `core/css-variable.ts` | 145 | Variable 状态/根定义/注册与 Cluster；问题 F1/F6；同领域内部角色不要求再拆文件 |
| `core/css-variable.test.ts` | 43 | 条件输入与默认/显式成员；有效但缺字段身份一致性反例 |
| `compiler/compile-css.ts` | 127 | Rule、派生依赖、自动默认值与最终输出；问题 F4；不能仅凭短文件通过 |
| `compiler/compile-css.test.ts` | 615 | 登记/编译集成与语法/依赖回归；问题 F8及旧说明；应先按责任整理重复证据，不按行数机械拆 |
| `compiler/compile-value.ts` | 31 | 稳定递归、内容调用、循环检查；单值协议可保留 |
| `compiler/compile-value.test.ts` | 164 | 稳定表达式、变量隔离、Cluster、按需激活；有效，激活仍缺目标名称消费路径 |
| `compiler/compile-variable.ts` | 64 | 变量引用和自身状态赋值；职责可保留，组合规模及 fallback 复用不能草率简化 |
| `compiler/css-records.ts` | 4 | 共享最终记录协议；编译与测试使用；小文件仍有单一协议依据 |
| `compiler/css-records.test.ts` | 65 | 顺序、相邻共享、三元记录与原生覆盖；保留 |
| `compiler/state-condition.test.ts` | 41 | 预装/自定义名称、未知分支与稳定 Value；保留 |
| `compiler/state-condition-composition.test.ts` | 47 | 排序与变量隔离；F8：有效旧覆盖未全接管，另有未使用 records 和多余类型逃逸 |
| `state-conditions.ts` | 47 | 唯一注册、排序、查找、状态路径；Rule/编译使用；保留 |
| `selectors/interaction.ts` | 20 | 通用状态选择器及禁用排除；State 使用；保留 |
| `selectors/interaction.browser.test.ts` | 64 | 交互匹配；F7，第一例失去权重证明，其余用例仍有效 |
| `values/animation.ts` | 29 | 动画简写与 keyframes 依赖；公共入口/测试；保留 |
| `values/font.ts` | 25 | 字体简写、必需字段和斜杠；content Mixin；保留 |
| `values/list.ts` | 12 | 空格及逗号列表；Mixin；保留不同分隔语义 |
| `values/shadow.ts` | 26 | 单层阴影补位；集成测试消费；语法责任成立，不因暂无生产调用直接删 |
| `values/transition.ts` | 13 | 过渡条目；clickable 使用；问题 F5 |
| `values/functions/calc.ts` | 11 | 延迟乘法；motion/复合表达式；保留 |
| `values/functions/color-mix.ts` | 20 | 延迟混色及比例；Theme 材料；保留 |
| `values/functions/custom.ts` | 17 | 自定义函数调用及完整定义；公共入口/集成测试；自身职责保留，子资源退出由 F4 接管 |
| `values/functions/transform.ts` | 10 | 延迟位移；interaction 材料；保留 |
| `properties/border.ts` | 7 | 边框 Key；structure；保留 |
| `properties/box-shadow.ts` | 4 | 阴影 Key；appearance；保留 |
| `properties/color.ts` | 8 | 颜色 Key；appearance/interaction；保留 |
| `properties/font.ts` | 7 | 字体 Key；content；保留 |
| `properties/interaction.ts` | 8 | 指针与选择 Key；clickable；保留 |
| `properties/layout.ts` | 46 | 容器排列与子项参与属性；content/Button；角色已有分区，保留 |
| `properties/margin.ts` | 8 | 外边距 Key；公开注册/测试；保留 |
| `properties/opacity.ts` | 5 | 透明度 Key；clickable；保留 |
| `properties/outline.ts` | 14 | 外轮廓 Key；structure；保留 |
| `properties/padding.ts` | 8 | 内边距 Key；content；保留 |
| `properties/register.ts` | 36 | 完整 Key 安装；index 真实调用，打包验证；保留 |
| `properties/size.ts` | 5 | 尺寸约束 Key；structure；保留 |
| `properties/transform.ts` | 5 | 变换 Key；clickable；保留 |
| `properties/transition.ts` | 4 | 过渡 Key；clickable；保留 |
| `mixins/appearance.ts` | 23 | 颜色和层级效果；Button；保留 |
| `mixins/content.ts` | 60 | 文字与内部布局/空间；Button；保留内部完整目的 |
| `mixins/interaction.ts` | 37 | 点击反馈；Button；自身职责保留，受 F2/F5 下游影响 |
| `mixins/structure.ts` | 43 | 主体尺寸与边界；Button；保留，不因 size 单字段删除业务入口 |
| `component-handle-material/color.ts` | 8 | 组件共同声明的颜色角色；Button/测试；保留，与材料身份分开 |
| `component-handle-material/color.browser.test.ts` | 52 | 角色重定义、后代继承；有效，非完整 Button 状态覆盖证明 |
| `value-material/button.ts` | 165 | Button Theme 配方与用途映射；Button；集中归属可保留，F2 影响仍存在 |
| `value-material/font.ts` | 24 | 字号/字重/行高；Button/content 材料；两套调整入口待定 |
| `value-material/interaction.ts` | 22 | 通用点击状态；clickable；保留 |
| `value-material/motion.ts` | 34 | 时长与缓动；clickable；问题 F2 |
| `value-material/opacity.ts` | 5 | 通用禁用淡化；interaction；保留，与 Button 0.56 不应合并 |
| `value-material/radius.ts` | 8 | 圆角材料；Button；保留 |
| `value-material/shadow.ts` | 41 | 阴影材料/基础引用/交互；Button Theme；保留，颜色与形状不按无调用直接删 |
| `value-material/size.ts` | 14 | 尺寸档位；Button；两套调整入口待定 |
| `value-material/space.ts` | 32 | 间距和边界材料；Button/交互；两套入口待定，不合并同数值不同语义 |
| `value-material/color/action.ts` | 27 | 动作基础引用与反馈；Button Theme；保留 |
| `value-material/color/edge.ts` | 12 | 线条与软边缘；文档/可用材料；问题 F3 |
| `value-material/color/palette.ts` | 27 | 已有色阶稳定查询；多材料；职责保留，F10 的 Cluster 说明需修正 |
| `value-material/color/palette.test.ts` | 50 | 查询身份、范围与组合；覆盖有效，F10 说明不准确 |
| `value-material/color/palette.browser.test.ts` | 95 | 九级颜色、主题、局部覆盖及继承；保留 |
| `value-material/color/surface.ts` | 30 | 承载面/交互/透明材料；可用材料；保留 |
| `value-material/color/text.ts` | 18 | 已有前景引用与新交互材料；Button Theme；保留，新名称已修正 |
| `value-material/color/tone.ts` | 61 | 用途色及覆盖入口；Button Theme；保留第一层显式选择 |
| `fnkit/derivable-object.ts` | 53 | callable 派生；只有自身测试；问题 F9，存续待定 |
| `fnkit/derivable-object.test.ts` | 62 | 首读固定/派生/方法 this；局部有效，缺描述符边界，不能证明现役必要性 |
| `fnkit/lazy-copy.ts` | 91 | 写时复制；deriveable/自身测试；问题 F9，随代码岛裁决 |
| `fnkit/lazy-copy.test.ts` | 80 | 深度/密集数组/函数复制；有效，缺稀疏数组 |
| `architecture.md` | 74 | 当前领域内部结构；主要对应代码，但缺 fnkit 现役状态，并需接回未验收现场 |
| `样式系统对象与行为.md` | 302 | 现役协议；第一层语义基本对应，依赖退出保证受 F4 反例否定 |
| `样式系统命名.md` | 101 | 自有命名与原生协议边界；规则清楚，既有 CSS 名称迁移应单独裁决 |
| `主体状态条件.md` | 99 | 主体资格/顺序/状态归属；F10 的权重示例不准确 |
| `编译器修正草案.md` | 262 | 历史裁决与重做依据；保留历史，不把旧 Value 状态继续视为现役；已删除测试的链接需历史定位 |

截图 `selectors/__screenshots__/interaction.browser.test.ts/hover---active--------------1.png` 已查看：是白底交互探针，当前没有截图断言或其他引用。它不是有效的视觉基线，可作为独立产物清理候选，未删除。

### 六、系统外连接与历史接管

完整追踪 Button 的 `Button.tsx`（113 行）、`Button.style.ts`（234 行）、`button.browser.test.tsx`（516 行）及 CSS 对照文件。样式与组件协议分工成立，当前测试的 `appearance()` 未包括 `transitionDuration`，无法阻止 F2；默认视觉一致不能证明主题调整入口一致。

基础来源已读取 `src/css/all-base.css`、`tokens/index.css`、`tokens/color.css`、`tokens/dimension.css`、`tokens/typography.css`、`tokens/elevation.css`、`tokens/motion.css`、`color-utils.css`、`dimension-utils.css`、`reset.css`、`controls.css`、`traits.css`；并追踪 Input 与 Popover 对 line/fast 的既有消费。现役 CSS 是材料定义的另一端，不能把它当作无关历史；但本轮未把相邻 CSS 的全部视觉和命名纳入重写范围。

启动与发布核对根 `Architecture.md`、`src/index.ts`、`package.json`、Vite/TypeScript/Vitest 配置、Example 启动及静态导入、Storybook preview/宿主、缩略图 runner 与宿主。这里只审查它们与 Style System 的实际连接，不宣称整个 Example 应用和所有其他组件都完成全量审查。

对删除的 Subject Condition 注册、说明和两个测试，读取 Git 中迁移前版本并对照现役 State 文件。状态 Value 专属传播断言按用户新要求退出有依据；VariableOverrides 的反序、重复分支与重复 default 断言仍然有效，不能随旧智能 Value 测试一起丢失。旧 Plan 和 compiler-revision 保留历史文字不等于保留旧执行入口。

### 七、审查时验证及当时下一步边界

| 检查 | 审查时结果 |
| --- | --- |
| 全部系统文件静态审查 | 80 个文本文件及 1 张图像完成；逐文件结论见上表 |
| 当前类型检查 | `bun run type-check` 失败，TS2349，F1 |
| 内存编译反例 | F4/F5/F6 已复现，未写入测试或源码 |
| 工具边界反例 | F9 两项已复现；明确排除未抛错的省略 configurable 例子 |
| 真实浏览器探针 | 独立 Node/Playwright/Edge 页面确认 F2/F3；初次 Bun 直接启动浏览器未返回，已终止，未用其作为证据 |
| 差异空白检查 | `git diff --check` 通过；不能抵消 F1 或其他维护问题 |
| 全量单元、浏览器、生产构建 | 本轮未重跑；本轮是审查，不执行修复或声称清理通过 |

建议的后续优先级：先恢复 F1 的可验证基线；再统一 F2/F3 的材料拥有者，修复 F4 的定义生命周期与 F5/F6 的消费/身份契约；接着修复 F7/F8 的证明缺口及 F10 文档；fnkit 与主题调整入口按明确保留目的裁决。获准实施后，仍须在最后代码快照运行完整测试，并按本计划逐项反向质疑清理。

审查时结论：第一层的领域方向可以保留，当时的代码质量与责任完整性不能整体通过。主要缺陷是跨模块身份、定义来源和生命周期没有完全统一，以及测试证明与现役行为发生脱节；不是文件普遍太长，也不是每个模块都需要重写。

## 本次实施结果与当前验收

2026-09-20，第一层材料完善与清理一起完成。实施前 80 个文本文件的覆盖记录保留；最终为 83 个文本文件，新增 3 个测试文件，没有新增编译器生产分层。已有文件按完整差异重新检查，未变部分沿用前文完整读取证据；最长代码文件为 `compile-css.test.ts` 的 601 行，生产材料最多为 `value-material/button.ts` 的 229 行，未出现 1000 行文件。

### 确定问题的接管结果

| 问题 | 实际接管位置与验证 | 当前判定 |
| --- | --- | --- |
| F1/F6 类型与身份 | `core/css-variable.ts` 保留可调用成员资格及返回值诊断；注册读取 Variable 当前名称，不再捕获失效旧名；类型和改名测试通过 | 已修复 |
| F2/F3 全局 token | fast 引用原时长及系统倍率，line 默认只引用原线条；subtle 配方使用独立身份。材料浏览器测试确认系统倍率 0/2 分别为 0s/0.24s，旧线条消费者明暗主题值在消费前后保持不变 | 已修复 |
| F4 依赖退出 | `ResolveOutput` 保存本定义引用的地址，所有替换完成后从源输出筛选可达资源；共享资源由其他消费者维持，最后消费者退出后才移除 | 已修复 |
| F5 名称消费 | `ValueReader.propertyName` 统一激活 Variable/Cluster 依赖；transition 不直接调用 onActive，不读取目标 fallback；回调次数与输出注册分别断言 | 已修复 |
| F7 权重证明 | 变体与状态改为竞争同一 Variable 目标，浏览器验证 hover、active 及交集 | 已修复 |
| F8 测试维护 | 删除两项完全重复的递归 Rule/Mixin 用例；恢复反序、重复状态和重复默认覆盖断言；新依赖测试清理自己的句柄 | 已修复 |
| F9 独立工具 | Lazy Copy 首次写入保留稀疏数组长度；派生对象继续用普通 self 承接字段，仅按 Proxy 约束镜像不可配置描述符；业务 name、写入、删除回源及派生语义测试保留 | 已修复，工具仍独立保留 |
| F10 文档 | 根架构、Style System 架构/设计/命名、State 示例和样式写法与当前出口和 Theme 归属一致；旧 PASS 仅保留为已撤销的历史快照 | 已修复 |
| F11 材料聚合 | palette、brand、action、tone、foreground、surface、line 都支持 Cluster 默认与描述性成员；overlay 状态归 Variable；Button 不再导入分散语气或状态材料 | 已完成接管 |

基础色的 `paletteColor('ink')` 和业务色的 `tone('danger', 'soft')` 使用同一 Cluster 能力。自然色阶数字仍有明确尺度，不强制改成词语；也没有把 Hover/Active 改成 Cluster 选择参数。

独立消费验证额外发现并修复了 Button danger 成员依赖业务补赋值的问题：现在成员自己持有正确的默认色，规则无需额外设置 buttonTone。同一主体可以同时使用强调与危险成员；局部 `--color-tone` 覆盖仍生效，不影响邻居。

### 新增文件的完整覆盖

| 文件 | 职责与保留依据 | 验证 |
| --- | --- | --- |
| `compiler/compile-css-dependencies.test.ts` | 聚焦同址替换后的旧独有资源与共享资源生命周期；与普通有序声明测试失败路径不同 | 单元测试通过，句柄在用例后清理 |
| `values/transition.test.ts` | 证明名称消费激活一次且不读取目标取值；不能用注册输出去重代替回调次数 | 单元测试通过 |
| `value-material/material.browser.test.ts` | 在真实浏览器中验证全局来源、描述性成员、成员状态及脱离 Button 的独立消费 | 5 项浏览器测试通过 |

### 反向质疑：哪些清理被否决

- 没有为减少行数拆开 Variable 与 Cluster，没有换成通用 Proxy；字段转发承担可调用对象的默认 Variable 身份。
- 没有把稳定内容编译和 Variable 状态编译强行合并，也没有新增公共 types/common 转发文件。最终 `compile-css.ts` 为 149 行，依赖边归完整定义，读取名称归内容消费协议。
- 否决“每轮删除不可达资源，再缓存并恢复”的候选，改为队列完成后统一筛选，减少只为中途删除服务的状态。
- 否决 transition 直接调用 Variable.onActive 的候选；它绕开同一材料只激活一次的责任，现由统一 reader 承接。
- 保留有级联意义的 Button 颜色绑定、状态交集和有语义的 Theme 配方重复，不靠删掉行为取得简化。
- 不因为没有生产消费者删除 fnkit，也不为了证明它有用而让 Cluster 依赖它；保留原 mergeObjects 读取链，避免函数载体的 name 抢占业务字段。
- 不统一未裁决的尺寸、间距、字号入口，不迁移其他组件，不重命名既有基础 CSS token，不实现第二层环境或调配器。

### 最终验证与独立审查

| 检查 | 当前结果 |
| --- | --- |
| `bun run type-check` | 通过 |
| `bun run test:unit` | 34 个文件、168 项通过 |
| `bun run test:browser` | 13 个文件、67 项通过；包括 Button 11 项、材料 5 项 |
| `bun run build` | Vite 生产构建与 TypeScript 声明生成通过 |
| `git diff --check` | 通过 |
| 旧入口与边界搜索 | 生产 TypeScript 无旧平行语气/状态出口，无 envPayload、SubjectCondition、新增只读类型 |
| 暂存与产物 | 暂存内容指纹未变化；未提交、未推送；移除本轮测试失败时生成的未跟踪截图 |
| Watchdog | 用户指定 GPT-5.6-terra、High，只读审查完整差异与需求，最终 PASS；测试结果由主 Agent 实际运行提供 |

最终测试之后仅同步文档。第一层完善与本次必要清理已完成；第二层 envPayload 保持未启动。上文主题入口和公共包导出范围的未决，不被本次完成结论偷换成已实施，也不被当作继续扩张清理的理由。
