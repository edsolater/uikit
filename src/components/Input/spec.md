## Input 的核心定位

**Input 不是“输入框外观组件”，而是“值的采集器”。**

Button 的核心是：

```txt
Button = action + tone + intent + scale + status + content
```

Input 应该对应成：

```txt
Input = value + field + tone + intent + scale + status + content
```

更准确一点：

```txt
Input = value + field + guide + feedback + tone + intent + scale + status
```

* `value`：当前值
* `field`：采集什么类型的值
* `guide`：输入前 / 输入中的引导
* `feedback`：输入后的反馈、错误、辅助信息
* `tone`：控件边界的发声力度
* `intent`：当前输入状态的性质
* `scale`：交互尺度
* `status`：能否编辑、是否只读、是否禁用、是否校验中

Material Web 的 Text Field 提供了很多可参考结构：`type`、`label`、`placeholder`、`supporting-text`、`error-text`、`prefix/suffix`、`leading/trailing icon`、constraint validation、manual validation 等。它把 filled / outlined 分成两个组件，但官方也说明两者功能相同，只是视觉类型不同。([Material Web][1])
你的 Button 规范已经把 `variant` 拆成 `tone / intent / scale / status / content`，所以 Input 也不应该退回 Material 那种外观分类。

---

# 推荐模型

## 定稿方向

```txt
Input 是值信息的采集器。
tone 决定它的边界用多大声说话。
intent 决定当前输入信息是什么性质。
scale 决定它在当前空间里的交互尺度。
field 决定它采集什么类型的值。
guide 决定它如何提示用户输入。
feedback 决定它如何回应当前值。
status 决定它现在能不能被编辑。
```

---

# 1. 不叫 TextField，优先叫 Input

## 结论

**组件名建议叫 `Input`，不是 `TextField`。**

原因：

```txt
TextField = Material / Android / 表单体系味道较重
Input     = Web 原生语义更直接
```

Material 叫 `Text field` 是因为它的设计系统要覆盖移动端、Web、Android、iOS，并且强调“field 容器”。你这里是前端组件库，应该靠近 Web 原生语义。

推荐：

```tsx
<Input />
<Textarea />
```

不要：

```tsx
<TextField type="textarea" />
```

Material Web 用 `type="textarea"` 把 textarea 塞进 text field，这个我不建议照搬。它是统一组件 API 的取舍，但语义上混。`input` 和 `textarea` 原生就是两个控件，最好拆开。

---

# 2. Tone：不是 filled / outlined，而是边界声量

Material 的：

```txt
filled / outlined
```

问题是它描述的是**外观技术形态**，不是信息层级。

你的体系里应该继续用：

```ts
type InputTone =
  | 'bare'
  | 'subtle'
  | 'normal'
  | 'solid'
```

但 Input 的 tone 含义要和 Button 略微不同。

## bare

```txt
bare = 几乎无边界，只保留输入行为本身
```

适合：

* 表格内编辑
* 标题内联编辑
* 搜索栏内部的轻输入
* editable text
* 密集设置面板

示例：

```tsx
<Input tone="bare" label="Title" />
```

## subtle

```txt
subtle = 轻边界，低噪声输入区域
```

适合：

* 次级过滤条件
* 工具栏输入
* 侧边栏输入
* 密集表单

它可以有淡背景，也可以有很轻的边线，但不应该像 Material outlined 那样用边框抢注意力。

## normal

```txt
normal = 默认输入框，清晰可编辑，有稳定边界
```

默认值：

```ts
const defaultInputTone = 'normal'
```

这是普通表单最常用的状态。

## solid

```txt
solid = 强容器输入，强调这是当前主要采集入口
```

适合：

* 搜索首页主搜索框
* onboarding 的关键输入
* 空状态里的主输入
* 大面积编辑入口

但它不应该默认使用。Input 的 `solid` 比 Button 的 `solid` 更要克制，因为输入控件本来就持续占据视觉空间。

---

# 3. Intent：不要复用 Button 的 accent / danger 原样

Button 的 `intent` 是动作性质：

```ts
type ButtonIntent = 'neutral' | 'accent' | 'danger'
```

Input 的 `intent` 应该是**当前值 / 当前字段状态的性质**。

推荐：

```ts
type InputIntent =
  | 'neutral'
  | 'accent'
  | 'danger'
```

但解释不同。

## neutral

```txt
neutral = 普通输入
```

默认。

## accent

```txt
accent = 当前推荐填写 / 当前关键字段 / 当前流程主输入
```

