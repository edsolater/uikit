# Style System 语义节点与条件地址：三次清理实施详情

> 当前状态：施工完成，独立实施审查与技术总监验收均通过；目标、范围和验收以同名 Plan 为准。本文件记录施工事实、偏差和验证结果，用户验收尚待进行。

## 行动前冻结

- 授权：用户于 2026-09-26 要求“根据计划开启低配版的施工队开始施工”，并要求写好验收，完工后反向审视 Compiler 结构；技术总监确认本轮 Plan 来源审查实质 PASS 并正式授权开工。
- 负责分工：GPT-6 Sol 执行负责人承担实现、集成、测试、普通修复与材料汇总；独立审查者不参与实现；Watchdog 只读监察；技术总监处理重大边界并最终验收。
- 唯一目标：让 Compiler 只依通用样式内容能力和节点位置运行，不再根据 Variable、Value、Cluster 或 CSS 函数身份选路。
- 保留边界：`onActive` 生命周期调用与 `parse` AST 解析/改写各自独立；沿用 `CSSRoot`、`CSSKey`、`cssContent` 等现名；保留现役 Variable、Cluster、状态、按需资源、Button、CSSRoot 提交/失败行为；不做 CSS Property Value 聚合。
- 文件权限：不执行 Git 写入（stage、commit、checkout、reset、restore、clean 均不做）；Plan 主体及终局验收不由执行层改写。

## 行动前事实

只读源码核对确认 Plan 所述分支仍在现役链：

- `compiler/rules.ts` 的 `buildStyleNodes()` 调用 `isVariable()`、`clusterDeclarations()`，按 Variable 覆盖数组形状建立节点；`compileRules()` 在解析后按依赖地址、自动 Variable 定义、显式覆盖过滤和状态顺序重组输出。
- `compiler/rule-parser.ts` 对 `Value.kind`、`CSSContent`、Variable 未解析状态作专用分支，并只在 Variable Key 时启动 Key 解析；节点状态和 Parsed 输出复制 Variable/依赖元数据。
- `compiler/ast-controller.ts` 暴露 `isVariableDefinition`、`insertVariableDefinition()`，并通过 Variable Key 计算专用地址和定义状态顺序。
- `compiler/style-nodes.ts` 的语义节点与 Parsed 节点带有 Variable 定义、Variable 地址、状态顺序、依赖地址和资源地址字段。
- `css-key.ts` 的 `propertyName()` 及 `isCSSKey()` 识别 Variable 身份。
- `onActive` 现役回调由 `valuable.ts` 定义为 `CompileContext => Rules | void`；编译器在首次激活时调用并通用地将返回 Rules 送入编译队列。`animationName()` 与自定义 CSS 函数定义依赖此按需能力。`parse(ASTController)` 是另一项可选 AST 能力，不合并二者。

行动前未执行测试；按父 Plan 与本轮代码验证职责，测试矩阵如下。

## 验收矩阵

