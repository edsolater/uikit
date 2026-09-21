# Style System 编译器重做计划

2026-09-18。实现已接通；验收与实施选择见文末。本计划保留原目标，实施中撤回的中转层在记录中说明。

## 需求依据与范围

[编译器修正草案](../../src/style-system/doc/compiler-revision.md)是完整需求与问题分析；其“后续裁决与当前状态”覆盖明确冲突的旧结论，其余要求全部保留。本文只规定实施与验收，不替代草案。

目标：纠正取值与编译责任，让业务意图到实现结果的理解链更短。代码行数、测试数量和 CSS 文本是否漂亮，都不是完成标准。

- 修改范围：`src/style-system` 的核心协议、编译器、直接相关材料与 Mixin、测试和文档。
- Button 作为业务验收入口；仅在协议迁移确有需要时调整写法，不改变 tone、variant、size 配方或视觉设计。
- 保留 `compileCSS(): string` 公共入口，不增加公共序列化阶段。
- 不新增依赖、兼容层或新的属性管理体系。只面向现代浏览器。
- 保留用户已有修改与已暂存的完整草案。允许按明确范围暂存、回退；禁止 Git commit，不再整体回退工作区。

## AI Rules 与行动约束

共享规则仍从 [AI Rules Agent 入口](../../../ai-rules/AGENTS.md)进入。以下是本任务采用的具体约束，不改变项目 AGENTS 的统一入口设计。

| 依据 | 本次必须做到 | 验收证据 |
| --- | --- | --- |
| [AI Rules 执行](../../../ai-rules/rules/Agent-AI-Rules执行.md)、[理解监察](../../../ai-rules/rules/Agent-理解监察.md)、[禁止绕过需求](../../../ai-rules/rules/Agent-禁止绕过需求.md) | 完整需求逐项对应改动与检查；新纠正不能抹掉未冲突要求 | 本文验收表逐项有结果，不能只汇报最近改的 Key |
| [第一性原理](../../../ai-rules/rules/Code-第一性原理.md)、[代码抽象](../../../ai-rules/rules/Code-代码抽象.md) | 增加机制前先证明必要；旧实现、旧测试和方便编程都不是需求 | 每项新增协议、类型、状态说明对应需求，以及直接做法为何不足 |
| [领域边界](../../../ai-rules/rules/Code-领域边界.md)、[公共协议归属](../../../ai-rules/rules/Code-公共协议归属.md)、[代码结构划分](../../../ai-rules/archive/2026-09-20-code-split/Code-代码结构划分.md) | Key、Value、Variable、CSS Function、Rule 各负其责；先核对文件职责再改 | 文件头与真实依赖一致，无两套真相、重复入口 |
| [代码编写](../../../ai-rules/rules/Code-代码编写.md)、[代码命名](../../../ai-rules/rules/Code-代码命名.md)、[readonly 约束](../../../ai-rules/rules/Code-readonly约束.md) | 英文代码标识符、中文说明；不新增 readonly、Readonly、ReadonlyArray 或 as const | 检查全部变更，而非只检查核心函数 |
| [代码注释](../../../ai-rules/rules/Code-代码注释.md) | 文件职责、类型概念、函数黑盒说明简洁准确；不复述实现过程 | 逐项复查新增和修改的注释，如 `Mixin：盒子尺寸`；必要契约另写，不堆描述 |
| [代码可读性](../../../ai-rules/rules/Code-代码可读性.md)、[阅读路径连续性](../../../ai-rules/rules/Code-代码阅读路径连续性.md)、[代码可维护性](../../../ai-rules/rules/Code-代码可维护性.md) | 主流程可顺读；不靠别名、转发层和迁移 switch 假装变清楚 | 对照改前与改后的实际调用链，说明减少了哪些跨层判断 |
| [代码修改](../../../ai-rules/rules/Code-代码修改.md)、[代码维护](../../../ai-rules/rules/Code-代码维护.md)、[完整性判别](../../../ai-rules/rules/Code-代码完整性判别.md)、[修改验收](../../../ai-rules/rules/Code-代码修改验收.md) | 删除旧责任必须说明由谁接管；功能、质量、完整性分别验收 | 类型检查、相关测试、责任核对均通过；遗留问题单独列出 |
| [让文本更易读](../../../ai-rules/rules/Document-让文本更易读.md)、[技术文档质量](../../../ai-rules/rules/Document-技术文档质量.md)、[设计文档内容](../../../ai-rules/rules/Agent-设计文档内容.md) | 结论、依据、建议、待验证项分开；文档不提前宣称落地 | 回读正文、核对链接与代码，不把计划写成完成报告 |
| [Git 操作权限](../../../ai-rules/rules/Agent-Git操作权限.md) | 不提交；操作前区分用户修改、暂存草案与本次修改 | 最终说明实际 Git 操作与保留状态 |