它不是“成功”，也不是“高亮炫技”。

适合：

```tsx
<Input intent="accent" label="Project name" />
```

含义是：这个字段是当前流程的重要入口。

## danger

```txt
danger = 当前值有错误、风险或破坏性含义
```

可以用于：

* 校验错误
* 危险配置输入
* 删除确认输入
* 高风险字段

示例：

```tsx
<Input
  intent="danger"
  label="Repository name"
  feedback="Name does not match."
/>
```

是否再加 `success / warning`？

**第一版不建议。**

原因：

```txt
neutral / accent / danger 已经够用。
success 很容易变成装饰性噪声。
warning 和 danger 边界容易混。
```

第一版先保守。以后真有大量场景，再加：

```ts
type InputIntent =
  | 'neutral'
  | 'accent'
  | 'danger'
  | 'success'
  | 'warning'
```

但不要一开始加。

---

# 4. Scale：继续用 compact / normal / large

```ts
type InputScale =
  | 'compact'
  | 'normal'
  | 'large'
```

## compact

```txt
compact = 高密度输入
```

适合：

* table cell
* toolbar
* filter bar
* property panel
* inspector
* popover

## normal

```txt
normal = 默认表单输入
```

适合：

* form
* dialog
* setting page
* panel

## large

```txt
large = 主输入入口
```

适合：

* command search
* landing search
* onboarding
* empty state
* AI prompt box 的主输入

---

# 5. Field：type 不要叫 kind，直接保留 type

这里不用为了抽象而抽象。

```ts
type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number'
```

Material Web 支持这些类型，并强调 `type` 会改变输入行为、键盘和默认校验。([Material Web][1])

推荐保留原生命名：

```tsx
<Input type="email" />
<Input type="password" />
<Input type="search" />
```

不要改成：

```tsx
<Input field="email" />
<Input kind="password" />
```

因为这里 `type` 是 HTML 原生概念，改名反而损失直觉。

---

# 6. Label：Input 的 label 是字段名，不是内容摘要

Button 里：

```txt
label = content 摘要
children = content 本体
```

Input 里不一样。

Input 没有 children 作为主要内容。Input 的用户内容是 `value`。

所以 Input 的 `label` 应该定义为：

```txt
label = 字段名
```

不是 placeholder，不是摘要，不是装饰。

```tsx
<Input label="Email" />
<Input label="Password" />
<Input label="Repository name" />
```

Material Web 的 label 是 floating label，会常驻可见，并且参与可访问性。([Material Web][1])
但你不一定要做 floating label。你可以把 `label` 作为语义字段名，具体渲染由布局决定。

---

# 7. Placeholder：只能是输入示例，不是字段名

这一点要强约束。

```txt
label       = 这个字段是什么
placeholder = 这个字段怎么填
```

示例：

```tsx
<Input
  label="Email"
  placeholder="name@example.com"
/>
```

不要：

```tsx
<Input placeholder="Email" />
```

除非是极简搜索框：

```tsx
<Input
  type="search"
  label="Search"
  placeholder="Search files"
/>
```

Material 也提到 placeholder 只是 brief hint，并且有值后不可见。([Material Web][1])

---

# 8. Guide / Feedback：建议拆开，不照搬 supportingText / errorText

Material 用：

```ts
supportingText
errorText
```

这个命名可用，但不够干净。

我建议你用：

```ts
guide?: string
feedback?: string
```

含义：

```txt
guide    = 输入前 / 输入中的帮助
feedback = 当前值的反馈
```

示例：

```tsx
<Input
  label="Username"
  guide="Use 3–20 letters, numbers, or underscores."
/>
```

```tsx
<Input
  label="Username"
  intent="danger"
  feedback="Username is already taken."
/>
```

为什么不用 `helperText`？

```txt
helperText 太 UI 库传统味。
supportingText 太 Material 味。
description 太静态文档味。
guide / feedback 更像输入流程。
```

更强一点的模型：

```txt
guide    = 告诉用户怎么输入
feedback = 告诉用户当前输入结果如何
```

---

# 9. Prefix / Suffix：不做 prefixText，做可组合 slot

Material 有：

```ts
prefixText
suffixText
```

它适合 Web Component attribute，但不适合你的组件哲学。

你 Button 已经明确：icon 不做一级 props，内容走组合。

Input 也应该一样。

推荐：

