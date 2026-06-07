# Button 设计规格

## 文档定位

- 本文档记录 `Button` 的上层设计语言和 API 方向。
- 本文档先约束概念边界，不约束具体实现细节。
- 本文档不展开 CSS token、DOM 结构、状态机实现或浏览器兼容策略。
- 后续实现 `Button` 时，应优先保持本文档定义的语义模型稳定。

## 核心模型

- `Button` 是动作控件。
- `Button` 只承载当前上下文中的操作。
- `Button` 不承载导航语义。
- 只要交互会改变 URL、切换路由、进入页面、跳转外链或跳转锚点，就不属于 `Button`。
- `Button` 的目标不是让动作更大、更强或更显眼。
- `Button` 的目标是让动作信息以合适的声量进入界面。
- 默认 `Button` 应该舒适、清晰、低噪声。
- 需要强调时增强声量。
- 需要退场时减弱声量。

```txt
Button = action + tone + intent + scale + status + content
```

```txt
action  = 动作本身
tone    = 动作发声力度
intent  = 动作性质
scale   = 动作交互尺度
status  = 当前状态表达
content = 动作内容表达
```

- `status` 是 `Button` 的状态表达维度，不等于状态判断来源。
- `Button` 内部可以保留 `status manager`。
- `status manager` 只负责接收状态、注册状态、输出状态表达。
- `status manager` 不负责判断状态为什么成立。

## Button 与 Link 边界

- `Button` 表示执行动作。
- `Link` 表示改变位置。
- `Button` 不提供 `href`。
- `Button` 不提供 `target`。
- 需要跳转时，应使用 `Link`。
- `Link` 可以在另一个体系中讨论是否拥有 button-like 外观。
- 即使 `Link` 拥有 button-like 外观，它仍然不是 `Button`。

## Tone

- `tone` 表示动作发声力度。
- `tone` 不等于传统 `variant`。
- `tone` 不等于具体视觉 `style`。
- `tone` 不沿用 Material 外观分类。
- `tone` 回答的问题是：这个动作应该用多大力气被看见。

```ts
type ButtonTone = 'bare' | 'subtle' | 'solid'
```

```txt
bare → subtle → normal → solid
静音    轻声      常声      强声
```

### bare 最低声量

- `bare` 是最低声量。
- `bare` 不制造容器感。
- `bare` 几乎不制造视觉外壳。
- `bare` 只保留文字或图形动作本身。
- `bare` 适合 `Skip`、`Clear`、`Remove`、`More` 这类动作。
- `bare` 表示动作存在，但不希望它占用注意力。
- `bare` 不是无能、苍白或弱化语义。
- `bare` 是去容器化的动作表达。

### subtle 轻声量

- `subtle` 是轻声量。
- `subtle` 允许轻微容器。
- `subtle` 可以使用淡底色或淡边界。
- `subtle` 仍以文字信息为主体。
- `subtle` 适合 `Cancel`、`Back`、`Export` 和次级动作。
- `subtle` 替代传统 `outline`。
- 传统 `outline` 的问题是边框存在感容易抢走文字信息。
- `subtle` 的目标是轻轻包住动作，而不是用边框强调自己。

###  常声量（默认）

- `` 是默认声量。
- `` 表示正常 `Button`。
- `` 应明确可交互。
- `` 应有稳定容器感。
- `` 不应制造强噪声。
- `` 向上可以增强为 `solid`。
- `` 向下可以减弱为 `subtle` 或 `bare`。

```ts

```

### solid 强声量

- `solid` 是强声量。
- `solid` 表示强容器。
- `solid` 表示强入口。
- `solid` 会明显争夺注意力。
- `solid` 适合主操作。
- `solid` 适合高优先级动作。
- `solid` 适合必须被快速识别的关键动作。
- `solid` 适合危险确认动作。
- `solid` 不是默认值。
- 只有动作确实需要更强、更重、更高噪声时，才使用 `solid`。

## Intent 决定组件说的信息是什么性质

- `intent` 表示动作性质。
- `intent` 决定动作说的事情是什么性质。
- `intent` 不决定视觉声量。

```ts
type ButtonIntent = 'neutral' | 'accent' | 'danger'
```

### neutral 普通（默认）

- `neutral` 表示普通动作。
- `neutral` 没有明显推荐性。
- `neutral` 没有破坏性。
- `neutral` 是默认动作性质。
- `neutral` 适合 `Copy`、`Close`、`Cancel`、`Back`、`More`、`Export`。

```ts
const defaultIntent = 'neutral'
```

### accent 推荐，system的引导

- `accent` 表示推荐动作。
- `accent` 表示当前流程希望用户继续执行的动作。
- `accent` 不是因为动作更吵。
- `accent` 是因为动作属于推荐路径。
- `accent` 适合 `Save`、`Create`、`Confirm`、`Continue`、`Apply`、`Submit`。

