# Style System 语义节点与条件地址实施详情

> 当前状态：AST 初版与本轮能力迁移、旧路径清理均已完成代码、执行层验证和独立实施复审。本文件只记录实施事实；目标和验收仍以同名 Plan 为准。

## 实际调用链

`rule()`／`rules()` → CSSRoot 源账本快照 → `compileRules()` → `resolveRules()` 形成原始 `styleNodes` → `parseStyleNodes()` 按初始特殊节点身份改写并求值 → `groupParsedStyleNodes()` 保守分组 → `stringifyCSS()` 从 `parsedStyleNodes` 输出 CSS 字符串 → `cssRoot.mount()` 提交。按需依赖生成的 Rules 再次经过 `resolveRules()` 和 `parseStyleNodes()`。

## 实际修改

| 位置 | 已落地责任 |
| --- | --- |
| `src/style-system/rule.ts`、`src/style-system/index.ts` | 现有登记入口接受内容对象提供的 `rewriteStyleNodes` 方法，并公开供 Rule 作者使用的类型。普通声明入口与句柄不变。 |
| `src/style-system/compiler/style-nodes.ts` | 保存普通地址、当前受体状态、单项声明或特殊内容；定义状态已并入输出地址的 parsed 节点。 |
| `src/style-system/compiler/compile-css.ts` | 先展开原始内容，再执行改写与 Value／Variable 求值；原特殊节点按来源身份各调度一次，执行位置取移除前的当前队列位置；残留特殊节点报错。自动定义、同址完整依赖替换和失败不返回部分字符串仍由本编译链承担。 |
| `src/style-system/compiler/compile-variable.ts` | 局部 Variable 分支在形成单项 styleNodes 时展开，删除已无调用者的旧分支编译函数；Variable 引用、source 和状态定义仍由此文件读取。 |
| `src/style-system/compiler/group-parsed-style-nodes.ts` | 对 parsed 节点作保守分组；旧 `records.ts` 文件名和转发入口退出。 |
| `src/style-system/architecture.md` | 更新现役文件职责与实际编译链，不改变 Plan 或未来属性值聚合需求。 |

`src/style-system/test/语义节点改写经正式登记输出CSS.test.ts` 验证正式 `rule()`／`rules()` 改写、多项声明单项修改、原始节点身份与当前 index、状态地址、parsed 对象输出、依赖再次进入 AST、特殊节点残留、已登记状态的空内容改写和空 Variable 分支。`src/style-system/test/语义节点改写后浏览器状态与挂载.browser.test.ts` 验证状态实时生效、普通同名声明层叠和改写失败时不提交部分 CSS。`compiler/group-parsed-style-nodes.test.ts` 验证 parsed 节点保守分组的顺序反例。

## 验证记录

- `bun run type-check`：通过。
- `bun run test:unit -- src/style-system`：11 个文件、74 个测试通过。
- `bun run test:browser -- src/style-system`：7 个文件、37 个测试通过。
- `bun run test:unit -- src/components/kits/Button/Button.test.tsx`：8 个测试通过。
- `bun run test:browser -- src/components/kits/Button/button.browser.test.tsx`：12 个测试通过。
- 已登记状态的空内容仍在原始节点可见；改写后 `stateConditionPath` 是输出地址与 Variable 求值作用域的依据，移除或替换状态有正式入口反例。
- 未参与实现的独立审查 Agent 定向复跑状态路径、Variable 作用域与未知状态反例，并复跑 Style System 单元 74 个测试、真实浏览器 37 个测试、类型检查和 Button 浏览器 12 个测试，全部通过；Watchdog 对最终差异无约束阻断项。

## 完整差异与领域审计

**已完成大规模修改领域审计。** 逐项检查了规则登记、节点定义、阶段编排、Value／Variable 求值、保守分组、CSSRoot 和 Button 消费链。`style-nodes.ts` 只拥有阶段协议；`compile-css.ts` 拥有展开、改写、依赖与输出编排；`group-parsed-style-nodes.ts` 不解释值或特殊节点；`compile-variable.ts` 仍拥有 Variable 引用与自身状态定义。入口方向保持 `rule()`／`rules()` → CSSRoot → Compiler，编译器不反向依赖组件。

