# Button 设计规格

## 文档定位

- 本文档是 AI 在其他项目里判断是否使用 `Button` 的入口。
- 本文档只写调用方可执行的选择规则和 API 口径。
- 内部实现、状态管理器、样式 token 和 DOM 细节不放在本文档主线。
- 长期业务说明见 [Button 基础组件业务说明](../../../docs/features/Button基础组件_业务说明.md)。

## 核心判断

- `Button` 表达“在当前上下文执行一个命令”。
- `Button` 不表达“去另一个位置”。
- `Button` 不表达“编辑一个值”。
- `Button` 不表达“展示一个状态”。
- `Button` 不表达“切换一个持续状态”。
- `Button` 的顶层 API 优先表达界面语义，不用原生表单语义反向命名组件字段。

```txt
Button = action + content + tone + intent + size + status
```

```txt
action  = 当前上下文命令
content = 用户看到的动作内容
tone    = 动作进入界面的视觉声量
intent  = 动作性质
size    = 按钮物理尺寸档位
status  = 外部注入的动作状态
```

## AI 选择规则

- 如果用户点击后执行保存、确认、取消、清除、删除、复制、刷新、重试、导出这类命令，使用 `Button`。
- 如果用户点击后改变 URL、路由、页面位置、外链或锚点，使用 `Link`。
- 如果用户需要输入或修改值，使用 `Input` 或后续表单控件。
- 如果用户需要切换持续布尔状态，使用后续 Switch 或 Checkbox 类组件。
- 如果界面只是在展示状态、分类、标签或徽章，不使用 `Button`。
- 如果动作能被文字说明，动作内容放在 `children`。
- 如果动作只有图标或非文本内容，必须提供 `name`。
- 如果动作是否可用需要业务判断，外部先判断，再注入 `status`。

## 使用场景

| 场景 | 推荐写法 | 判断理由 |
| --- | --- | --- |
| 普通关闭动作 | `<Button>关闭</Button>` | 关闭是当前上下文普通命令。 |
| 保存当前表单 | `<Button intent="accent" tone="solid">保存</Button>` | 保存是推荐路径动作，需要更高声量。 |
| 清空筛选条件 | `<Button tone="bare">清空</Button>` | 清空是低权重辅助动作。 |
| 行内删除 | `<Button intent="danger" tone="bare">删除</Button>` | 删除是破坏性动作，但行内操作不应过度抢占注意力。 |
| 删除确认 | `<Button intent="danger" tone="solid">确认删除</Button>` | 最终破坏性确认需要高声量警示。 |
| 图标关闭按钮 | `<Button name="关闭"><CloseIcon /></Button>` | 纯图形内容需要动作名。 |
| 加载中的提交动作 | `<Button status="loading">提交</Button>` | loading 是外部流程状态。 |
| 不可用动作 | `<Button status="disabled">提交</Button>` | disabled 是外部判断结果。 |
| 原生表单提交 | `<Button htmlProps={{ type: 'submit' }}>提交</Button>` | 原生按钮 type 通过 `htmlProps` 表达。 |

## 禁止场景

| 场景 | 应使用 | 原因 |
| --- | --- | --- |
| 打开详情页 | `Link` | 这是位置变化。 |
| 跳转外链 | `Link` | 这是导航行为。 |
| 输入项目名称 | `Input` | 这是值编辑。 |
| 勾选是否启用 | 后续 Switch/Checkbox | 这是持续状态选择。 |
| 展示成功状态 | 后续 Badge/Tag | 这是状态展示。 |
| 选择下拉选项 | 后续 Select | 这是选项选择。 |

## Props 口径

```ts
type ButtonTone = 'bare' | 'solid'
type ButtonIntent = 'accent' | 'danger'
type ButtonSize = 'small' | 'large' | 'xlarge'
type ButtonStatus = 'loading' | 'disabled'

interface ButtonProps extends PivProps<'button'> {
  /**
   * 动作视觉声量。
   *
   * bare: 低声量，适合辅助动作。
   * solid: 高声量，适合主动作或关键确认。
   *
   * 默认声量通过省略 tone 表达。
   * 不要传 tone="normal"。
   */
  tone?: ButtonTone

  /**
   * 动作性质。
   *
   * accent: 推荐路径动作。
   * danger: 破坏性动作。
   *
   * 普通动作通过省略 intent 表达。
   * 不要传 intent="neutral"。
   */
  intent?: Source<ButtonIntent | undefined>

  /**
   * 按钮尺寸档位。
   *
   * small: 高密度区域或行内操作。
   * large: 主行动区、大入口或需要更大命中面积的动作。
   *
   * 默认尺寸通过省略 size 表达。
   * 不要传 size="normal"。
   */
  size?: Source<ButtonSize | undefined>

  /**
   * 动作名。
   *
   * name 描述“这个按钮动作是什么”。
   * name 是界面动作名，不是原生 button name attribute。
   * name 不替代 children，也不表示可见文案。
   * children 只有图标或非文本内容时必须提供。
   * 原生 button 的 name attribute 通过 htmlProps.name 传入。
   */
  name?: Source<string | undefined>

  /**
   * 外部注入的动作状态。
   *
   * loading: 动作已触发，正在等待结果。
   * disabled: 动作当前不可触发。
   *
   * 默认状态通过省略 status 表达。
   * 不要传 status="idle"。
   */
  status?: StatusInput<ButtonStatus>
}
```

