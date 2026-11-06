# Tutorial

## 目录职责

- 本目录存放当前仓库对外指导文档。
- 本目录强调“什么时候这样用、为什么这样用、不要什么时候这样用”。
- 本目录说明稳定 API、推荐写法、边界判断和不推荐写法。
- 本目录不写具体改造步骤；修改步骤应放进 `docs/plans`。
- 本目录不写组件的稳定定义；这类内容应放进 `docs/guide`。
- 本目录里的文档默认面向组件库使用者和维护者共同阅读。

## File Map

- [什么时候应该使用hooks什么时候应该使用plugin.md](什么时候应该使用hooks什么时候应该使用plugin.md)：说明 defineInactivePlugin、defineInactivePlugins、inactivePlugin(pluginOptions)、pluginCore、能力结果、Controller、withDom 与节点接入清理。
- [外部获取plugin内部状态并使用.md](外部获取plugin内部状态并使用.md)：说明能力结果返回的完整 Controller、无节点时的方法行为，以及结果与组件 ref 的边界。