### danger 破坏性，需要警告

- `danger` 表示破坏性动作。
- `danger` 适合删除、移除、重置、撤销权限等不可轻易恢复的动作。
- `danger` 适合 `Delete`、`Remove`、`Reset`、`Revoke`、`Destroy`。
- `danger` 不一定等于 `solid`。
- `danger` 可以搭配 `bare` 表示低声量破坏性动作。
- `danger` 可以搭配 `solid` 表示高声量破坏性确认动作。

```tsx
<Button intent="danger" tone="bare">Remove</Button>
<Button intent="danger" tone="solid">Delete</Button>
```

## Scale 交互尺度

- `scale` 表示交互尺度，而非物理尺寸。
- `scale` 由信息密度、操作频率、命中需求和所在区域共同决定。

```ts
type ButtonScale = 'small' | 'large'
```

### small 紧凑尺度（交互有点难）

- `small` 表示紧凑尺度。
- `small` 适合 `toolbar`、`sidebar`、`table row`、`popover`、`inline action`、`card corner action`。
- `small` 表示动作存在，但不应该膨胀空间。

### large 大尺度，易操作，但需要克制

- `large` 表示大尺度。
- `large` 适合 `empty state`、`onboarding`、`landing section`、主行动区和关键流程入口。
- `large` 表示动作需要更大命中面积和更高可见性。

## Status 状态

- `status` 表示 `Button` 当前的状态表达。
- `status` 包括业务状态表达。
- `status` 包括交互状态表达。
- `Button` 可以用内部 `status manager` 统一管理这些状态表达。
- `status manager` 是被动状态层，不负责主动判断。
- 外部设施可以向 `Button` 注入业务状态。
- `Button` 再把这些状态翻译成 DOM 语义、可访问性语义和视觉表现。

### 业务状态

- `idle` 表示概念上的默认态。
- `loading` 表示动作已触发，正在执行。
- `disabled` 表示动作当前不可触发。
- 业务状态的判断来源在 `Button` 外部。
- 用于外部输入的 API 统一收口为 `status` 注入入口。
- `loading` 和 `disabled` 是外部可注入的业务状态值，不再单独提升成并列便捷 props。
- `disabled` 和 `loading` 在概念上归入 `status`。
- `idle` 可以保留在概念模型里，但不要求必须作为显式输入存在。

```ts
type ButtonBusinessStatus = 'idle' | 'loading' | 'disabled'
```

- `validator`、`credibility`、`query database` 这类设施可以产出业务状态。
- 这些设施不属于 `Button` 本体。
- 即使它们暂时与 `Button` colocate，也不改变它们的外部设施身份。

### 交互状态

- `hover` 由浏览器交互状态驱动。
- `active` 由浏览器交互状态驱动。
- `focus-visible` 由浏览器交互状态驱动。
- 交互状态不需要暴露为 props。
- 交互状态可以进入 `status manager` 的统一表达，但不需要外部判断设施参与。

## Content

- `content` 表示 `Button` 内部表达的信息。
- `content` 不应主要通过 props 传入。
- `content` 应保持可组合性。
- JSX的 `children` 是内容本体。
- 图标只是 `content` 的一种表达形式。
- `Button` 不把 `icon` 提升为一级核心 props。icon会自动将自己的内容注册到 `Button` 中
- `Button` 不把 `trailingIcon` 提升为一级核心 props。

```tsx
<Button>
  Save
</Button>

<Button>
  <Icon />
  <span>Save</span>
</Button>
```

## Label

- `label` 是内容摘要。
- `label` 不是主要渲染内容。
- `label` 不替代 `children`。
- `label` 应该尽量简短精悍。
- `label` 可用于语义、可访问性、调试或图标按钮摘要。
- 只有图形内容时，应提供 `label`。
- `children` 表示内容本体。
- `label` 表示内容摘要。

```ts
label?: string
```

```tsx
<Button label="Save file">
  <SaveIcon />
  <span>Save</span>
</Button>

<Button label="Close">
  <CloseIcon />
</Button>
```

## Type

- `type` 表示原生 `button` 的 `type` 语义。
- `type` 不应默认手动固定为 `button`。
- `type` 默认值应为 `auto`。
- `auto` 表示由 `Button` 根据环境选择最合适的原生 `type`。
- 本文档暂不讨论 `auto` 的具体实现方式。

```ts
type ButtonType = 'auto' | 'button' | 'submit' | 'reset'
```

```ts
const defaultType = 'auto'
```

## API 草案

