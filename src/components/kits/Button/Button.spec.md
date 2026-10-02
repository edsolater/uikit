# Button 设计规格

## 分类契约与样式迁移边界

组件 API 使用 appearance、tone、emphasis、size 四组分类。本轮仅迁移组件契约，Button.style.ts 与旧 CSS 保持原样：旧外观规则仍读取 data-variant，尚未消费 data-appearance 或 data-emphasis；新属性输出不表示视觉效果已经接入。

- `emphasis` 表达组件整体的存在感，取值为 `soft`、`strong`；直接属性使用同名描述词，省略时为普通表现。不规定透明、实底或边框等实现方式。
- `tone` 表达动作的语义基调，当前确定的标记为 `danger`；原 `accent` 退出。其他候选以后讨论。
- Variant 描述组件的分类选择，分组内单选，分组之间可以组合，例如 `danger` 与 `strong`。Status 独立描述当前成立的情况，多个状态可以叠加。两者都允许响应式变化。
- `appearance` 表达外观形式，取值为 `filled`、`outlined`、`plain`。原始选择省略时仍为 `undefined`，由公开映射表转换成外观输出，初始映射为 `outlined`。

## 组件定义

`Button` 表达“在当前上下文执行一个命令”。它不表达导航、值编辑、持续状态切换或状态展示。

```txt
Button = action + content + Variant Props + Status Props
```

- `children` 是用户看到的动作内容。
- `name` 是动作名；纯图形按钮必须提供，最终映射到 `aria-label`。
- appearance、tone、emphasis、size 是四个独立的 Variant 分组。
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
<Button strong filled>保存</Button>
<Button plain>清空</Button>
<Button danger plain>移除</Button>
<Button danger strong filled>确认删除</Button>
<Button loading>提交</Button>
<Button disabled>提交</Button>
<Button name="关闭"><CloseIcon /></Button>
```

确定描述词直接形成代码的阅读轮廓。只有具体值会变化时，才使用分组字段：

```tsx
<Button size={buttonSize} appearance={buttonAppearance} tone={buttonTone} emphasis={buttonEmphasis}>动态按钮</Button>
```

## Props 契约

```ts
interface ButtonProps
  extends PivProps<'button'>,
    VariantProps<'appearance', 'filled' | 'outlined' | 'plain'>,
    VariantProps<'tone', 'danger'>,
    VariantProps<'emphasis', 'soft' | 'strong'>,
    VariantProps<'size', 'small' | 'large' | 'xlarge'>,
    StatusProps<'loading' | 'disabled'> {
  name?: Source<string | undefined>
  onClick?: EventListenerInput<'click'>
}
```

### Variant Props

| 分组 | 确定描述词 | 不定字段 | 省略时 |
| --- | --- | --- | --- |
| 外观形式 | `filled`、`outlined`、`plain` | `appearance` | 原始值 `undefined`；初始输出 `outlined` |
| 语义基调 | `danger` | `tone` | 普通性质 |
| 存在感 | `soft`、`strong` | `emphasis` | 普通表现 |
| 物理尺寸 | `small`、`large`、`xlarge` | `size` | 默认尺寸 |

- 确定描述词的值是 `Source<boolean | undefined>`，适合具体 Variant 已知、只需决定是否存在的场景。
- 不定字段的值是对应候选的 `Source`，适合具体 Variant 会变化的场景。
- 不定字段按“是否声明”接管整个分组；即使当前值是 `undefined`，也不会回落到同组确定描述词。
- 同组输入冲突会给出详细警告，但不会让组件崩溃。
- 同一 Variant 分组按单选解析，不同组可以同时成立。
- 原始选择默认是 `undefined`，不存在 `normal`、`neutral`、`medium` 这类默认候选。映射只改变 DOM 输出，解析器的 `details` 和 `effect` 保留原始选择。

### Status Props

- `loading` 表示动作已经触发并等待结果，同时输出 `aria-busy`。
- `disabled` 表示动作当前不可触发，同时设置原生 `disabled`。
- 两个状态可以同时成立，最终共同进入 `data-status`。
- 状态字段同样接受 `Source<boolean | undefined>`。
- 外部一旦声明某个状态字段，该字段由外部持续控制；组件内部对该状态的更改保持无效且不报错。
- Button 接收状态，但不判断状态为什么成立。

## Variant 选择

### Appearance

- `filled`：填充形式。
- `outlined`：轮廓形式。
- `plain`：无边界形式。
- 外观形式不决定存在感，可以独立组合 `strong` 或 `soft`。

`buttonMapping` 定义于 [Button.mapping.ts](./Button.mapping.ts)，是组件的公开配置对象；每个分组使用一个子表，原始值通过 `String()` 转为属性名。初始配置为：

```ts
export const buttonMapping = {
  appearance: { undefined: 'outlined' },
} as const
```

应用可在生成组件前通过 `Object.assign(buttonMapping.appearance, { undefined: 'filled' })` 更改默认输出。未配置的候选原样输出。`as const` 保留字面量类型，不冻结运行时对象；普通对象修改不主动触发响应式更新。外观候选类型 `ButtonAppearance` 属于 `Button.tsx`，不由映射表定义。

### Tone

- `danger`：删除、移除、重置、撤销权限等破坏性动作。
- tone 不决定存在感或外观；danger 可以与 strong、soft 及外观候选独立组合。

### Emphasis

- `soft`：降低组件整体存在感。
- `strong`：提高组件整体存在感。
- 省略：普通表现。
- 不规定透明、实底、边框等具体实现，也不等同于颜色材料中的同名成员。

### Size

- `small`：工具栏、表格行、弹窗角落和高密度区域。
- `large`：需要更宽松尺度或更大命中面积的区域。
- `xlarge`：需要更大命中面积的主入口。
- size 是物理尺寸档位，不是任意 CSS 尺寸值。

## 原生能力与边界

- Button 最终只输出一个原生 `button`。
- 默认 `type="button"`；提交和重置通过 `htmlProps` 明确传入。
- 原生 button 的 `name` attribute 使用 `htmlProps.name`，不使用顶层 `name`。
- 不提供 `variant`、`shape`、`href`、`target`、`icon`、`trailingIcon`、`enabled`、`validIf` 或 `validator`。
- 图标属于 `children`；导航属于 Link；状态判断属于外部业务。

## 输出协议

- Variant 分组分别输出 `data-appearance`、`data-tone`、`data-emphasis`、`data-size`；不输出旧 `data-variant`。
- 当前成立的 Status 合并输出到 `data-status`，以空格分隔。
- 这些分类概念仍然存在于类型、注释和 DOM 协议中；运行时不需要 Profile 或枚举对象维持分类。
