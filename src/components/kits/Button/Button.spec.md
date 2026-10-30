# Button 设计规格

## 实例与整体控制

`ref` 接收 `ButtonController`，`domRef` 独立接收真实 button，Controller 不包含 DOM。`createRef<ButtonController>()` 与 `ref` 配对，直接使用 `button.setStatus?.('loading', true)`；`createDomRef<HTMLButtonElement>()` 与 `domRef` 配对，直接使用 `buttonElement.focus?.()`。两者都返回稳定的 Partial 引用和接收器，未接入或退出后各属性为 undefined；方法及 getter 保留当前接收对象的 this。接收器可返回清理函数，元素退出时执行。

Controller 公开既有 `setStatus`、`hasStatus`。外部已声明的 loading、disabled 始终由外部 Source 控制，setStatus 不覆盖它。原生聚焦、点击等操作通过独立的 DOM 引用使用。

`allButton` 将当前实例的属性与方法统一映射为集合代理，不设置方法白名单。例如 `allButton.setStatus('loading', true)` 立即逐个操作并返回该次结果集合，`allButton.hasStatus('disabled')` 返回各实例的状态来源集合，不自动解包。深层路径可继续读取与调用；预取路径仍跟随当前实例，空集合继续得到空集合代理，调用结果则固定为该次结果，不因再次读取而重复操作。

FNKit 的 `createVirtualBatchAccessor(controllers)` 直接接收 Controller 集合，创建以函数为 target、Array.prototype 为原型的批量访问器，支持 Array.from、length、数字索引及数组操作；FNKit isArray 返回 true，原生 Array.isArray 返回 false。数组固有成员优先于同名实例成员，直接绑定本次映射快照，保留原生参数和原生返回值；例如 map 返回普通数组，不继续包装批量访问器。数组操作不登记、注销或回写 Controller。`allButton.style` 是静态扩展，直接提供原有 Token，保留身份和独立 Source 阶段。if 关闭时退出整体控制，重新显示保留实例自己的内部状态；整体操作不保存给未来实例。

## 分类契约与样式

组件 API 使用 appearance、tone、emphasis、size 四组分类。Button.style.ts 消费这些分类：filled 使用填充背景及对应内容色，outlined 保留浅底和可见轮廓，plain 常态透明且无边界；danger 选择危险配色。emphasis 调整整颗按钮的存在感，包含文字与图形内容，不改变外观形式和尺寸。

- `emphasis` 表达组件整体的存在感，取值为 `soft`、`strong`；直接属性使用同名描述词，省略时为普通表现。不规定透明、实底或边框等实现方式。
- `tone` 表达动作的语义基调，当前确定的标记为 `danger`；原 `accent` 退出。其他候选以后讨论。
- Variant 描述组件的分类选择，分组内单选，分组之间可以组合，例如 `danger` 与 `strong`。Status 独立描述当前成立的情况，多个状态可以叠加。两者都允许响应式变化。
- `appearance` 表达外观形式，取值为 `filled`、`outlined`、`plain`。原始选择省略时仍为 `undefined`，由公开映射表转换成外观输出，初始映射为 `outlined`。

## 样式来源与公开控制点

Button 背景配方直接引用 surfaceColor，普通内容引用 contentColor；主题来源的实际 CSS 变化继续传递给消费者。buttonColorSource 提供基色，buttonSurfaceColor、buttonContentColor、buttonBoundaryColor 分别表达背景、内容和边界；需要声明的 Token 在显式 address 或当前 AST 消费地址建立定义，无须额外注入组件地址。表达式保留来源引用，rules 只消费属性，不再在其他位置给这些 Token 赋值。

公开 Token 在 [Button.style.ts](./Button.style.ts) 独立命名并导出，外界可以读取定义、组合当前值引用、创建自己的派生定义，或通过 modify 在明确范围加工。控制包括读取和复用，不要求给 Token 增加可写接口，也不根据组件内部的消费次数决定是否公开。

组件独有且具有稳定视觉含义的控制量独立命名并公开，包括颜色、字号、字重、尺度、内容间隔、两向 padding、阴影和透明度。Source 表达独立来源阶段，不能与最终结果混同。取舍依据见[样式书写的一些权衡建议](../../../style-system/doc/样式书写的一些权衡建议.md)。