| Plan 要求 | 行动前状态 | 完工证据与状态 |
| --- | --- | --- |
| Compiler 及内部辅助不按 Variable、Value、Cluster、CSS 函数身份选路；自定义对象与现役对象走同一通用协议 | `compiler/` 下无上述具体类型检查与导入；自定义 Key 通过通用 `parse`、输出能力插入节点 | 通过：`bun run test:unit` 139/139；独立结构复查 PASS |
| `onActive` 与 `parse` 语义独立；仅有 `onActive` 的对象仍可提供按需 Rules | Valuable 继续提供 `onActive`，Parser 通用调用；生命周期内容可以提供依赖但不输出当前声明 | 通过：`内容解析波遍历及插入节点.test.ts` 6/6 含 lifecycle-only；`样式登记经依赖解析生成CSS.test.ts` 覆盖嵌套按需依赖；全单元 139/139、浏览器 74/74 |
| Key 与 Content 均能解析通用对象；子内容链接、字面内容、直接 CSS 输出均可完成 | Key/Content 共用能力检测，内容 Reader 读取 parse 替换；Key 的最终名称来自通用 Key 输出能力 | 通过：`内容解析波遍历及插入节点.test.ts` 6/6 含自定义 Key 插入与 Variable 根 replacement；打包入口另验证 `color: variable()` 输出 `var(--bundle-surface, black)` |
| 通用 Controller 完成插入、替换、查找与删除；不含 Variable 专名操作或标记 | 当前 Key/Content/role 只读视图及通用队列方法；自动定义区分留在 Variable 私有 Key 身份集合 | 通过：Compiler 无 Variable 专名字段/方法；定向状态 25/25 |
| Parsed 队列顺序就是 CSS 输出顺序；不按来源或 Variable 定义做末尾分组、排序与过滤 | `rules.ts` 将完成节点直接交给 `toCSSString()` | 通过：公开入口顺序断言、`CSS字符串按parsed队列顺序输出.test.ts` 与全单元 139/139 |
| Variable、Cluster、状态、局部赋值、按需依赖、未使用资源不输出、循环终止与重复声明层叠行为保留 | 状态回归查明为自动定义与显式 Key 识别过宽；通过 Variable 私有生成 Key WeakSet 区分后修复 | 通过：Variable 专项 25/25；全单元 139/139；浏览器 74/74 |
| Button、CSSRoot 完整成功提交与失败保留行为通过正式入口 | 编译接口保持 `compileCSS(): string`；样式挂载及 Button 流程由浏览器测试覆盖 | 通过：`bun run test:browser` 14 文件、74/74；`bun run test:unit` 32 文件、139/139 |
| Architecture 与现役样式节点 Guide 忠实记录实现，且命名不提前整体迁移到 JSS | 同步通用能力链、队列输出顺序及当前 ASTController Key/Content/role 视图；保留现有 CSS 命名 | 通过：独立结构复查确认文档与职责一致 |
| 反向复查 Compiler 结构职责、阅读路径与修改成本；结构问题上报总监 | 执行负责人自查并接受只读 Watchdog 与独立实施复查 | 通过：未发现身份分支或尾部调度；type-only 协议循环作为明确取舍记录；`resourceAddress` 属通用同名依赖替换 |
| 未写 Git 状态 | 未执行 stage、commit、checkout、reset、restore、clean 等 Git 写入命令 | 已核实仅 `git diff --check`、`git status`、只读 diff |

## 验证记录

| 命令 | 结果 |
| --- | --- |
| `bun test 'src/style-system/test/值与变量组合保留各自状态和身份.test.ts'` | 退出码 0；最终 25/25，92 assertions。中途复现并修复两项状态差异：状态内容引用变量缺少常态定义；显式 active 分支泄漏 hover 定义。新增用例确认 Variable 与 Cluster 的 `onActive` 各由通用遍历调用一次。 |
| `bun test 'src/style-system/test/内容解析波遍历及插入节点.test.ts'` | 退出码 0；6/6，29 assertions。含自定义 parseable Key 插入节点、lifecycle-only 无输出依赖及 Variable Content 根 replacement。 |
| `bun run type-check` | 退出码 0；`tsc --noEmit`。 |
| `bun run test:unit` | 退出码 0；32 文件、139 tests。 |
| `bun run test:browser` | 退出码 0；14 文件、74 tests。 |
| `bun run build` | 退出码 0；Vite production build 与 `tsc -p tsconfig.build.json` 均完成。 |
| `git diff --check` | 退出码 0；仅有行尾转换提示，没有 whitespace 错误。 |

Watchdog 独立复核 Variable/Value 状态专项，并通过独立 `color: variable('red')` 输出探针。完成结构复查后确认：没有 Compiler 身份分支或尾部调度；Controller 当前 Key/Content/role 已写入 Guide；无效 `keyReplacements` 状态已删除；lifecycle-only 与 Content 根 replacement 已留正式测试。其结论为整体职责切分合理；`ASTParseable` 对 `ASTController` 的 type-only 协议引用循环是可解释取舍，不建议本轮扩大范围。独立实施审查 PASS：审查者重跑 type-check、unit 32/138、browser 14/74、build 和 diff-check 均通过；执行负责人随后移除重复 Variable 激活并新增 Variable/Cluster 通用激活用例，最终全量 unit 为 32/139，相关类型及专项测试通过。独立审查者又复核收尾差异，独立重跑 Variable 专项 25/25，维持 PASS。`resourceAddress` 仅用于通用同名依赖替换，不参与结果分组排序，符合保留现役资源语义。技术总监最终验收通过，用户验收尚待进行。