源码搜索未发现继续使用 `CSSRecord`、`groupCSSRecords` 或 `compileVariableDeclaration` 的平行入口；CSSRoot 仍只调用 `compileRules()`，字符串仍只在 `stringifyCSS()` 返回后提交。临时的聚合浏览器探针已按确认的确切路径清理；没有加入 CSS Property Value contribution、聚合、slot 或版本链代码。两份 Plan 的目标和验收未由执行层修改。独立实施审查已对真实链路、旧责任、状态改写和浏览器行为给出通过结论。

## 本轮能力迁移与旧路径清理

施工前基线：类型检查通过；Style System 单元 74 个、真实浏览器 37 个、Button 单元 8 个、真实浏览器 12 个测试通过。现役 `rule()`／`rules()` 仍由 Button 和业务用例使用，登记职责清楚，本轮不为表现接口变化而改名或增加转发层。

`style-nodes.ts` 删除 `deferredStateConditions` 字段；`compile-css.ts` 在形成节点时完整解析状态名称，空内容也保留已登记状态身份，未知状态在编译时拒绝。改写后的 `stateConditionPath` 继续决定 parsed 输出地址和 Variable 求值作用域。此前仅为未知状态空内容维持旧报错时机的 helper 与 parsed 阶段复查同时退出。`records.ts` 与相邻测试更名为 `group-parsed-style-nodes.ts` 和 `group-parsed-style-nodes.test.ts`，编译器直接导入新文件；不存在旧文件名的兼容转发。

文档例外逐项依据：`src/style-system/architecture.md` 原职责表把 `compiler/records.ts` 列为现役文件，文件更名后该路径不存在，故仅更正该行。`src/style-system/doc/JSS样式节点树.md` 原文称链“尚未实现”、特殊节点“待定义”、编译器“当前直接形成 CSS 输出记录”，与现役 `style-nodes.ts`、`rule.ts` 及 `resolveRules()` → `parseStyleNodes()` → `stringifyCSS()` 矛盾，故仅更正这些阶段事实。`src/style-system/doc/behaviors/浏览器层叠不能被编译改写.md` 的原“现状线索”含两个旧文件链接，`嵌套样式必须留在原作用域.md` 的原“现状线索”含一个旧测试链接；更名后均会成为死链。总监针对这三处给予临时文档例外，仅机械更正路径和可见标签，未改目的、案例、反例或验收语义。两份 Plan 未由执行层修改；属性值聚合仍由独立 Plan 承担。

本轮执行层验证：`bun run type-check` 通过；`bun run test:unit -- src/style-system` 为 75/75；`bun run test:browser -- src/style-system` 为 37/37；Button 单元 8/8、浏览器 12/12。新增正式入口反例验证了未知 Variable 状态即使内容为空也不能静默输出普通声明；已登记状态的空内容可被 Rule 观察、补值，Variable 目标依赖仍激活。

公共编译链的全仓回归另以 `bun run test` 验证：单元测试 31 个文件、143 个测试通过；真实浏览器测试 15 个文件、76 个测试通过，命令退出码为 0。

本轮完整差异与领域审计沿实际入口核对了登记账本、源节点、改写、parsed 求值、Variable 作用域、按需依赖、保守分组、字符串输出、CSSRoot 提交及 Button 消费。`compileRules()` 仍是 CSSRoot 的唯一编译入口；源规则和依赖规则都经过同一 `resolveRules()` → `parseStyleNodes()`；`group-parsed-style-nodes.ts` 只接收 parsed 节点并保留浏览器层叠相关顺序；旧 records 文件名及 `deferredStateConditions` 没有生产残留。现役 Rule 登记、Cluster、Value／Variable、自动定义、依赖与循环、CSSRoot 成功及失败边界和 Button 均由当前测试覆盖。**已完成大规模修改领域审计。**

未参与实现的独立审查 Agent 按冻结的 A–F 和 20 篇 Behavior 目的完成代码、调用方与差异复审，独立复跑类型检查、Style System 单元 75/75、真实浏览器 37/37、Button 单元 8/8、真实浏览器 12/12 及 `git diff --check`，均通过；本轮合同内无未验证或不通过项。Watchdog 对最终范围、Plan 冻结、文档例外、旧路径退出和聚合边界均无阻断项。
