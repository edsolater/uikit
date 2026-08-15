# Button 设计规格

## 组件定义

`Button` 表达“在当前上下文执行一个命令”。它不表达导航、值编辑、持续状态切换或状态展示。

```txt
Button = action + content + Brand Props + Status Props
```

- `children` 是用户看到的动作内容。
- `name` 是动作名；纯图形按钮必须提供，最终映射到 `aria-label`。
- tone、intent、size 是三个互不相关的 Brand 分组。
- loading、disabled 是可以同时成立的 Status。

## 选择规则

- 保存、确认、取消、清除、删除、复制、刷新、重试、导出等当前位置命令使用 `Button`。
- 改变 URL、路由、页面位置、外链或锚点时使用 `Link`。
- 输入或修改值时使用 `Input` 或其他表单控件。
- 切换持续布尔状态时使用 Switch 或 Checkbox 类组件。
- 只展示状态、分类、标签或徽章时不使用 `Button`。

## 常用写法

```tsx
<Button>关闭</Button>
<Button accent solid>保存</Button>
<Button bare>清空</Button>
<Button danger bare>移除</Button>
<Button danger solid>确认删除</Button>
<Button loading>提交</Button>
<Button disabled>提交</Button>
<Button name="关闭"><CloseIcon /></Button>
```

确定描述词直接形成代码的阅读轮廓。只有具体值会变化时，才使用分组字段：

```tsx
<Button size={buttonSize} tone={buttonTone}>动态按钮</Button>
```

## Props 契约

```ts
interface ButtonProps
  extends PivProps<'button'>,
    BrandProps<'tone', 'bare' | 'solid'>,
    BrandProps<'intent', 'accent' | 'danger'>,
    BrandProps<'size', 'small' | 'large' | 'xlarge'>,
    StatusProps<'loading' | 'disabled'> {
  name?: Source<string | undefined>
  onClick?: EventListenerInput<'click'>
}
```

### Brand Props

| 分组 | 确定描述词 | 不定字段 | 省略时 |
| --- | --- | --- | --- |
| 动作声量 | `bare`、`solid` | `tone` | 默认声量 |
| 动作性质 | `accent`、`danger` | `intent` | 普通动作 |
| 物理尺寸 | `small`、`large`、`xlarge` | `size` | 默认尺寸 |

- 确定描述词的值是 `Source<boolean | undefined>`，适合具体 Brand 已知、只需决定是否存在的场景。
- 不定字段的值是对应候选的 `Source`，适合具体 Brand 会变化的场景。
- 不定字段按“是否声明”接管整个分组；即使当前值是 `undefined`，也不会回落到同组确定描述词。
- 同组输入冲突会给出详细警告，但不会让组件崩溃。
- 默认值就是 `undefined`，不存在 `normal`、`neutral`、`medium` 这类默认候选。

### Status Props

- `loading` 表示动作已经触发并等待结果，同时输出 `aria-busy`。
- `disabled` 表示动作当前不可触发，同时设置原生 `disabled`。
- 两个状态可以同时成立，最终共同进入 `data-status`。
- 状态字段同样接受 `Source<boolean | undefined>`。
- 外部一旦声明某个状态字段，该字段由外部持续控制；组件内部对该状态的更改保持无效且不报错。
- Button 接收状态，但不判断状态为什么成立。

## Brand 选择

### Tone

- `bare`：动作存在但退场，适合清除、跳过、更多等低权重命令。
- `solid`：动作需要优先被看见，适合主操作或高风险确认。
- 省略：普通确认、关闭、返回等常规命令。

### Intent

- `accent`：当前流程推荐用户执行的动作。
- `danger`：删除、移除、重置、撤销权限等破坏性动作。
- intent 不决定声量；危险动作既可以是 `bare`，也可以是 `solid`。

### Size

- `small`：工具栏、表格行、弹窗角落和高密度区域。
- `large`：空状态、主行动区、触控优先区域。
- `xlarge`：需要更大命中面积的主入口。
- size 是物理尺寸档位，不是任意 CSS 尺寸值。

## 原生能力与边界

- Button 最终只输出一个原生 `button`。
- 默认 `type="button"`；提交和重置通过 `htmlProps` 明确传入。
- 原生 button 的 `name` attribute 使用 `htmlProps.name`，不使用顶层 `name`。
- 不提供 `variant`、`shape`、`href`、`target`、`icon`、`trailingIcon`、`enabled`、`validIf` 或 `validator`。
- 图标属于 `children`；导航属于 Link；状态判断属于外部业务。

## 输出协议

- Brand 分组分别输出 `data-tone`、`data-intent`、`data-size`。
- 当前成立的 Status 合并输出到 `data-status`，以空格分隔。
- 这些分类概念仍然存在于类型、注释和 DOM 协议中；运行时不需要 Profile 或枚举对象维持分类。
