# 维护契约

- Plan 契约在 [how-to-write-plan.md](../how-to-write-plan.md) 里单独维护。
- Feature 业务说明在 [useTitle基础Hook_业务说明.md](../features/useTitle基础Hook_业务说明.md) 里单独维护。
- 修改代码风格在 [Agents.md](../../Agents.md) 里单独维护。
- 每次修改 useTitle 的代码落点、验证口径或边界判断后，都必须同步更新本文档。

# useTitle 基础 Hook 修改计划

## 修改目标

- 先确认项目里存在一个稳定的浏览器标题同步 hook 主体。
- 先确认调用方不再在页面内部散落 `document.title` 赋值。
- 先确认 hook 的返回值表达的是浏览器当前真实标题。

## 当前确认值

- `useTitle` 的代码主体落在 `src/hooks/useTitle/useTitle.ts`。
- `src/hooks/index.ts` 负责对外导出这个 hook。
- 当前阶段只处理 `document.title` 同步，不扩展到其他文档元信息。

## 最小验证

- 确认调用方可以直接从 hook 导出入口拿到 `useTitle`。
- 确认传入新标题后，浏览器标题会更新。
- 确认外部直接修改浏览器标题时，hook 返回值也会跟着更新。

## 未决问题

- 后续是否需要支持卸载后恢复旧标题，当前先不定。