项目写作与实现还遵循 [Plan 写法](../how-to-write-plan.md)、[Guide 写法](../how-to-write-guide.md)。涉及 Button 时读取[样式文件写法](../style/样式文件写法.md)并对照组件定义；定位调用链时核对 [Architecture](../../Architecture.md)。

## 修改步骤与落点

### 1. 固定现状，先写需求测试

核对暂存区、工作区和完整草案。现有半成品逐项判定保留、重写或删除，不因已经写出就保留。记录各文件原职责和当前断点，不复用失败实现的通过报告。

先整理编译回归测试及现有相关测试：条件输出使用真实注册定义；测试间清理注册与挂载；失败须来自需求缺失，不能来自错误选择器、类型错误或测试污染。实施后回归用例已归入 [compile-css.test.ts](../../src/style-system/compiler/compile-css.test.ts)，不保留临时测试副本。

### 2. 统一 Rule，恢复简单 Key

- [css-rule.ts](../../src/style-system/core/css-rule.ts)：登记边界将 Declaration 拆为 `[Condition Path, Key, Content]`；本层 Key 只保存一次。单项、批量共用内部表示。
- [css-declaration.ts](../../src/style-system/core/css-declaration.ts)：只表达目标与内容；内容为 undefined 时跳过，不要求调用方条件拼装。
- [css-key.ts](../../src/style-system/core/css-key.ts) 与 `properties/`：Key 只描述原生名称；删除 content、expand、syntax 等属性解释责任。
- [css-root.ts](../../src/style-system/core/css-root.ts)：只调整新 Rule 表示所必需的登记、更新和卸载衔接。先核对现有句柄语义，不借重构改成另一套覆盖契约。

原生简写和详细属性按声明顺序交给 CSS 引擎；不得编译后反向解析字符串、拆四边或增加属性覆盖表。

### 3. 分开 Value、Variable 与延迟内容

- [css-value.ts](../../src/style-system/core/css-value.ts)、[css-variable.ts](../../src/style-system/core/css-variable.ts)、[css-valuable.ts](../../src/style-system/core/css-valuable.ts)：Value 与 Variable 独立，共享“可被 CSS 化”的 Valuable 协议，不使用 Variable 继承 Value 或伪装 Value 的捷径。
- [compile-value.ts](../../src/style-system/compiler/compile-value.ts)：负责当前条件下的取值与递归；不认识变量注册细节或具体 CSS 函数语法。
- [compile-variable.ts](../../src/style-system/compiler/compile-variable.ts)：负责变量引用、自身赋值及必要的自动定义，普通消费者不跟随其条件展开。
- `values/functions/`、`values/shadow.ts`、`values/animation.ts` 等定义处：保留原始输入关系，提供延迟生成方法。编译器控制调用时机与输入解析；生成方法只组织自身内容。

优先验证“具体函数保存输入，编译器提供输入解析能力”的直接做法。不得为延迟编译附带增加通用 Expression 体系、格式化注册表、通用对象遍历，或将内容协议放回 Key。也不默认给任意数组新增“空格拼接”的语义。

### 4. 分开条件容器，统一取值顺序

[state-conditions.ts](../../src/style-system/state-conditions.ts) 提供唯一有效顺序；普通路径由 Rule 保持，State Condition 由值展开收集，两者分别保存。

编译从外层 Rule 地址进入内容。在一个目标激活集合下，每个 Value 都按同一有效顺序选择自身最后一个匹配分支，再交给函数组合；无匹配才取 default。不能先选出互相不一致的值，再靠同址覆盖决定结果。