```tsx
<Input label="Amount">
  <Input.Prefix>$</Input.Prefix>
  <Input.Control />
  <Input.Suffix>USD</Input.Suffix>
</Input>
```

或者如果你不喜欢 compound component，可以用子组件自注册：

```tsx
<Input label="Amount">
  <Prefix>$</Prefix>
  <Control />
  <Suffix>USD</Suffix>
</Input>
```

但第一版如果想简单，也可以提供轻量 props：

```ts
prefix?: JSX.Element
suffix?: JSX.Element
```

不过这和 Button 的设计会不一致。

我更推荐：

```txt
prefix / suffix 是 content accessory，不是一级字符串 props。
```

---

# 10. Icon：不要 leadingIcon / trailingIcon props

同 Button 一致。

不提供：

```ts
leadingIcon?: JSX.Element
trailingIcon?: JSX.Element
```

推荐组合：

```tsx
<Input label="Search">
  <Input.Prefix>
    <SearchIcon />
  </Input.Prefix>
  <Input.Control />
</Input>
```

密码显示按钮：

```tsx
<Input label="Password" type="password">
  <Input.Control />
  <Input.Suffix>
    <Button tone="bare" label="Show password">
      <EyeIcon />
    </Button>
  </Input.Suffix>
</Input>
```

这比 `trailingIcon` 更强，因为 suffix 里可以放按钮、状态图标、单位、清除动作，不被 icon 限死。

---

# 11. Status：Input 的状态比 Button 更复杂

推荐：

```ts
type InputBusinessStatus =
  | 'idle'
  | 'disabled'
  | 'readonly'
  | 'pending'
```

## idle

正常可编辑。

## disabled

不可编辑，不可聚焦，通常不提交。

```tsx
<Input disabled />
```

## readonly

可聚焦，可复制，可提交，但不可编辑。

```tsx
<Input readOnly />
```

这和 disabled 必须分开。

## pending

用于远程校验中。

```tsx
<Input
  status="pending"
  label="Username"
  feedback="Checking availability..."
/>
```

不过 API 上可以继续暴露：

```ts
disabled?: boolean
readOnly?: boolean
pending?: boolean
```

概念上归入 status。

---

# 12. Validation：保留原生能力，不要自己造完整校验系统

Material 同时支持 constraint validation 和 manual validation，并建议可能时优先用 constraint validation。([Material Web][1])

你的组件也应该这样：

```ts
required?: boolean
minLength?: number
maxLength?: number
min?: string | number
max?: string | number
pattern?: string
```

同时支持手动状态：

```ts
invalid?: boolean
feedback?: string
```

推荐关系：

```txt
原生约束 = 字段自己的基础规则
manual invalid = 业务规则 / 远程规则 / 跨字段规则
```

示例：

```tsx
<Input
  label="Email"
  type="email"
  required
/>
```

```tsx
<Input
  label="Username"
  invalid
  feedback="Username is already taken."
/>
```

`invalid` 比 `error` 更好。

原因：

```txt
error = 信息类型
invalid = 字段状态
```

Input 是字段控件，所以 `invalid` 更贴近 field 语义。

---

# 13. Character counter：不要自动魔法太多

Material 在 `maxlength` 存在时会显示 character counter。([Material Web][1])

你不一定要默认这样。

推荐：

```ts
counter?: boolean | 'auto'
```

默认：

```ts
counter: false
```

或者第一版直接不做，等需要时再加。

如果做：

```tsx
<Input
  label="Title"
  maxLength={80}
  counter
/>
```

不要默认 `maxlength` 就显示计数器。因为计数器是视觉噪声，不是所有场景都需要。

---

# 14. API 草案

