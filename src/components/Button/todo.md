## 外界编排，Button 只显示

结论：`is loading`、`is idle`、`is pending`、`is disabled` 这类状态，**不应该由 Button 自己编排业务流程**。Button 应该只接收状态，然后把状态翻译成 DOM、样式和可访问性。

```txt
外部 feature / action / form
负责：什么时候 loading、什么时候 idle、什么时候 success/error

Button
负责：根据 loading/disabled 等状态正确显示、正确阻止交互、正确表达语义
```

---

## Button 自己可以管什么？

Button 可以管的是 **局部交互态**：

```txt
hover
active
focus-visible
pressed visual feedback
```

这些是按钮作为控件天然拥有的交互状态。

但这些不是业务状态。

---

## Button 不应该管什么？

Button 不应该自己决定：

```txt
请求是否正在提交
表单是否校验通过
保存是否完成
是否进入 success
是否跳转
是否关闭 dialog
是否弹 toast
```

这些属于外部流程。

否则 Button 会变成：

```txt
Button = 控件 + 请求管理器 + 表单控制器 + 状态机
```

职责会炸。

---

## 推荐心智模型

### Button 接收两类状态

```ts
type ButtonProps = {
  loading?: boolean
  disabled?: boolean
  pressed?: boolean
  selected?: boolean
  children?: JSX.Element
}
```

但它只负责显示：

```tsx
<Button loading={saveTask.pending()}>
  Save
</Button>
```

外部负责状态来源：

```tsx
const saveTask = createTask(async () => {
  await save()
})
```

Button 不知道 `save()` 是什么，也不应该知道。

---

## `loading` 应该怎么表现？

Button 可以做这些事：

```tsx
<button
  disabled={props.disabled || props.loading}
  aria-busy={props.loading || undefined}
  data-loading={props.loading || undefined}
>
  {props.loading && <Spinner />}
  <span>{props.children}</span>
</button>
```

重点：

```txt
loading 是输入，不是 Button 内部推导出来的业务结论。
```

Button 可以根据 `loading` 自动：

* 显示 spinner；
* 禁用点击；
* 设置 `aria-busy`;
* 设置 `data-loading`;
* 调整视觉样式；
* 保持按钮宽度，避免文字跳动。

但它不应该自己启动 loading。

---

## `idle` 是否需要传给 Button？

通常不需要。

因为 `idle` 是默认态。你不用写：

```tsx
<Button idle>
  Save
</Button>
```

更合理是：

```tsx
<Button loading={pending}>
  Save
</Button>
```

也就是说：

```txt
idle = 没有特殊状态
loading = 显式异常态/过程态
```

除非你在做完整状态机展示，否则 Button 不需要 `state="idle"`。

---

## 推荐状态接口

### 第一版：简单布尔

最实用：

```ts
type ButtonProps = {
  loading?: boolean
  disabled?: boolean
}
```

使用：

```tsx
<Button loading={isSaving()}>
  Save
</Button>
```

这是 80% 场景的最佳方案。

---

### 第二版：受控状态枚举

如果你确实有多个明确阶段：

```ts
type ButtonStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

type ButtonProps = {
  status?: ButtonStatus
}
```

使用：

```tsx
<Button status={saveStatus()}>
  Save
</Button>
```

但我不建议第一版就这样做。

因为很多按钮并不需要 `success/error`。过早引入枚举，会让 Button 被业务流程污染。

---

## 更适合你的设计系统规则

我建议这样定：

```txt
Button 不拥有业务状态。
Button 只接收外部状态，并将其映射为 DOM 语义、可访问性和视觉表现。
```

更细：

```txt
loading / disabled / pressed / selected 可以作为 Button 的显示输入。
idle 不需要显式表达，它是默认状态。
success / error 谨慎进入 Button，优先由外部反馈组件承担，例如 Toast、Message、FieldError。
```

---

## `command` 场景下也是一样

比如：

```html
<button commandfor="app-actions" command="--save" data-loading="true">
  Save
</button>
```

`--save` 只是发出意图。

真正的 loading 状态应该由外部控制器管理：

```ts
let saving = false

appActions.addEventListener('command', async event => {
  if ((event as CommandEvent).command !== '--save') return
  if (saving) return

  saving = true
  button.dataset.loading = 'true'
  button.disabled = true

  try {
    await save()
  } finally {
    saving = false
    button.dataset.loading = 'false'
    button.disabled = false
  }
})
```

Button 不编排保存流程，只接收结果。

---

## 最终答案

你的 Button 应该是：

```txt
intent emitter + visual receiver
```

不是：

```txt
workflow owner
```

最好的边界是：

```txt
外部：决定 loading / idle / success / error
Button：展示 loading / disabled / pressed / selected
```

所以：

```tsx
<Button loading={save.pending()} disabled={!form.valid()}>
  Save
</Button>
```

这就是最干净的结构。


---

# Button 不应该有validator