Subject Condition 同名去重、按注册顺序排列；普通路径保留顺序和重复。最终普通在前、Subject 在后，逐层嵌套；不拼 selector，不判 hover/active 互斥，不验证主体稳定或交换律。

先验证共享条件、缺分支和嵌套值，再选择激活集合枚举与复用算法。去除重复求值不能漏掉有效组合；独立条件确实需要组合时，不承诺完全消除组合数量增长。

### 5. 收口编译、挂载与 Mixin

- Rule 的当前 Key 与内容进入唯一解析路线。实施审查后删除 `compile-declaration.ts`：移出属性语法后，它只剩分派与重包装，已并入 [compile-css.ts](../../src/style-system/compiler/compile-css.ts)。
- [compile-css.ts](../../src/style-system/compiler/compile-css.ts)：组织 Rule、依赖与解析；结构嵌套留在这里，不从 Value 回调重新进入普通 Rules。
- [css-records.ts](../../src/style-system/compiler/css-records.ts)：最终只存条件路径、Key、CSS 内容三项。条件项及 Key 的空值按已有契约处理，不增加 owner 等长期字段。
- 解析挂载后再生成 CSS string；输出遵循挂载顺序，不做全局重排。同一目标的条件共享不得破坏原生声明的级联顺序。
- `mixins/`：承接字体、空间、边界、过渡等目的配置；具体内容生成留在对应定义处。不为了删除 Key 的语法配置而丢失这些能力，也不把 Button 配方冒充通用 Mixin。

Variable 的自动默认定义、显式赋值、注册与依赖各确定一个负责位置。回调不是缺陷；不强制统一返回“引用＋所有声明”。具名资源身份先核对需求，不通过任意 header 正则或容器身份发明替换政策。

### 6. 同步测试、文档与实施分析

测试按责任整理到 `core/`、`compiler/` 和浏览器用例；临时回归测试验证后归入合适位置，不留下重复断言堆。删除过程断言时记录替代的需求验证，不靠删测试取得通过。

实现后同步 [design.md](../../src/style-system/doc/design.md)、[architecture.md](../../src/style-system/architecture.md)、[state-condition.md](../../src/style-system/doc/state-condition.md)，在完整草案中补充分析与裁决，不覆盖历史问题依据。

在本 Plan 记录每个区域：原职责、改动原因、最终职责、上下游关系、删除机制的接管位置，以及刻意未改的内容。不得只列文件数量或缩减行数。

## 功能验收

测试既检查必要的 CSS 输出，也用浏览器检查关键级联与变量行为。实际执行结果见文末。

| 要求 | 必测案例与通过条件 | 实测结果与位置 |
| --- | --- | --- |
| 三项 Rule、Key 一份 | 单项、批量、嵌套登记采用同一表示；undefined 声明不产生内容 | 通过：compile-css 的三项 Rule、批量登记、缺省内容用例 |
| Key 不管理 CSS 覆盖 | padding → padding-left → padding、重复同名属性及未知原生属性；原始顺序保留，浏览器结果符合 CSS 级联 | 通过：compile-css 的 Key 用例；Root 浏览器的简写、无效后值用例 |
| 统一取值优先级 | A 先注册、B 后注册；两个 Value 为 `(1,A:2,B:5)`、`(1,A:7,B:11)`，AB 下乘积为 55；交换参数、反转分支书写顺序仍为 55 | 通过：compile-css 与 Root 浏览器的 AB 用例，计算结果 55 |
| 缺分支与组合 | 某 Value 无 B 时保留已激活 A；无匹配才 default。AB、BA、AAB 同一组合；container 与交互条件可组合 | 通过：subject-condition-composition 的优先级、路径规范、容器组合用例 |
| 任意嵌套智能值 | `colorMix(v1, colorMix(v2, v3))`，v1 无 active、v2/v3 有 active；再并列消费 v2/v3，不相互丢分支或污染地址 | 通过：compile-css 的缺 active 混色；compile-value 的嵌套与兄弟表达式用例 |
| Variable 隔离 | 动态比例改变 Custom Property 的赋值；消费 colorMix 不因该变量多状态而复制。变量赋值内部的 Value 只展开变量声明 | 通过：compile-value、subject-condition-composition 与 Root 浏览器的动态比例用例 |
| 自动定义克制 | 未使用不生成；重复使用、不同消费地址、默认与显式覆盖、注册、更新和卸载均保持正确；业务侧无需收集定义 | 通过：compile-css 的依赖、句柄、默认赋值用例；Root 浏览器的卸载用例 |
| 真正延迟 | 构造 CSS Function 不调用生成方法；编译才解析、生成。嵌套函数、undefined、循环引用均有明确行为，不产生 NaN 或对象字符串 | 通过：compile-css 的调用计数、缺省输入、循环引用用例 |
| 核心不知道具体语法 | colorMix、calc、字体、过渡、阴影、动画保留行为；新增一个测试用内容函数无需修改核心分支 | 通过：compile-css 的复合内容、匿名内容函数用例；语法仅在各定义处 |
| 路径与依赖边界 | 普通路径有序且保留重复；Subject 去重排序后嵌套；Rules 定义体和按需资源可用，但 Value 不承载普通 Rules | 通过：subject-condition-composition 的路径用例；compile-css 的结构嵌套与完整依赖用例 |
| 挂载与输出 | 同目标条件共享不产生不必要的重复层级；交错声明不被重排改变级联；挂载失败不损坏已有有效输出 | 通过：css-records 的相邻路径用例；Root 浏览器的交错顺序和失败保留用例 |
| Button 回归 | 默认、tone、variant、size、hover、active、disabled、focus-visible；JS 配方意图保留，类型与实际样式均正确 | 通过：button.browser 的四项回归；Button.style.ts 未改 |

