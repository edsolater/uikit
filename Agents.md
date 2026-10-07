# Agent 入口

## 文件职责

- 本文件只做当前仓库的 agent 入口。
- 开始任何任务前，进入 [AI Rules Agent 入口](D:/mycode/ai-rules/AGENTS.md)；共享规则的选择、执行和验收全部由该入口负责。
- 除共享入口要求显式保留的固定约束与两库语义外，本文件只补充 UIKit 独有的阅读顺序与项目边界，不连接或复制 AI Rules 内部 Rule。

## 项目阅读顺序

- 写或改组件的 `.style.ts` 时，再读本项目的 [样式文件写法](docs/style/样式文件写法.md)，并对照组件定义确认分类与状态。
- 查当前仓库结构、模块边界和调用链时读 [Architecture.md](Architecture.md)。
- 写 Guide 或 Plan 时读 [Guide 写法](docs/how-to-write-guide.md) 和 [Plan 写法](docs/how-to-write-plan.md)。

## 当前项目边界

- 当前仓库是 SolidJS UIKit 项目。
- 所有 Agent 的临时任务文件统一写入仓库根目录下的 `agents/run/`。
- 默认只考虑最新浏览器和现代 CSS 能力，不为旧浏览器保留兼容层。
- 显示面统一简体中文，包括 UI 文案、日志、终端输出、注释、docstring 和 Markdown 说明。
- 代码结构面统一英文，包括变量名、函数名、类名、方法名、属性名、生产源码文件名、目录名、类型名和数据字段名。与源码同名的相邻测试沿用英文；领域 `test/` 中的流程测试以中文描述验证目的，保留 `.test.ts`、`.browser.test.ts` 等英文测试后缀。

## 固定约束与基础能力

从任务目的推导最少必要职责，通用函数与基础能力优先复用 FNKit，前端组件、hooks、交互和样式能力优先复用 UI Kit。新增判断、抽象和测试必须说明它解决了什么实际问题；独立审查从用户原话出发，检查必要性，不只检查正确性。

| 库 | 能力语义 | 本地源码与查证顺序 |
| --- | --- | --- |
| FNKit：`@edsolater/fnkit` | 通用 TypeScript 函数与基础能力，包括类型判断、集合、对象、异步任务、事件和数据流处理 | `D:/mycode/fnkit`；先读 [reference.md](D:/mycode/fnkit/reference.md)，再核对 [src/index.ts](D:/mycode/fnkit/src/index.ts) 的公开出口和对应源码契约 |
| UI Kit：`@edsolater/uikit` | 基于 SolidJS 的前端基础能力，包括 UI 组件、hooks、交互和样式设施；即当前仓库 | `D:/mycode/uikit`；先读 [README.md](README.md)、[Architecture.md](Architecture.md)，再核对 [src/index.ts](src/index.ts) 的公开出口和对应源码契约 |

优先复用须查证实际契约及框架是否适配；不能复用时说明实际差异。具体必要性判断、独立审查和验收仍从统一 AI Rules Agent 入口取得。

## 维护方式

- 发现共享规则缺口时，回到 AI Rules Agent 入口处理，不在本文件补写通用规则。
- 除上述固定内容外，只有当前仓库独有、且不适合迁移到通用规则项目的入口信息，才允许写进本文件。
- 本文件应保持轻量；新增内容前先判断是否应该放进 `ai-rules` 或 [Architecture.md](Architecture.md)。
