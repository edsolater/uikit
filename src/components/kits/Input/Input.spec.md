# Input 设计规格

## 文档定位

- 本文档记录 `Input` 的上层设计语言和 API 方向。
- 本文档是 AI 在其他项目里选择是否使用 `Input` 的判断入口。
- 本文档先约束概念边界，不约束具体实现细节。
- 本文档不展开 CSS token、DOM 结构、表单编排或浏览器兼容策略。
- 稳定语义见 [Input 基础组件 Guide](../../../../docs/guide/Input基础组件.md)。

## 核心模型

- `Input` 是单行值编辑控件。
- `Input` 承载用户正在输入或修改的一个值。
- `Input` 的首要目标是让用户一眼知道这里可以编辑。
- `Input` 不用动作声量模型。
- `Input` 不提供 `variant`。
- `Input` 不提供 `ghost`、`bare` 或 `solid`。

```txt
Input = editable value + native input behavior + validity status
```

```txt
editable value        = 当前可编辑值
native input behavior = 原生 input 的输入、聚焦、键盘和表单行为
validity status       = 当前值是否有效
```

## 使用判断

- 需要用户输入或修改单行文本类值时，使用 `Input`。
- 需要编辑多行文本时，使用后续独立的 `Textarea`。
- 需要表达字段名、说明、错误文案或布局时，使用更上层的 Field 组合。
- 需要表格单元格编辑、标题内联编辑或搜索框组合时，优先长出专门组件，不把普通 `Input` 变成弱边界变体。
- 需要点击执行命令时，使用 `Button`。
- 需要跳转位置时，使用 `Link`。

```tsx
<Input htmlProps={{ placeholder: '项目名称' }} />
<Input invalid htmlProps={{ value: 'bad value' }} />
```

## AI 选择规则

- 如果界面信息是“用户可以输入一个单行值”，优先考虑 `Input`。
- 如果界面信息是“用户可以修改一个已经存在的单行值”，优先考虑 `Input`。
- 如果界面信息是“用户可以执行一个动作”，不要使用 `Input`。
- 如果界面信息是“用户可以选择一个离散选项”，不要使用 `Input`。
- 如果界面信息是“用户可以打开另一个位置”，不要使用 `Input`。
- 如果需要字段名，`Input` 只承载输入框本体，字段名放到更上层 Field。
- 如果需要错误文案，`Input` 只承载 invalid 状态，错误文案放到更上层 Field。
- 如果需要前缀、后缀、单位、清除按钮或展示密码按钮，优先等待更上层 Field/InputGroup 组合，不把它们塞进基础 `Input`。
- 如果只是想让输入框更淡，不新增 `ghost`。
- 如果只是想让输入框更强，不新增 `solid`。

## 使用场景

| 场景 | 推荐写法 | 判断理由 |
| --- | --- | --- |
| 普通文本字段 | `<Input htmlProps={{ name: 'title' }} />` | 用户编辑一个单行值。 |
| 邮箱字段 | `<Input htmlProps={{ type: 'email', name: 'email' }} />` | 输入行为交给原生 input type。 |
| 密码字段 | `<Input htmlProps={{ type: 'password', name: 'password' }} />` | 密码是单行值，遮罩行为交给原生 input type。 |
| 筛选关键字 | `<Input htmlProps={{ placeholder: '搜索关键字' }} />` | 筛选词仍是单行值。 |
| 只读值展示 | `<Input htmlProps={{ readOnly: true, value: '只读值' }} />` | 只读是原生 input 状态。 |
| 无效值 | `<Input invalid htmlProps={{ value: 'bad value' }} />` | invalid 只表达当前值无效。 |

## 禁止场景

| 场景 | 应使用 | 原因 |
| --- | --- | --- |
| 提交表单 | `Button` | 提交是动作，不是值编辑。 |
| 清空输入值 | `Button` 或后续 InputGroup suffix action | 清空是动作。 |
| 多行备注 | 后续 `Textarea` | 多行文本不是单行 input。 |
| 下拉选择状态 | 后续 Select 类组件 | 这是离散选项选择。 |
| 开关启用状态 | 后续 Switch/Checkbox 类组件 | 这是布尔状态选择。 |
| 表格单元格内联编辑 | 后续 TableCellEditor/InlineInput | 这是专门交互场景。 |
| 页面主搜索框整组 | 后续 SearchInput/InputGroup | 搜索框组合包含图标、动作和布局。 |

## 默认形态

- 默认 `Input` 必须有清晰输入边界。
- 默认 `Input` 必须稳定表达可编辑区域。
- 默认 `Input` 不追求低存在感。
- 默认 `Input` 不追求强容器感。
- 默认 `Input` 是唯一基础视觉形态。

## 有效性状态

- `invalid` 表示当前值无效。
- `validIf` 表示外部注入的有效条件。
- `Input` 会把 `invalid` 或 `validIf` 合并成最终有效性。
- 无效状态会输出 `data-status="invalid"`。
- 无效状态会输出 `aria-invalid`。
- `Input` 不负责生成错误文案。
- `Input` 不负责解释错误原因。

## 原生能力

- `Input` 底层输出原生 `input`。
- 当前默认 `type` 是 `text`。
- 原生输入属性通过 `htmlProps` 传入。
- `disabled`、`readOnly`、`name`、`value`、`placeholder` 这类原生字段保持原生语义。

```tsx
<Input htmlProps={{ name: 'email', type: 'email', placeholder: 'name@example.com' }} />
<Input htmlProps={{ readOnly: true, value: '只读值' }} />
```

## API 草案

```ts
interface InputProps extends PivProps<'input'>, ValidityOptions {}

type ValidityOptions = {
  /**
   * 当前值已经被外部判断为无效。
   */
  invalid?: Source<boolean>

  /**
   * 当前值必须满足的外部有效条件。
   */
  validIf?: ValidIf
}
```

## 不提供的 API

- 不提供 `variant`。
- 不提供 `ghost`。
- 不提供 `bare`。
- 不提供 `solid`。
- 不提供 `label`。
- 不提供 `hint`。
- 不提供 `error`。
- 不提供 `prefix`。
- 不提供 `suffix`。
- 不提供 `icon`。

| API       | 删除原因 |
| --------- | -------- |
| `variant` | 只说明视觉分支，不说明输入语义。 |
| `ghost`   | 弱边界会降低可编辑区域识别度。 |
| `bare`    | 内联编辑是专门场景，不属于普通 Input。 |
| `solid`   | 强容器容易被误读成主操作入口。 |
| `label`   | 字段名属于 Field 组合，不属于 input 本体。 |
| `hint`    | 输入说明属于 Field 组合，不属于 input 本体。 |
| `error`   | 错误文案属于 Field 组合，不属于 input 本体。 |
| `prefix`  | 前后缀需要组合结构，后续由专门 Field/InputGroup 承载。 |
| `suffix`  | 前后缀需要组合结构，后续由专门 Field/InputGroup 承载。 |
| `icon`    | 图标不是单行值编辑本体。 |

## 定稿句

- `Input` 是单行值编辑入口。
- `Input` 承载用户可编辑的当前值。
- `Input` 默认必须清楚地像一个输入框。
- `Input` 的基础协议只有默认形态和有效性状态。
- `Input` 不用 Button 的动作声量模型。
- `Input` 不通过 `ghost`、`bare` 或 `solid` 表达视觉层次。
