# Agent 入口

## 文件职责

- 本文件只做当前仓库的 agent 入口。
- 本文件不承载详细代码规范、CSS 规范、命名规范、注释规范或重构规范。
- 详细规则统一从 `D:\mycode\ai-rules\README.md` 进入，再按 `D:\mycode\ai-rules\code\_MAP.md` 的索引读取具体主题。
- 如果发现本文件和 `ai-rules` 规则重复，应删除本文件里的重复内容，保留 `ai-rules` 作为唯一规则来源。

## 阅读顺序

- 先读 `D:\mycode\ai-rules\README.md`。
- 写代码、改代码、重构、命名、写注释、写 CSS、写组件或类型时，再读 `D:\mycode\ai-rules\code\_MAP.md` 对应主题文件。
- 查当前仓库结构时读 `File-Map.md`。
- 写功能说明或修改计划时读 `docs/how-to-write-feature.md` 和 `docs/how-to-write-plan.md`。

## 当前项目边界

- 当前仓库是 SolidJS UIKit 项目。
- 默认只考虑最新浏览器和现代 CSS 能力，不为旧浏览器保留兼容层。
- 显示面统一简体中文，包括 UI 文案、日志、终端输出、注释、docstring 和 Markdown 说明。
- 结构面统一英文，包括变量名、函数名、类名、方法名、属性名、文件名、目录名、类型名和数据字段名。

## 维护方式

- 发现缺失的通用代码规则时，优先补到 `D:\mycode\ai-rules\code` 对应规则文件。
- 只有当前仓库独有、且不适合迁移到通用规则项目的入口信息，才允许写进本文件。
- 本文件应保持轻量；新增内容前先判断是否应该放进 `ai-rules` 或 `File-Map.md`。