## 实际差异

实际修改涉及 `valuable.ts`、`value.ts`、`css-key.ts`、`rule.ts`、`index.ts`、`variable.ts`、`variable-cluster.ts`，以及 `compiler/ast-controller.ts`、`rule-parser.ts`、`rules.ts`、`style-nodes.ts`。Rule/Key 建树删除 Variable/Cluster 身份分支；Rule Parser 统一 Key 与 Content 的 parse/子内容/输出处理；ASTController 只保留位置、地址和通用队列操作；ParsedStyleNode 删除 Variable/依赖排序字段；Key 名称由对象自己的 `toCSSString()` 提供。Value/内容侧协议放在 `valuable.ts`，避免内容对象反向依赖 Compiler 节点类型。

Variable 自己创建私有 CSSKeyOutput 对象并记录在模块内 WeakSet，用于识别自动生成的定义节点；Compiler 只接收普通 Key 对象。这个边界是修复状态默认值及显式消费状态所需，显式 Variable Key 与内部自动 Key 不会混淆。Cluster 代理显露默认 Variable 的通用 Key 输出能力，并由 Cluster 自身处理双方同名成员配对。`reference.parse()` 不再重复调用 `activate()`；Variable 与 Cluster 的生命周期激活由 `rule-parser.ts` 到达对象时通用调用，新增正式用例证明两者各调用一次并注入依赖。原 Variable 局部覆盖数组测试输入迁为显式 Rules/条件路径，不再要求 Compiler 按数组形状区分业务含义。公开打包测试断言声明流中的书写先后，不要求编译器按主体重新分组。

测试新增/更新：`内容解析波遍历及插入节点.test.ts` 验证自定义 Key 的通用 parse 与插入；`值与变量组合保留各自状态和身份.test.ts` 将局部状态行为用显式条件表示；`打包后的公开入口仍能生成样式.test.ts` 保留真实打包 `compileCSS()` 与 Variable 根内容替换输出断言，并验证完成队列顺序。Architecture 与现役样式节点 Guide 已同步通用能力及有限视图。Plan 目标与验收未由执行负责人改动。

## 结构反向复查

执行负责人结构反查：从 `compileCSS()` 到 `compileRules()`、`buildStyleNodes()`、`parseStyleNodes()`、`toCSSString()` 是一条线性调用链；Compiler 只拥有通用能力调用、遍历波次、队列操作和完成节点输出。Variable 自动定义状态通过其私有生成 Key 关系实现，不将语义标记加回 Controller/Parsed 节点。Value 输出接口由内容侧 `valuable.ts` 承接，未见 Value→Compiler 节点类型的反向依赖。构造与序列化职责分别在 `rules.ts` / `rule-parser.ts`、`css-string.ts`，读写路径可按 Plan 的一条链定位。独立结构复查确认上述边界，且指出 `ContentPositionState.keyReplacements` 是无消费者死状态；已删除其 map、初始化、重置与写入路径，只保留 Content 替换映射供 Reader 序列化使用。

技术总监反向复查从最终 CSS 输出倒查 parsed 队列、波次解析、Controller 和内容对象，确认 `resourceAddress` 只服务于现役同名按需资源替换，没有形成 parsed 后的第二套调度。检查发现 `Variable.parse()` 再次激活自身是冗余动作，执行负责人已删除并补上激活次数与依赖输出测试。当前主链职责清楚，没有 Compiler 身份分支或尾部排序残留。仍需上报的结构成本是 `rule-parser.ts` 的每位置 WeakSet、内容替换表、快照和完成标记较多；它们分别服务解析波、对象链、节点改写后的重访，目前没有发现可直接删除且不损失语义的概念。若以后继续扩充解析行为，应优先检查此处状态数量是否增长。