## Tone 选择

- 省略 `tone` 表示默认声量。
- `tone="bare"` 表示动作存在但退场。
- `tone="solid"` 表示动作需要优先被看见。
- 不提供 `tone="normal"`。
- 不提供 `tone="subtle"`。

| 动作 | tone |
| --- | --- |
| 页面主保存 | `solid` |
| 弹窗主确认 | `solid` |
| 行内更多操作 | `bare` |
| 清空筛选 | `bare` |
| 普通关闭 | 省略 |
| 普通取消 | 省略 |

## Intent 选择

- 省略 `intent` 表示普通动作。
- `intent="accent"` 表示当前流程推荐用户执行的动作。
- `intent="danger"` 表示删除、移除、重置、撤销权限等破坏性动作。
- `intent` 不决定动作声量。
- 破坏性动作可以是 `bare`，也可以是 `solid`。

```tsx
<Button intent="danger" tone="bare">移除</Button>
<Button intent="danger" tone="solid">确认删除</Button>
```

## Size 选择

- 省略 `size` 表示默认按钮尺寸。
- `size="small"` 用于工具栏、表格行、弹窗角落、卡片角落和高密度区域。
- `size="large"` 用于空状态、主行动区、触控优先区域和需要更大命中面积的动作。
- 不提供 `size="normal"`。
- `size` 是物理尺寸档位，不是任意 CSS 尺寸值。
- 选择 `size` 时应同时考虑紧凑/宽松、信息密度、操作频率和命中面积。

## Status 选择

- 省略 `status` 表示普通可操作状态。
- `status="loading"` 表示动作已触发并等待结果。
- `status="disabled"` 表示动作当前不可触发。
- `status` 只接收外部判断结果。
- `Button` 不负责判断状态为什么成立。
- 不提供 `status="idle"`。

## Content 选择

- `children` 是可见动作内容。
- 文本动作直接把文本放进 `children`。
- 图标和文本可以一起放进 `children`。
- 纯图标动作必须提供 `name`。
- 不提供 `icon` prop。
- 不提供 `trailingIcon` prop。
- `name` 是界面动作名，不是原生表单字段名。
- 原生 button 的 `name` attribute 通过 `htmlProps.name` 表达。

```tsx
<Button>保存</Button>

<Button>
  <SaveIcon />
  <span>保存</span>
</Button>

<Button name="关闭">
  <CloseIcon />
</Button>
```

## 原生按钮能力

- `Button` 底层输出原生 `button`。
- 普通动作默认使用 `type="button"`。
- 原生表单提交通过 `htmlProps={{ type: 'submit' }}` 表达。
- 原生表单重置通过 `htmlProps={{ type: 'reset' }}` 表达。
- 不提供顶层 `href`。
- 不提供顶层 `target`。

## 不提供的 API

- 不提供 `variant`。
- 不提供 `shape`。
- 不提供 `href`。
- 不提供 `target`。
- 不提供 `icon`。
- 不提供 `trailingIcon`。
- 不提供 `enabled`。
- 不提供 `validIf`。
- 不提供 `validator`。

| API | 删除原因 |
| --- | --- |
| `variant` | 语义太泛，不说明变化维度。 |
| `shape` | 属于全局风格，不属于单个 Button。 |
| `href` | 属于 Link，不属于 Button。 |
| `target` | 属于 Link，不属于 Button。 |
| `icon` | 图标属于 `children` 内容组合。 |
| `trailingIcon` | 尾部图标属于 `children` 内容组合。 |
| `enabled` | 这是外部判断，不是 Button 本体协议。 |
| `validIf` | 这是外部判断条件，不是 Button 本体协议。 |
| `validator` | Button 接收状态，不内建判断器。 |

## 定稿句

- `Button` 是当前上下文命令入口。
- `children` 表达动作内容。
- `name` 表达动作名。
- `tone` 表达动作声量。
- `intent` 表达动作性质。
- `size` 表达按钮尺寸档位。
- `status` 表达外部注入的动作状态。
- 默认 `Button` 是普通声量、普通性质、默认尺度、可操作状态。
