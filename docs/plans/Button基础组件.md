# 维护契约

- Plan 契约在 [how-to-write-plan.md](../how-to-write-plan.md) 里单独维护。
- Guide 在 [Button基础组件.md](../guide/Button基础组件.md) 里单独维护。
- 修改代码风格在 [Agents.md](../../Agents.md) 里单独维护。
- 每次修改 Button 的代码落点、验证口径或边界判断后，都必须同步更新本文档。

# Button 基础组件

## 修改目标

- 先确认项目里存在一个稳定的基础按钮主体。
- 先确认调用方不再直接依赖散落的原生按钮样式。
- 先确认按钮展示语义只收口到最小的 `tone` 协议。

## 当前确认值

- `Button` 的代码主体落在 `src/components/Button/Button.tsx`。
- `Button` 的样式落点在 `src/components/Button/button.css`。
- `src/components/index.ts` 负责对外导出这个组件。
- 当前阶段只需要 `bare / 默认 / solid` 三档动作声量。
- 当前阶段不提供 `subtle` 中间声量。

## 最小验证

- 确认调用方可以直接从组件导出入口拿到 `Button`。
- 确认 `Button` 仍然透传原生 `button` 属性。
- 确认 story 和 demo 都在使用同一个 `Button` 主体，而不是各自维护平行实现。

## 未决问题

- 后续是否要补 `loading` 便捷入口，当前先不定。
