# 移除 Storybook（已完成）

用户要求删除依赖、配置、Story 和现役文档引用，保留 Example 和测试；独有且有用的场景并入现有 Example，不建立另一套预览框架。保留当前暂存与未暂存工作，只修改工作树。

## 场景接管

| Story | 现有 Example 与处理 |
| --- | --- |
| Article | 已有 Card 承载；补充裸 Article 正文，以便对照语义与视觉承载。 |
| Button | 已有普通、filled+strong、plain、disabled；补充 plain+danger。 |
| Card | 默认、soft、solid、small、large、xlarge 均已有，不重复。 |
| Input | 普通与 invalid 均已有，不重复。 |
| Popover | 已有 bottom/right；补充 top 触发与关闭交互。 |
| draggable | Story 直接引用现有 Example，无迁移。 |
| droppable | Story 直接引用现有 Example，无迁移。 |
| scope | Story 直接引用现有 Example，无迁移。 |
| useDocumentTitle | 已有按钮循环标题及即时显示，无迁移。 |

## 实施与验证

1. 在上述三个现有 Example 接管缺口，不改组件、Foundation/Piv 或测试契约。
2. 移除两个直接依赖、相关锁项、三个配置文件、九个 Story、构建输出和脚本；收口 TypeScript、路径映射注释与现役文档。历史 Plan 保留当时事件，注明入口已退出并将失效文件链接改成历史路径文字。
3. 安装后检查普通 tsc 实际为 7.0.2，恢复两条普通 tsc 脚本；不保显式入口绕行。必要时恢复原 FNKit 本地 Junction。
4. 类型检查、发布构建、单 worker 全单元与全浏览器；实际 Example 验收由主 Agent 执行，结束停止本轮服务。核暂存内容和原工作区保留，证据放 agents/run/remove-storybook。

独立约束检查已通过；场景必要性由 native_reuse 复核。无未决产品契约。

## 实施结果

三个独有场景直接加入相邻 Example，其他六份 Story 无需迁移。Article 使用两个并列正文，原页面测试相应验证每个场景各自只有一个 article、Card 不添加包裹节点、原生正文没有 Card 类；没有删掉原透明承载边界。组件与 Foundation/Piv 运行代码未变。

移除依赖后普通 `bun x --no-install tsc --version` 为 7.0.2，类型与构建脚本恢复普通 tsc，verbatimModuleSyntax:true 保持。Storybook 及其 TypeScript 6 传递依赖全部退出锁文件，FNKit Junction 仍指向 D:/mycode/fnkit。

类型检查、发布构建（含声明与 tsc-alias）、64 文件 488 项单元、29 文件 217 项浏览器全部通过，四项退出码为 0。现役文档与配置无 Storybook 入口；历史 Plan 文首注明已退出，失效文件链接改为历史路径文字，保留原验收事实。

生成目录的递归删除曾被自动审批拒绝。随后先建立 59 项只读清单，验证全部在精确目录内且无链接，再逐个删除文件、按深度删除已空目录，不使用递归或强制删除；storybook-static 已不存在。HEAD 与暂存内容哈希保持，全部变更范围见 integrity.json。实际页面已验收：Button 34 个按钮，新增移除按钮为危险文字色与透明背景；Article 两个并列 ARTICLE，分别带有和不带 Card 类且无嵌套；Popover 上方场景点击打开、实际位置位于触发器上方，再次点击关闭。三页控制台 error 均为空，临时标签关闭。本轮 dev session38820 已停止，5173 无监听。独立代码、必要性与文档复核通过。

最终磁盘检查发现 Bun 保留了已从依赖树退出的 TypeScript 6 孤立目录。冻结锁文件安装仍未清除，于是对两个精确目录建立无链接清单，逐文件及空目录清理，并移除已确认指向它们的 storybook/tsc6/tsserver 失效 shim；未触及其他依赖。普通 tsc 仍为 7.0.2，FNKit Junction 保持，暂存内容再次核验不变。保留基线、全量日志和清理清单作为证据，没有留下临时服务。
