# Usage

## 目录职责

- 本目录存放当前仓库对外使用方式说明。
- 本目录说明稳定 API、推荐写法、边界判断和不推荐写法。
- 本目录不写具体改造步骤；修改步骤应放进 `docs/plans`。
- 本目录不写组件业务定义；业务定义应放进 `docs/features`。
- 本目录里的文档默认面向组件库使用者和维护者共同阅读。

## File Map

- `外部获取plugin内部状态并使用.md`：说明外部需要读取 plugin 内部状态时，应由 plugin 工厂直接返回 `[state, plugin]`，不通过 Piv 的 controller 管道回流。
