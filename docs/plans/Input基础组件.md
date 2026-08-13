# 维护契约

- Plan 契约在 [how-to-write-plan.md](../how-to-write-plan.md) 里单独维护。
- Guide 在 [Input基础组件.md](../guide/Input基础组件.md) 里单独维护。
- 修改代码风格在 [Agents.md](../../Agents.md) 里单独维护。
- 每次修改 Input 的代码落点、验证口径或边界判断后，都必须同步更新本文档。

# Input 基础组件

## 修改目标

- 确认 `Input` 是单行值编辑入口。
- 删除 `variant="ghost"` 这类视觉变体协议。
- 让 `invalid` 成为当前唯一组件级状态表达。
- 同步收口 Input 的规格文档和本地验证示例。

## 当前确认值

- `Input` 的代码主体落在 `src/components/Input/Input.tsx`。
- `Input` 的样式落点在 `src/components/Input/input.css`。
- `Input` 的规格说明落在 `src/components/Input/spec.md`。
- `src/components/index.ts` 负责对外导出这个组件。
- 当前阶段只需要默认输入形态。
- 当前阶段不提供 `ghost`、`bare`、`solid` 或 `tone`。

## 最小验证

- 确认调用方不能再传入 `variant="ghost"`。
- 确认默认 `Input` 仍然能渲染原生 `input`。
- 确认 `invalid` 能触发样式 class。
- 确认 `invalid` 能输出 `aria-invalid`。
- 确认 story 和 demo 都不展示已经删除的变体协议。

## 未决问题

- 后续是否要补 Field 组合，当前先不定。
- 后续是否要补 SearchInput、InlineInput 或 TableCellEditor，当前先不定。
