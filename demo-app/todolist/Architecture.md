# ToDoList Architecture

## 文档边界

- `README.md` 负责描述 ToDoList demo 的业务目标、页面模块、状态矩阵和验收口径。
- `Architecture.md` 负责描述 ToDoList demo 的代码分层、模块职责、推荐 API 和实现顺序。

开始实现前，先读 `README.md` 确认业务边界；开始拆代码时，再按本文件推进。

---

## 架构目标

- 用最小但完整的代码结构承载 ToDoList 验收场景。
- 把业务状态、页面组合和基础组件调用职责拆开。
- 让实现过程能稳定暴露组件 API、状态表达和组合边界的问题。

---

## 架构原则

### 1. 业务状态与 UI 组件分离

ToDoList 的业务状态只放在 model 层。

UI 组件只消费状态，不直接持有复杂业务逻辑。

推荐结构：

```txt
src/
  App.tsx
  model/
    todoModel.ts
  components/
    TodoInput.tsx
    TodoItem.tsx
    TodoList.tsx
    TodoFilterBar.tsx
    TodoEmptyState.tsx
  views/
    TodoPage.tsx
```

---

### 2. demo 只写组合，不重写组件样式

demo 可以控制：

- 页面布局。
- 模块排列。
- 容器宽度。
- 列表间距。
- 区块之间的 spacing。

demo 不应该控制：

- Button 的颜色。
- Input 的状态边框。
- Checkbox 的勾选样式。
- Badge 的视觉等级。
- IconButton 的 hover 样式。
- disabled 的透明度。
- focus ring 的表现。

这些必须由 UI 组件库内部处理。

---

### 3. 组件 API 优先暴露问题

写 ToDoList 时，如果发现调用方式别扭，优先记录为组件库问题。

例如：

```tsx
<Input
  value={draft()}
  onValueChange={setDraft}
/>
```

应该比下面这种更自然：

```tsx
<Input
  modelValue={draft()}
  updateModelValue={setDraft}
/>
```

组件 API 要服务调用者，不要暴露内部实现。

---

### 4. 内容优先使用 children

Button、IconButton、Tag 等组件的可见内容优先走 children。

例如：

```tsx
<Button>Add</Button>
```

而不是：

```tsx
<Button label="Add" />
```

`label` 更适合用于：

- 无障碍名称。
- 摘要。
- 非可见说明。
- 图标按钮的识别文本。

例如：

```tsx
<IconButton label="Delete todo">
  <TrashIcon />
</IconButton>
```

---

## 数据模型

### Todo

```ts
export type Todo = {
  id: string
  title: string
  done: boolean
  createdAt: number
}
```

### TodoFilter

```ts
export type TodoFilter = 'all' | 'active' | 'done'
```

### TodoState

```ts
export type TodoState = {
  todos: Todo[]
  draft: string
  filter: TodoFilter
}
```

---

## model 层职责

`model/todoModel.ts` 负责：

```txt
创建 todo
删除 todo
切换 todo 完成状态
修改 draft
修改 filter
计算 filteredTodos
计算 activeCount
计算 doneCount
计算 totalCount
清空已完成
```

model 层不负责：

```txt
渲染组件
决定组件颜色
决定组件尺寸
决定布局位置
```

---

## 推荐 model API

```ts
export function createTodoModel() {
  const [todos, setTodos] = createSignal<Todo[]>([])
  const [draft, setDraft] = createSignal('')
  const [filter, setFilter] = createSignal<TodoFilter>('all')

  const addTodo = () => {}
  const removeTodo = (id: string) => {}
  const toggleTodo = (id: string, done: boolean) => {}
  const clearDone = () => {}

  const filteredTodos = createMemo(() => [])
  const totalCount = createMemo(() => todos().length)
  const doneCount = createMemo(() => todos().filter((todo) => todo.done).length)
  const activeCount = createMemo(() => totalCount() - doneCount())

  return {
    todos,
    draft,
    setDraft,
    filter,
    setFilter,
    addTodo,
    removeTodo,
    toggleTodo,
    clearDone,
    filteredTodos,
    totalCount,
    doneCount,
    activeCount,
  }
}
```

实现时可以按项目实际状态工具调整。
如果项目已有 `createState` / `$()` / `derive` 等状态抽象，应优先使用项目统一方案。

---

## 页面模块

### 1. TodoPage

页面级容器。

职责：

- 创建 todo model。
- 组织页面布局。
- 拼装 TodoInput、TodoList、TodoFilterBar、TodoEmptyState。
- 不直接写复杂业务逻辑。

示意：

```tsx
export function TodoPage() {
  const todo = createTodoModel()

  return (
    <main>
      <TodoInput todo={todo} />
      <TodoList todo={todo} />
      <TodoFilterBar todo={todo} />
    </main>
  )
}
```

---

### 2. TodoInput

新增输入区。

使用组件：

```txt
Input
Button
```

职责：

- 展示输入框。
- 展示新增按钮。
- draft 为空时禁用新增按钮。
- Enter 可以新增。
- 新增后清空 draft。

状态覆盖：

```txt
empty
typing
focused
submit disabled
submit enabled
```

推荐调用形态：

```tsx
<Input
  value={todo.draft()}
  placeholder="Add a task"
  onValueChange={todo.setDraft}
/>

<Button
  disabled={todo.draft().trim().length === 0}
  onClick={todo.addTodo}
>
  Add
</Button>
```

---

### 3. TodoItem

单条任务项。

使用组件：

```txt
Card / ListItem
Checkbox
IconButton
Tag / Badge
```

职责：

