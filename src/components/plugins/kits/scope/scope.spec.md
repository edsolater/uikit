# Scope Plugin

## 目标

`scope` 为主动支持它的能力建立范围。它是通用 Plugin，不拥有 Drag and Drop；`dragAndDrop` 只是当前使用 Scope 的一个能力身份。

```tsx
<Piv plugin={scope}>...</Piv>
<Piv plugin={scope({ capabilities: [dragAndDrop] })}>...</Piv>
```

- 无 options 或未提供 `capabilities` 时是全量 Scope，命中所有 Scope-aware 能力。
- 提供 `capabilities` 时只命中列出的能力。
- 嵌套时使用距离当前元素最近且命中该能力的 Scope。
- 查找沿 composed tree 进行，Shadow DOM 与 slot 不会意外切断 Scope。
- 两端属于同一有效 Scope，或两端都没有有效 Scope 时，允许继续协作。

## Controller

- `full`：当前是否为全量 Scope。
- `capabilities`：选择性 Scope 显式声明的能力。
- `includes()`：判断当前 Scope 是否命中一个能力。

## Example

[scope.example.tsx](scope.example.tsx) 建立两个 Drag and Drop Scope：范围内允许放下，跨范围拒绝。

[scope.stories.tsx](scope.stories.tsx) 提供同一范围协作的独立 Storybook 入口。

## 边界

- Scope 只判断范围，不替具体能力判断业务材料。
- Scope 不内建固定能力联合；能力通过 `createScopeCapability()` 开放创建。
- Scope 不拥有 draggable、droppable 或排序行为。
