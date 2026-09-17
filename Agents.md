# Agent 入口

## 文件职责

- 本文件只做当前仓库的 agent 入口。
- 开始任何任务前，进入 [AI Rules Agent 入口](D:/mycode/ai-rules/AGENTS.md)；共享规则的选择、执行和验收全部由该入口负责。
- 本文件只补充 UIKit 独有的阅读顺序与项目边界，不连接或复制 AI Rules 内部 Rule。

## 项目阅读顺序

- 写或改组件的 `.style.ts` 时，再读本项目的 [样式文件写法](docs/style/样式文件写法.md)，并对照组件定义确认分类与状态。
- 查当前仓库结构、模块边界和调用链时读 [Architecture.md](Architecture.md)。
- 写 Guide 或 Plan 时读 [Guide 写法](docs/how-to-write-guide.md) 和 [Plan 写法](docs/how-to-write-plan.md)。

## 当前项目边界

- 当前仓库是 SolidJS UIKit 项目。
- 默认只考虑最新浏览器和现代 CSS 能力，不为旧浏览器保留兼容层。
- 显示面统一简体中文，包括 UI 文案、日志、终端输出、注释、docstring 和 Markdown 说明。
- 代码结构面统一英文，包括变量名、函数名、类名、方法名、属性名、源码文件名、目录名、类型名和数据字段名。

## 维护方式

- 发现共享规则缺口时，回到 AI Rules Agent 入口处理，不在本文件补写通用规则。
- 只有当前仓库独有、且不适合迁移到通用规则项目的入口信息，才允许写进本文件。
- 本文件应保持轻量；新增内容前先判断是否应该放进 `ai-rules` 或 [Architecture.md](Architecture.md)。