```ts
type ButtonTone = 'bare' | 'subtle' | 'solid'

type ButtonIntent = 'neutral' | 'accent' | 'danger'

type ButtonScale = 'small' | 'large'

type ButtonType = 'auto' | 'button' | 'submit' | 'reset'

interface ButtonProps {
  /**
   * 动作发声力度。
   *
   * bare: 静音动作，无容器。
   * subtle: 轻声动作，轻容器。
   * normal: 默认动作，正常容器。
   * solid: 强声动作，强容器。
   */
  tone?: ButtonTone

  /**
   * 动作性质。
   *
   * neutral: 普通动作。
   * accent: 推荐动作 / 当前路径动作。
   * danger: 破坏性动作。
   */
  intent?: ButtonIntent

  /**
   * 交互尺度。
   *
   * small: 高密度区域。
   * normal: 默认尺度。
   * large: 主行动区 / 大入口。
   */
  scale?: ButtonScale

  /**
   * 原生 button type。
   *
   * auto 表示由组件根据环境自动选择。
   */
  type?: ButtonType

  /**
   * 外部注入的状态集合。
   *
   * 它是状态输入，不是状态判断入口。
   */
  status?: ButtonBusinessStatus | ButtonBusinessStatus[]

  /**
   * 内容摘要。
   *
   * 不替代 children。
   * 用于语义、可访问性、调试或图标按钮摘要。
   */
  label?: string

  /**
   * 内容本体。
   *
   * Button 内容应通过 children 组合，而不是用 icon/text props 固定。
   */
  children?: JSX.Element
}
```

```ts
const defaultButtonProps = {
  intent: 'neutral',
  type: 'auto',
} satisfies Partial<ButtonProps>
```

## 每一个领域问题， 应该有一个可复用（但也可不复用）的 primitive 处理

- `tone` 领域问题由 `createToneManager` 处理。
- `intent` 领域问题由 `createIntentManager` 处理。
- `status` 领域问题由 `createStatusManager` 处理。
- `createStatusManager` 负责状态承载与状态输出，不负责状态判断。
  等，我就不赘述了

不要怕麻烦，因为用优雅的排比， 并领域清晰， 所以阅读起来心智负担其实不大

## 不提供的 API

- 不提供 `variant?: ...`。
- 不提供 `size?: ...`。
- 不提供 `shape?: ...`。
- 不提供 `href?: string`。
- 不提供 `target?: string`。
- 不提供 `icon?: JSX.Element`。
- 不提供 `trailingIcon?: JSX.Element`。
- 不提供 `enabled?: boolean` 作为 `Button` 本体的判断式 API。
- 不提供 `validIf?: ...` 作为 `Button` 本体的判断式 API。
- 不提供 `validator?: ...` 作为 `Button` 本体内建能力。

| API            | 删除原因                                           |
| -------------- | -------------------------------------------------- |
| `variant`      | 语义太泛，不说明变化维度。                         |
| `size`         | 语义太物理，`scale` 更接近交互尺度。               |
| `shape`        | 属于全局风格，不属于单个 `Button`。                |
| `href`         | 属于 `Link`，不属于 `Button`。                     |
| `target`       | 属于 `Link`，不属于 `Button`。                     |
| `icon`         | 属于 `content`，不应作为一级特权 props。           |
| `trailingIcon` | 属于 `content`，不应作为一级特权 props。           |
| `enabled`      | 它是判断语义，不是 `Button` 本体应承担的显示语义。 |
| `validIf`      | 它会把外部判断设施直接并入 `Button` 本体。         |
| `validator`    | `Button` 可以接收状态，但不应内建判断器。          |

## 最终结构

```txt
Button
├─ action
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
│  ├─ small
│  ├─ normal
│  └─ large
├─ status
│  ├─ business input
│  │  ├─ idle
│  │  ├─ loading
│  │  └─ disabled
│  └─ interaction feedback
│     ├─ hover
│     ├─ active
│     └─ focus-visible
└─ content
   ├─ children
   └─ label
```

## 定稿句

- `Button` 是动作信息的视觉发声器。
- `tone` 决定它用多大声说话。
- `intent` 决定它说的事情是什么性质。
- `scale` 决定它在当前空间里占多大交互尺度。
- `status` 表达它现在处于什么状态，以及能不能被操作。
- `status manager` 负责承载状态，不负责判断状态。
- `content` 决定它向用户表达什么。
- 默认 `Button` 是 `normal tone + neutral intent + normal scale + auto type`。
- 默认 `Button` 是正常声量、普通性质、默认尺度、自动类型。
- 默认 `Button` 不是强噪声入口。
- 默认 `Button` 是舒适、清晰、可增强、可减弱的动作承载器。
- `validator`、`credibility`、`query database` 属于外部判断设施，不属于 `Button` 本体。
- DOM 里不要自动添加默认值，就如CSS， 默认值可以手动指定，但是有client端默认值。