## 执行验证与完成门槛

实施前记录基线；每个步骤先跑对应最小测试，最后执行：

```powershell
bun run type-check
bun run test:unit
bun run test:browser
git diff --check
git diff --cached --check
```

本轮以类型、单元与浏览器行为验收为主，不把构建代替测试；未改变打包或导出产物时不额外要求构建。命令失败须区分代码回归、原有失败与环境阻塞；未执行或受阻不能写成通过。

完成需同时通过三项检查：

1. **功能**：上表逐项附测试位置与实际结果；旧测试通过不代替新增需求证据。
2. **代码质量**：逐个审查新增概念必要性、文件头、类型和函数注释、命名、调用链与领域边界。说明读一个普通 Value、Variable、嵌套函数分别需要经过哪些责任位置，比原来消除了什么判断。
3. **责任完整性**：删除或迁移的能力都有去向；类型、实现、测试、文档一致；无未接线半成品、旧入口或双重协议。

任何一项未通过，继续修正或如实报告未完成；不得用行数减少或测试全绿替代其余检查。

## 实施时需要验证的选择

以下不是新增业务需求，也不是已经成立的实现结论：

- Valuable 与延迟方法的最小类型协议：先用嵌套智能值和 Variable 隔离用例验证，不为了统一形状增加层次。
- 激活集合枚举与复用：以正确取值为先，记录共享条件的重复工作；不靠候选遍历覆盖得到答案。
- 同目标挂载与声明顺序：用交错声明反例决定共享边界；不擅自将所有同址声明删除、移动或改为新的句柄所有权规则。
- 变量默认定义与具名依赖：核对现有实际用途，再决定最小接管方式；不把“默认先输出”或“按容器整体替换”直接升格为通用规则。

一般实现选择按最直接方案推进并事后记录。若需要改变已确认业务语义、公共行为或任务范围，先单独说明，不以内部重构名义混入。

## 实施记录

### 实际职责变化

| 区域 | 原来的问题 | 当前责任与理解链 |
| --- | --- | --- |
| Rule / Root | 地址与内容重复 Key，按地址吞掉原生前声明 | 登记三项 Rule；句柄只操作自己的登记，原生覆盖交给 CSS |
| Value / Variable | Variable 是 Value 的特殊 expression | 两者独立继承 Valuable；内容求值遇到变量，只交给变量编译取得引用与自身定义 |
| CSS Function | 核心 switch 识别每种语法，输入拍平后重建 | 定义处保存输入并提供函数；Compiler 的 read 统一解析智能输入，不知道颜色、字体或阴影语法 |
| 条件 | 先取候选再同址覆盖，出现 35 / 22；Rule 名称过早变成普通 header | 保留名称身份；普通路径与激活集合分开，每个集合下统一取值，AB 为 55 |
| 挂载 | 为合并区域移动声明，扫描 header 判定资源种类 | 原生记录顺序输出；完整依赖按提供的 Rule 地址接管，不按语法种类猜测 |
| Mixin | Key 解读 padding、字体、过渡等配置 | 效果配置归 Mixin；复合 CSS 内容归对应生成函数。Button 配方未改 |