| 导出 Token            | 职责与值来源                                           | 参与的 CSS 或后续定义                       |
| --------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `buttonColorSource`   | brandColor 与危险语气的 badColor，包含交互颜色规则     | 背景、内容、边界和焦点颜色的来源            |
| `buttonSurfaceColor`  | 基色与 surfaceColor 的混色，包含外观差异               | `background-color`                          |
| `buttonContentColor`  | contentColor、语气基色与填充外观的 paperColor          | `color`                                     |
| `buttonBoundaryColor` | 基色的边界颜色配方                                     | `outline` 的颜色及 buttonBorderColor 的材料 |
| `buttonBorderColor`   | 普通透明边界，outlined 选择 buttonBoundaryColor        | `border-color`                              |
| `buttonTextSize`      | textSize 及其尺寸状态                                  | `font-size`                                 |
| `buttonFontWeight`    | 基于 fontWeight 的按钮字重                             | `font-weight`                               |
| `buttonMinHeight`     | controlSize 及其尺寸状态                               | `min-height`                                |
| `buttonGap`           | baseSpace 及其尺寸状态                                 | `gap`                                       |
| `buttonPaddingBlock`  | 间距基准与组件尺寸差异                                 | `padding` 的上下值                          |
| `buttonPaddingInline` | 间距基准的横向比例与组件尺寸差异                       | `padding` 的左右值                          |
| `buttonBoxShadow`     | 基础阴影材料与外观、交互、禁用差异                     | `box-shadow`                                |
| `buttonOpacitySource` | 强调选择后、禁用缩放前的独立透明度阶段                 | 外部引用及 buttonOpacity 的基础内容         |
| `buttonOpacity`       | 强调透明度与禁用缩放共同决定的有效透明度               | `opacity`                                   |

这些控制点使 rules 直接表达属性与角色的对应。固定字体继承、行高、圆角、边框形式和光标反馈等内部规则仍可内联，不为每个常量另建公开 Token。

控制量统一先定义导出，再在 rules 中引用；默认比例由组件维护，不取消外部独立控制。间隔与两向 padding 在按钮地址接收尺寸状态，上下 padding 仅覆盖与共享间距不同的超大档。buttonOpacitySource 保留强调选择后的完整阶段，buttonOpacity 在此基础上处理禁用缩放，两者均可独立引用。

局部独立定制也可以创建自己的 Token，在匹配按钮的 CSS 属性中消费。手动 declare 保留为 dangerous 操作，不是公开控制点的默认使用方式；调用方自行承担层叠和状态交集后果。

主题不是整颗按钮的单一染色开关：filled 常态使用语气实底，文字保留对比来源。危险语气使用固定的 badColor 引用，不另加工 hover、active 颜色；交互位移和禁用反馈仍各自生效。全局变化不能压掉区域或组件显式覆盖，也不能令危险 filled 回到普通来源。

使用例见[按钮主题与局部控制](../../../style-system/doc/从按钮需求组合样式.md#共用主题来源还是只改这颗按钮)，结果边界见[共享主题与组件颜色控制.md](../../../style-system/doc/behaviors/共享主题与组件颜色控制.md)。

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
<Button
  size={buttonSize}
  appearance={buttonAppearance}
  tone={buttonTone}
  emphasis={buttonEmphasis}
>
  动态按钮
</Button>
```

## Props 契约

```ts
interface ButtonProps
  extends
    PivProps<'button'>,
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

| 分组     | 确定描述词                    | 不定字段     | 省略时                                  |
| -------- | ----------------------------- | ------------ | --------------------------------------- |
| 外观形式 | `filled`、`outlined`、`plain` | `appearance` | 原始值 `undefined`；初始输出 `outlined` |
| 语义基调 | `danger`                      | `tone`       | 普通性质                                |
| 存在感   | `soft`、`strong`              | `emphasis`   | 普通表现                                |
| 物理尺寸 | `small`、`large`、`xlarge`    | `size`       | 默认尺寸                                |

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
- 默认 `type="button"`作为低优先级声明；提交和重置通过 `htmlProps` 明确传入，沿原生 HTML 字段的动态值语义消费。
- 原生 button 的 `name` attribute 使用 `htmlProps.name`，不使用顶层 `name`。
- 不提供 `variant`、`shape`、`href`、`target`、`icon`、`trailingIcon`、`enabled`、`validIf` 或 `validator`。
- 图标属于 `children`；导航属于 Link；状态判断属于外部业务。

## 输出协议

- Variant 分组分别输出 `data-appearance`、`data-tone`、`data-emphasis`、`data-size`；不输出旧 `data-variant`。
- 当前成立的 Status 合并输出到 `data-status`，以空格分隔。
- 这些分类概念仍然存在于类型、注释和 DOM 协议中；运行时不需要 Profile 或枚举对象维持分类。