```ts
type InputTone =
  | 'bare'
  | 'subtle'
  | 'normal'
  | 'solid'

type InputIntent =
  | 'neutral'
  | 'accent'
  | 'danger'

type InputScale =
  | 'compact'
  | 'normal'
  | 'large'

type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number'

interface InputProps {
  /**
   * 当前值。
   */
  value?: string

  /**
   * 非受控默认值。
   */
  defaultValue?: string

  /**
   * 值变化。
   */
  onInput?: (value: string, event: InputEvent) => void

  /**
   * 字段类型。
   */
  type?: InputType

  /**
   * 字段名。
   *
   * label 表示这个字段是什么。
   * 不等于 placeholder。
   */
  label?: string

  /**
   * 输入示例或短提示。
   *
   * placeholder 只在无值时出现。
   * 不应替代 label。
   */
  placeholder?: string

  /**
   * 输入引导。
   *
   * 告诉用户如何填写。
   */
  guide?: string

  /**
   * 当前输入反馈。
   *
   * 告诉用户当前值有什么结果。
   */
  feedback?: string

  /**
   * 边界发声力度。
   */
  tone?: InputTone

  /**
   * 当前输入性质。
   */
  intent?: InputIntent

  /**
   * 交互尺度。
   */
  scale?: InputScale

  /**
   * 手动无效状态。
   */
  invalid?: boolean

  /**
   * 原生状态。
   */
  disabled?: boolean
  readOnly?: boolean
  required?: boolean

  /**
   * 远程校验 / 异步处理状态。
   */
  pending?: boolean

  /**
   * 原生表单字段名。
   */
  name?: string

  /**
   * 原生输入提示。
   */
  autoComplete?: string
  inputMode?: string

  /**
   * 原生约束。
   */
  min?: string | number
  max?: string | number
  minLength?: number
  maxLength?: number
  pattern?: string

  /**
   * 是否显示字数计数。
   */
  counter?: boolean

  /**
   * 可组合附属内容。
   *
   * 用于 prefix、suffix、icon、clear button、password toggle 等。
   */
  children?: JSX.Element
}
```

默认值：

```ts
const defaultInputProps = {
  type: 'text',
  tone: 'normal',
  intent: 'neutral',
  scale: 'normal',
  counter: false,
} satisfies Partial<InputProps>
```

---

# 15. 推荐子结构

```txt
Input
├─ value
│  ├─ value
│  ├─ defaultValue
│  └─ onInput
├─ field
│  ├─ type
│  ├─ name
│  ├─ autocomplete
│  ├─ inputMode
│  └─ constraints
├─ guide
│  ├─ label
│  ├─ placeholder
│  └─ guide
├─ feedback
│  ├─ feedback
│  ├─ invalid
│  └─ counter
├─ tone
│  ├─ bare
│  ├─ subtle
│  ├─ normal
│  └─ solid
├─ intent
│  ├─ neutral
│  ├─ accent
│  └─ danger
├─ scale
│  ├─ compact
│  ├─ normal
│  └─ large
├─ status
│  ├─ idle
│  ├─ disabled
│  ├─ readonly
│  ├─ pending
│  ├─ hover
│  ├─ focus-visible
│  └─ active
└─ content
   ├─ prefix
   ├─ suffix
   ├─ icon
   ├─ action
   └─ control
```

---

# 16. 不提供的 API

| API               | 删除原因                   |
| ----------------- | ---------------------- |
| `variant`         | 太泛，不说明变化维度。            |
| `size`            | 太物理，继续用 `scale`。       |
| `filled`          | Material 外观分类，不是语义。    |
| `outlined`        | Material 外观分类，不是语义。    |
| `helperText`      | 传统 UI 库味较重，推荐 `guide`。 |
| `supportingText`  | Material 命名，不够直观。      |
| `errorText`       | 与 `feedback` 重叠。       |
| `error`           | 推荐用 `invalid` 表示字段状态。  |
| `prefixText`      | 太窄，只能放文本。              |
| `suffixText`      | 太窄，只能放文本。              |
| `leadingIcon`     | 属于附属内容，不做一级特权 props。   |
| `trailingIcon`    | 属于附属内容，不做一级特权 props。   |
| `type="textarea"` | textarea 应拆成独立组件。      |

---

# 17. 最终定稿句

```txt
Input 是值信息的采集器。
value 决定它当前采集到什么。
field 决定它采集什么类型的值。
label 决定这个字段是什么。
placeholder 决定这个字段可以怎么填。
guide 决定输入前后的辅助引导。
feedback 决定当前值的结果反馈。
tone 决定输入边界用多大声说话。
intent 决定当前输入状态是什么性质。
scale 决定它在当前空间里的交互尺度。
status 决定它现在能不能被编辑。
默认 Input 是 normal tone + neutral intent + normal scale + text type。
默认 Input 应该清晰、安静、稳定，不应该像 Material 默认风格那样强调装饰性存在感。
```

我会这样定：

```ts
<Input
  label="Email"
  type="email"
  placeholder="name@example.com"
  guide="Use your work email."
/>
```

而不是：

```tsx
<TextField
  variant="outlined"
  helperText="Use your work email."
  leadingIcon={<MailIcon />}
/>
```

前者是字段语义；后者是 UI 套件遗产。

[1]: https://material-web.dev/components/text-field/ "Material Web - Text field"