- 展示 todo 标题。
- 展示完成状态。
- 支持切换完成。
- 支持删除。
- 完成项需要有明确但不过度的降权表现。

状态覆盖：

```txt
normal
hover
completed
focused
long title
delete action
```

推荐调用形态：

```tsx
<Checkbox
  checked={todo.done}
  onCheckedChange={(checked) => onToggle(todo.id, checked)}
/>

<span>{todo.title}</span>

<IconButton
  label="Delete todo"
  onClick={() => onRemove(todo.id)}
>
  <TrashIcon />
</IconButton>
```

注意：

- completed 的表现不要在业务里硬编码颜色。
- 如果需要 completed variant，应由组件库暴露稳定 API。
- 长文本不能撑破布局。

---

### 4. TodoList

列表区。

使用组件：

```txt
TodoItem
EmptyState
```

职责：

- 渲染 filteredTodos。
- 没有数据时显示空状态。
- 不处理新增逻辑。
- 不处理筛选逻辑。

状态覆盖：

```txt
empty
one item
many items
filtered empty
```

---

### 5. TodoFilterBar

底部筛选与统计区。

使用组件：

```txt
Segmented / ToggleGroup / ButtonGroup
Badge
Button
```

职责：

- 切换 all / active / done。
- 显示完成数量与总数量。
- 提供清空已完成按钮。
- doneCount 为 0 时，清空按钮禁用。

不推荐用 Select 作为第一选择。
这个场景是少量互斥筛选，更适合：

```txt
Segmented
ToggleGroup
ButtonGroup
Tabs-like control
```

推荐调用形态：

```tsx
<Segmented
  value={todo.filter()}
  onValueChange={todo.setFilter}
  options={[
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
  ]}
/>

<Badge>
  {todo.doneCount()} / {todo.totalCount()}
</Badge>

<Button
  disabled={todo.doneCount() === 0}
  onClick={todo.clearDone}
>
  Clear done
</Button>
```

---

### 6. TodoEmptyState

空状态。

使用组件：

```txt
EmptyState
Button
```

职责：

- 当列表为空时显示。
- 区分全局空和筛选后为空。

示例状态：

```txt
没有任何 todo
当前筛选下没有 todo
```

文案示例：

```txt
No tasks yet.
No completed tasks.
No active tasks.
```

---

## 样式原则

### 1. 使用语义 token

样式描述优先使用：

```txt
surface
fg
line
action
neutral
good
bad
soft
strong
hover
focus
disabled
```

不要直接写：

```txt
blue
gray
red
#1677FF
#E5E7EB
```

除非是在定义 token 本身。

---

### 2. demo 不写组件视觉细节

不允许在 demo 内写：

```css
.todo-button {
  background: #1677ff;
  color: white;
  border-radius: 6px;
}
```

应该由组件库提供：

```tsx
<Button intent="action" weight="soft">
  Add
</Button>
```

或者使用项目已经确认的组件 API。

---

### 3. border / ring 语义

如果需要焦点或 hover 强调，优先使用组件库内部的 ring / shadow 方案，避免通过改变 border width 造成布局抖动。

demo 只负责把状态传给组件，不负责手写 focus ring。

---

## 推荐实现顺序

严格按以下顺序写。

不要一口气生成完整应用。

---

### 1. state model

文件：

```txt
src/model/todoModel.ts
```

先实现：

```txt
Todo 类型
TodoFilter 类型
createTodoModel
addTodo
removeTodo
toggleTodo
clearDone
filteredTodos
统计数据
```

---

### 2. TodoInput

文件：

```txt
src/components/TodoInput.tsx
```

只负责新增输入区。

验收：

```txt
Input 是否好用
Button disabled 是否自然
Enter 提交是否容易表达
```

---

### 3. TodoItem

文件：

```txt
src/components/TodoItem.tsx
```

只负责单条任务。

验收：

```txt
Checkbox API 是否自然
IconButton 是否需要 label
completed 状态是否好表达
长文本是否稳定
```

---

### 4. TodoList

文件：

```txt
src/components/TodoList.tsx
```

只负责列表渲染与空状态分发。

验收：

```txt
列表组合是否自然
空状态是否清晰
```

---

### 5. TodoFilterBar

文件：

```txt
src/components/TodoFilterBar.tsx
```

只负责筛选、统计、清空已完成。

验收：

```txt
Segmented / ToggleGroup API 是否自然
Badge 是否适合统计
Button disabled 是否清晰
```

---

### 6. TodoEmptyState

文件：

```txt
src/components/TodoEmptyState.tsx
```

只负责空状态表达。

验收：

```txt
全局空状态与筛选空状态是否能清晰区分
EmptyState 和 Button 的组合是否自然
```

---

### 7. TodoPage

文件：

```txt
src/views/TodoPage.tsx
```

负责组装所有模块。

---

### 8. App

文件：

```txt
src/App.tsx
```

只挂载 TodoPage。

---

## 失败判断

如果实现过程中出现以下情况，优先认为是组件库需要调整：

```txt
组件调用参数很别扭
事件命名不统一
children 和 label 职责混乱
disabled / hover / focus 需要业务层手写
组件状态无法表达
布局一组合就需要大量 hack
长文本或空状态容易破版
```

不要直接在 demo 里绕过去。
应该记录问题，然后反向修改组件库。

---

## 最终验收

最终是否合格，以 `README.md` 中的业务验收口径为准。

本文件额外关注：

- model / component / view 边界是否干净。
- 组件调用是否没有被 demo 层 hack。
- 实现顺序是否足够小步，便于发现组件库问题。