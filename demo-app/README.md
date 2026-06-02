# demo-app

## 定位

`demo-app` 是自研 UI 组件库的验收应用集合。

它不是正式业务项目，也不是为了快速堆功能。
它的核心目标是：用真实但足够小的应用场景，反向验证 UI 组件库的 API、样式 token、组合能力、状态表达和边界场景。

每一个 demo 都应该遵守：

- 只使用自研 UI 组件。
- 不在 demo 内临时发明组件样式。
- 不绕过组件库直接写原生控件样式。
- 不为了完成业务而污染组件职责。
- demo 发现的问题，应该反向沉淀到组件库。

---

## 顶层目录约定

```txt
demo-app/
  README.md
  todolist/
    README.md
    Architecture.md
    src/
      App.tsx
      model/
      components/
      views/
```

其中：

- `README.md`：说明 demo-app 的总目标、流程和验收方式。
- `todolist/README.md`：说明 ToDoList demo 的业务目标、模块边界、状态覆盖和验收口径。
- `todolist/Architecture.md`：说明 ToDoList demo 的抽象架构。
- `todolist/src/`：具体实现代码。

---

## demo-app 的开发流程

每个 demo 按以下阶段推进。

不要一开始直接写完整代码。

---

### 1. 明确 demo 目标

先回答：

```txt
这个 demo 用来验收哪些组件？
这个 demo 用来暴露哪些组件库问题？
这个 demo 不负责什么？
```

例如 ToDoList 的目标不是做一个功能复杂的任务管理器，而是验收：

- Input
- Button
- Checkbox
- IconButton
- Badge / Tag
- Card / ListItem
- EmptyState
- FilterGroup / Segmented / ToggleGroup

---

### 2. 建立组件覆盖清单

先列出页面模块与组件关系。

示例：

```md
## 新增区

- Input
- Button

## 列表区

- TodoItem
- Checkbox
- IconButton
- Card / ListItem
- Tag / Badge

## 筛选区

- Segmented / ToggleGroup
- Badge

## 空状态

- EmptyState
- Button
```

这一阶段只验收组件覆盖，不写代码。

重点看：

- 组件是否缺失。
- 组件是否多余。
- 是否出现不应该存在的业务组件。
- 是否暴露出 UI 库缺少的基础组件。

---

### 3. 先验收组件调用协议

写代码前，必须先确认组件 API 是否自然。

重点不是实现，而是看调用方式是否舒服、统一、可组合。

示例：

```tsx
<Input
  value={draft()}
  placeholder="Add a task"
  onValueChange={setDraft}
/>

<Button onClick={addTodo}>
  Add
</Button>

<Checkbox
  checked={todo.done}
  onCheckedChange={(checked) => toggleTodo(todo.id, checked)}
/>

<IconButton
  label="Delete todo"
  onClick={() => removeTodo(todo.id)}
>
  <TrashIcon />
</IconButton>
```

验收重点：

- `value` / `onValueChange` 是否统一。
- `checked` / `onCheckedChange` 是否统一。
- 内容是否优先使用 `children`。
- `label` 是否用于摘要、识别或无障碍，而不是替代 children。
- 事件命名是否统一。
- 组件是否暴露了过多业务参数。

---

### 4. 输出线框结构

在写代码前，先用 ASCII 线框确认布局。

示例：

```txt
┌────────────────────────────────────┐
│  Todo                              │
│  [ Add a task...             ][Add]│
├────────────────────────────────────┤
│  □ Write component docs        [×] │
│  ☑ Test Button states          [×] │
│  □ Refine Input API            [×] │
├────────────────────────────────────┤
│  [All] [Active] [Done]     Done 1/3│
└────────────────────────────────────┘
```

这一阶段只看：

- 信息层级。
- 组件位置。
- 页面结构。
- 模块边界。

不要纠结具体色值、圆角、阴影。

---

### 5. 建立状态矩阵

demo 必须覆盖正常状态和边界状态。

例如：

```md
## Button

| 状态 | 期望 |
| --- | --- |
| default | 可点击，弱强调 |
| hover | surface 提亮 |
| focus-visible | 有 ring，不造成布局抖动 |
| disabled | 降权，不响应 |
| danger | 使用 bad intent |

## Input

| 状态 | 期望 |
| --- | --- |
| empty | placeholder 清晰 |
| filled | 内容可读 |
| focused | focus ring 明确 |
| invalid | 使用 bad intent |
| disabled | 不可编辑但可读 |
| long text | 不撑破布局 |
```

状态矩阵用于发现：

- 组件状态缺失。
- token 表达不统一。
- hover / focus / disabled / error 表现不一致。
- 边界场景下布局不稳定。

---

### 6. 再写分块代码

代码必须分块实现。

推荐顺序：

```txt
1. state model
2. TodoInput
3. TodoItem
4. TodoList
5. TodoFilterBar
6. EmptyState
7. App 整合
```

不要一开始写完整 App。

每一块写完后都要能独立判断：

```txt
如果这里不好写，是业务问题，还是组件库 API 问题？
如果这里样式不好调，是 demo 问题，还是组件 token 问题？
如果这里状态表达困难，是组件缺能力，还是调用方式不合理？
```

---

## 代码约束

### 1. 不直接写原生控件样式

不允许：

```tsx
<button class="todo-button">Add</button>
<input class="todo-input" />
```

应该使用组件库：

```tsx
<Button>Add</Button>
<Input />
```

---

### 2. demo 样式只负责布局

demo 内可以写：

- 页面间距。
- 区块布局。
- 列表排列。
- 容器宽度。
- 响应式结构。

demo 内不应该写：

- Button 颜色。
- Input 边框颜色。
- Checkbox 勾选颜色。
- Badge 的视觉身份。
- hover / focus / disabled 的组件状态样式。

这些必须由 UI 组件库负责。

---

### 3. 组件状态必须通过组件 API 表达

例如：

```tsx
<Button disabled={isEmpty()}>
  Add
</Button>
```

不要写：

```tsx
<Button class={isEmpty() ? 'disabled' : ''}>
  Add
</Button>
```

---

### 4. 样式使用语义 token

优先使用：

```txt
surface
fg
line
action
neutral
bad
good
soft
strong
```

不要在 demo 内硬编码：

```txt
#1677FF
#E5E7EB
#111827
```

除非这些色值本身就是组件库公开 token 的定义来源。

---

## 验收标准

一个 demo 合格，不是因为功能多，而是因为它能回答：

```txt
组件 API 是否好用？
组件组合是否自然？
状态表达是否完整？
样式 token 是否统一？
边界场景是否稳定？
组件职责是否干净？
```

如果 demo 写起来很别扭，优先怀疑组件库设计，而不是在 demo 里硬补。