### 第一性原理复查

- 保留 Valuable：直接承接用户要求的共同身份，只有按需依赖协议，不引入类层级或管理器。
- 保留 CSSFunction：普通可调用函数；没有 Expression 对象、语法索引或通用对象遍历。编译器提供 read，定义处生成字符串。
- 保留条件集合与本次编译的 seen：共享名称不再按每个参数重复排列；移除它会重复求值并失去唯一组合。状态不跨编译保存。
- 保留本次依赖的完整输出：后续依赖可能替换已解析的同址定义，旧声明及局部变量缺省值必须一起退出。它只是编译内部的数组，不进入最终三项记录，没有 owner 字段。
- `fontValue`、`transitionValue`、`valueSequence` 承接原有字体、过渡、空格列表的真实语法；没有新增效果或 Key 能力。
- 删除 `compile-declaration.ts` 与只做 push 的挂载函数；它们不再承担独立判断。撤回任意数组自动拼接、Variable 伪装 Value 等半成品。

### 已采用的取舍

1. **原生顺序优先于跨段合并。** 相邻同路径共用块；交错路径可以再次出现。浏览器反例：条件内 margin 为 1px，之后普通 margin-left 为 10px，再有同条件 margin-top；跨段搬运会错误改变左边距。当前保持 10px，不增加属性冲突分析。
2. **句柄只控制自己的声明。** 保留同名原生前值，才能让浏览器忽略无效后值并回退。旧的“后写使旧句柄失效”随源账本预覆盖一起退出，不宣称这是无行为变化的重构。
3. **依赖以完整 Rule 定义接管。** CSS Function、Keyframes、变量注册各在定义处提供完整结构；普通源声明不采用依赖替换规则。延后发现的新定义也能接管旧结果。
4. **组合数不承诺恒定。** 三个 Value 共用 A/B 只求值四个集合；三个独立条件可以产生八个集合，不能为了减少数量漏掉 ABC。

### 测试与质量证据

2026-09-18 22:23（Asia/Shanghai）末次执行：

- `bun run type-check`：通过。
- `bun run test:unit`：29 个文件、157 项通过。
- `bun run test:browser`：10 个文件、46 项通过，包含实际 CSS 计算结果与交互。
- 工作区与暂存区的 `git diff --check`：通过；七篇变更文档的文件链接均存在。
- 未运行构建：没有改变打包配置；本轮采用计划规定的类型、单元与浏览器验收。

已新增并实测过失败后修复的反例：Rule 名称与 Value 同条件重复嵌套、主体条件下 Variable 错取 default、后续依赖不能替换已解析定义。

功能证据集中于 [compile-css.test.ts](../../src/style-system/compiler/compile-css.test.ts)、[compile-value.test.ts](../../src/style-system/compiler/compile-value.test.ts)、[subject-condition-composition.test.ts](../../src/style-system/compiler/subject-condition-composition.test.ts)、[css-records.test.ts](../../src/style-system/compiler/css-records.test.ts) 与 [Root 浏览器测试](../../src/style-system/core/css-root.browser.test.ts)。Button 浏览器测试只将 padding 测试配置迁入 contentLayout，未改视觉预期。

阅读链复查：普通内容为 Rule → compileValue → 记录；变量在此转入 compileVariableReference；复合内容直接调用定义处函数。相较旧实现，省去 Declaration 二次识别、Key 语法分派、表达式 switch、属性反向解析和属性覆盖管理。文件头、类型与具名函数均按最短职责说明复查；不以代码缩短代替这项判断。

完整性复查：删除的属性语法已有 Mixin 或具体内容函数接管；删除的 compileDeclaration 分派归入 compile-css，未留下旧导出或引用。临时测试已并入正式用例，不保留另一份验收入口。完整修正草案仍在，历史判断与当前实施分开标明。此次未操作暂存、回退或 commit。
