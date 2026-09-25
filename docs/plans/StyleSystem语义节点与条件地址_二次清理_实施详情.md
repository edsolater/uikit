# Style System 语义节点与条件地址：二次清理实施详情

## 本轮依据与开工基线

- **施工合同**：[二次清理 Plan](StyleSystem语义节点与条件地址_二次清理.md)；上位目标见 [AST Plan 本次施工方向与验收](StyleSystem语义节点与条件地址.md#本次施工方向与验收)。属性值聚合不在本轮范围。
- **权限与边界**：用户已明确开始执行 Plan。本轮由 Luna 执行负责人施工、集成和验证；技术总监负责重大裁决与最终验收，Watchdog 独立监察，代码独立审查由未参与实现的 Agent 承担。Plan 正文由技术总监维护，不由执行负责人改写。禁止 Git 写操作。
- **适用契约**：[UIKit Agent 入口](../../AGENTS.md)、[AI Rules Agent 入口](../../../ai-rules/AGENTS.md)、[代码编写](../../../ai-rules/rules/Code-代码编写.md)、[Bcoin Plan 落地契约](../../../bcoin-machine-learning/docs/how-to-apply-plan.md)。
- **行动前工作树**：源码无差异；两份 Plan 文件已有修改，按用户文件只读保留。未执行 Git 写操作。
- **现役起点**：`compile-rules.ts` 集中展开 Rules、改写节点、读取 Value/Variable、收集依赖、变量缺省定义、节点分组和 CSS 字符串输出；`compile-value.ts` 与 `compile-variable-reference.ts` 分别读取内容和计算 Variable；`style-nodes.ts` 同时表达改写前普通/特殊节点及 parsed 节点。`CSSRoot` 从源账本快照调用 `compileRules()`，成功后才改动宿主。此为只读盘点，不再表示当前实现。
- **本轮验收状态**：所有新链路能力在施工前均为未验证；本记录后续按阶段追加实际修改、验证、偏差和剩余项，不把旧实现的测试结果当作新链路完成证据。

## 施工阶段

| 阶段 | Plan 责任 | 交付与证据 | 状态 |
| --- | --- | --- | --- |
| A. 节点协议与控制器 | 复合 `conditionPath`、有序节点、有限 `ASTController` | 正式入口自定义 parse 测试验证复合地址、定点插入、按 key 查询及后续对象可见修改 | 完成 |
| B. 解析波与内容遍历 | Root/Content 共用波号、`parseWaveIndex`、复合内容连接、返回值接回、循环终止 | 自定义 parse 测试验证 0→2 波等待、嵌套 CSS 函数返回值；新对象无限链在深度 256 前明确失败 | 完成 |
| C. 现役能力迁移 | 规则登记/更新/撤销、Value/Variable/Cluster、状态和局部声明、依赖、自动定义、未使用资源 | 现役单元测试与样式登记集成测试通过；按需依赖、同名完整定义替换及状态语义有覆盖 | 完成 |
| D. 唯一输出链与旧路径退出 | 新增 CSS string 输出、移除旧编译载体、迁移 Architecture 与准确的活动文档引用 | 类型检查、全部单元/浏览器测试；CSSRoot 成功挂载和失败保留已有 CSS 有浏览器覆盖 | 完成 |
| E. 独立审查与修正 | 反向核对原要求、完整差异、测试及未完成项 | Watchdog 核心验收与独立实施审查均通过；复审所提问题已修正并重验 | 完成 |

## 执行记录

### 阶段 A–D 实施记录

- 建立 `rules.ts`、`rule-parser.ts`、`ast-controller.ts`、`css-string.ts` 的唯一执行链；删除 `compile-rules.ts`、`compile-value.ts`、`compile-variable-reference.ts` 与旧地址分组文件及测试。`rule.ts`、`value.ts`、`valuable.ts`、`variable.ts`、`condition.ts` 和公开入口接入新的对象 parse 与复合地址。
- Variable 自身 `parse(astController)` 负责注册、Root 值、状态默认值和状态分支节点，并返回可序列化 Value。Variable Cluster Proxy 显式代理 `parse`，现役普通 CSS 函数把操作数保存在 `contents`。带 `parse()` 的 callable 在 Variable source 与状态内容中按 Parseable 处理，不误作普通工厂回调。
- `rule-parser.ts` 按 Content 位置隔离 parse 状态；解析返回值接回原位置，但不写回源 Value 或任何复合对象的 `contents`。由于现役 CSSFunction 的序列化闭包捕获原始输入，解析器以本位置 WeakMap 映射原对象至 parse 返回值，再从该位置序列化。共享 Value 跨 `.AuditA`/`.AuditB`、同一 Rules 连续编译两次的回归用例确认两处状态定义均在且 Value 原内容身份保留；CSSRoot 多次编译和 Button 浏览器消费也正常。
- 内容对象插入节点相对当前节点进入同一有序队列。后续解析对象通过 `findByKey` 观察前项插入并将其改为 `11px` 的正式入口测试通过；最终 Parsed 节点从完整解析后的队列输出，已解析节点后续被 Controller 修改时会重置对应位置快照并再次处理。内容深度 256 上限用持续返回全新 parseable 的反例验证，在运行时栈溢出前给出明确错误；Watchdog 已复核并关闭终止性阻断项。
- 同名按需依赖按地址替换完整规则；同名 Variable 注册用资源地址替换整组旧 `@property` 声明。Controller 的 `replaceResource`／`insertResource` 已同步写入 JSS Guide 操作清单。状态内嵌套引用与 Cluster、局部赋值、CSS `@function` 作用域、资源撤销等现役回归测试通过。
- 原 `src/style-system/doc/JSS样式节点树.md` 载体保留并按 Root/Content 次波链改写，保留 Condition/State 身份、声明顺序与不聚合语义；不保留旧 `rewriteStyleNodes` 描述。Architecture 与行为文档中的活动实现链接已迁至现行文件。
- 文档编辑时曾先移除再重建该 Guide 路径；经技术总监指出父 Plan 历史和活动链接仍要求保留载体后，已恢复同一路径并更新内容。最终工作树中它是修改文件，不是删除项。
- 仅用于跨波跳过已完成子树的 `completed*Objects` 缓存未保留；Plan 明确允许缓存但不要求。本轮保留按 Content 位置隔离的 `parsed*Objects` 和必要的 CSSFunction 原对象返回值映射，不影响正确性边界。
- 已执行：`bun run type-check` 通过；`bun run test:unit --reporter=dot` 32 files、135 tests 通过；`bun run test:browser --reporter=dot` 14 files、74 tests 通过。额外深链反例 1/1 通过；Content 波正式入口测试 3/3 通过；跨地址 CSS 输出顺序测试 1/1 通过，覆盖可调用 ASTParseable 在 Variable source 与状态内容中的 parse 分类、既有队列节点修改及源对象内容连接不变。独立实施审查最终 PASS，审查人独立重跑全部门禁。未执行 Git 写操作。

## 最终验收

| Plan 要求 | 结果 | 证据 |
| --- | --- | --- |
| Rules 建立有序语义队列，Root 波及 Content 次波遍历完整对象链 | 通过 | [内容解析波遍历及插入节点.test.ts](../../src/style-system/test/内容解析波遍历及插入节点.test.ts)；32 个单元测试文件通过 |
| 复合 `conditionPath` 保留 target/state 区别；解析器只能经有限 Controller 操作当前队列 | 通过 | 正式入口测试断言 target/state，调用 `findByKey` 与 `insert`；[ASTController](../../src/style-system/compiler/ast-controller.ts) 不暴露底层队列 |
| 纯值、可选 `parse`、最早解析波、等待高波、返回内容接回、循环终止 | 通过 | 0→2 波与嵌套 CSS 函数返回值测试；[内容解析新对象链达到深度上限.test.ts](../../src/style-system/test/内容解析新对象链达到深度上限.test.ts) 1/1 明确失败；值/变量循环单测 |
| 每个 Content 位置的完整对象关系处理后才形成 parsed 内容；对象跨路径复用不混淆完成状态 | 通过 | [值与变量组合保留各自状态和身份.test.ts](../../src/style-system/test/值与变量组合保留各自状态和身份.test.ts) 验证共享 Value 两地址及两次编译；[内容解析波遍历及插入节点.test.ts](../../src/style-system/test/内容解析波遍历及插入节点.test.ts) 验证复合对象源链接不被改写 |
| Variable 自身 parse 在 Root 插入 `@property` 并返回可输出 Value | 通过 | [variable.ts](../../src/style-system/variable.ts)；同名注册替换和 CSS `@function` 局部 Variable 单测通过 |
| Rules 登记、替换、撤销及 Value／Variable／Cluster／局部状态语义保留 | 通过 | [样式登记经依赖解析生成CSS.test.ts](../../src/style-system/test/样式登记经依赖解析生成CSS.test.ts)、[值与变量组合保留各自状态和身份.test.ts](../../src/style-system/test/值与变量组合保留各自状态和身份.test.ts) |
| 按需依赖同链、循环终止、未使用资源不输出、状态优先级与显式覆盖 | 通过 | 上述单测与 [样式挂载后浏览器计算与更新.browser.test.ts](../../src/style-system/test/样式挂载后浏览器计算与更新.browser.test.ts) |
| 重复同址同 key 声明按队列顺序输出；不引入属性值聚合 | 通过 | 登记单测的简写/详细属性书写顺序断言；[css-string.ts](../../src/style-system/compiler/css-string.ts) 只输出完成节点 |
| Button、浏览器层叠与实时状态、CSSRoot 完整成功提交和失败回退 | 通过 | `bun run test:browser --reporter=dot`：14 files、74 tests 通过；包含 Button、层叠以及 CSSRoot 编译失败保留旧 CSS |
| 旧编译通路及旧改写协议退出，Architecture/活动材料如实更新 | 通过 | 旧编译文件删除；[Architecture](../../src/style-system/architecture.md)、[JSS 节点链 Guide](../../src/style-system/doc/JSS样式节点树.md) 和活动行为文档已更新 |
| 独立实施审查完成、问题修正并复验 | 通过 | 独立审查复验：既有节点后续修改输出 11px；callable Parseable 分类正确；A、B、A 地址严格按输入顺序输出；type-check、32/135 单测、14/74 浏览器测试与 diff --check 全通过 |
