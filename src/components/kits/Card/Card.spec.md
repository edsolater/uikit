# Card 设计规格

## 文档定位

- 本文档是调用方判断是否使用 `Card`、怎样选择属性以及怎样进行特殊样式覆盖的完整入口。
- Surface 为什么不是组件，见 [失败组件](../../../../docs/组件失败记录.md)。

## 组件定义

`Card` 表达一个有边界、能够独立理解的信息单元。它把一组相互关联的标题、正文、状态或操作收在同一个可想象对象中。

```txt
Card = 一个独立信息单元 + variant + size
```

最小调用已经是完整可用的 Card：

```tsx
<Card>
  <h2>账户摘要</h2>
  <p>这里是同一个账户单元中的信息。</p>
</Card>
```

调用方不需要先写 class、padding、圆角、背景、边框或阴影，才能让 Card 成立。Card默认块排版并裁剪内容首尾块外边距；需要固定间隔、顺序流或分栏时，在内容处组合Flow或Grid，不由Card隐式排列。

## 什么时候使用

- 一组内容可以脱离周围内容，被独立理解或处理时使用 `Card`。
- 标题、说明、状态和操作共同描述同一个对象或主题时使用 `Card`。
- 同类信息单元需要以列表或网格并列展示时，每个单元可以使用一个 `Card`。
- 需要调整 Card 的视觉声量或内部容纳尺度时，使用 `variant` 和 `size`。

## 什么时候不使用

- 只需要无视觉身份的 DOM 分组时，使用 `Piv` 或原生元素。
- 页面主区域、侧边栏、详情 Pane 或普通 Section 应按真实区域角色定义，不能因为它有背景就改叫 Card。
- Popover、Dialog 和 Menu 拥有自己的交互与层级协议，不使用 Card 代替。
- Card 不负责 Drag、Top Layer 提升、页面宽高、外部定位或周围布局。

## 快速使用

### 默认 Card

```tsx
<Card>普通信息单元</Card>
```

### 与正文语义组合

Card 为一篇独立正文提供视觉承载时，在内部组合无皮肤的 Article：

```tsx
<Card>
  <Article>可独立理解的正文</Article>
</Card>
```

外层 Card 保留容器根节点与材质，内层 Article 固定原生 `article`；两者各自拥有实例。若 Card 是正文中的资料卡片，也可以放在 Article 内。嵌套顺序按实际含义决定，见 [组件嵌套](../../../../docs/guide/组件嵌套.md)。Card 不提供 `is` 内容模式；语义组件当前列表见 [语义组件](../../../../docs/guide/语义组件.md)。

### 选择视觉声量

```tsx
<Card soft>低声量辅助信息</Card>
<Card>默认信息卡片</Card>
<Card solid>需要稳定阅读对比的信息</Card>
```

### 选择物理尺度

```tsx
<Card small>紧凑信息</Card>
<Card>默认信息</Card>
<Card large>宽松信息</Card>
<Card xlarge>大尺寸信息单元</Card>
```

## Props 总览

`CardProps` 的公开调用签名等价于：

```ts
interface CardProps<Tag extends PivSupportedElementTag = 'div'>
  extends
    PivProps<Tag>,
    VariantProps<'variant', 'soft' | 'solid'>,
    VariantProps<'size', 'small' | 'large' | 'xlarge'> {}
```

### Card 自有属性

| 属性                       | 类型                                                  | 默认值      | 含义                             |
| -------------------------- | ----------------------------------------------------- | ----------- | -------------------------------- |
| `soft`、`solid`            | `Source<boolean \| undefined>`                        | `undefined` | 确定的视觉声量描述词。           |
| `variant`                  | `Source<'soft' \| 'solid' \| undefined>`              | `undefined` | 视觉声量会变化时使用的不定字段。 |
| `small`、`large`、`xlarge` | `Source<boolean \| undefined>`                        | `undefined` | 确定的物理尺度描述词。           |
| `size`                     | `Source<'small' \| 'large' \| 'xlarge' \| undefined>` | `undefined` | 物理尺度会变化时使用的不定字段。 |

确定描述词和值字段都可以响应式变化。不定字段一旦声明便接管同组输入；同组冲突只警告，不中断运行。

### 从 Piv 继承的属性

| 属性          | Card 中的含义                                                     |
| ------------- | ----------------------------------------------------------------- |
| `as`          | 选择 Card 根原生元素，默认是 `div`；不替代独立 Article 语义组件。 |
| `children`    | 提供属于同一个信息单元的完整内容。                                |
| `id`          | 设置根元素原生 id。                                               |
| `if`          | 为 `false` 时 Card 与 children 都不进入 DOM。                     |
| `class`       | 与根身份 `Card` 合并，用于业务身份或特殊表现。                    |
| `style`       | 设置根元素行内样式或单实例 CSS 变量。                             |
| `htmlProps`   | 设置原生 HTML、ARIA、`data-*` 或 DOM property。                   |
| `on`          | 注册根元素原生事件；Card 本身不增加点击协议。                     |
| `domRef`      | 取得根 DOM，作为命令式逃生口。                                    |
| `is`          | 注入稳定性质或能力。                                              |
| `shadowProps` | 上层组件封装 Card 时转交低优先级 Piv props。                      |

`as` 由 `PivSupportedElementTag` 约束，TypeScript 会根据所选标签检查 `htmlProps` 的原生属性类型。

## Variant

`variant` 只调整同一种 Card 的视觉声量，不表示业务种类、交互状态或 Top Layer 层级。

| 写法           | 表现                                     | 适用场景                 |
| -------------- | ---------------------------------------- | ------------------------ |
| 省略 `variant` | 半透明主题背景、柔和边界、基础卡片阴影   | 普通信息卡片。           |
| `soft`         | 更透明的主题背景、更弱边界、更轻阴影     | 辅助信息、嵌套信息单元。 |
| `solid`        | 实体主题背景、完整柔和边界、基础卡片阴影 | 需要稳定文字对比的卡片。 |

- 默认 variant 通过省略表达，不提供 `normal`。
- `soft` 不是 disabled，也不降低内容可读性。
- `solid` 不表示 Card 被提升到 Top Layer。

## Size

`size` 只调整 Card 内部容纳内容的物理尺度，不设置外部宽高或定位。

| 写法        | Padding     | Radius       | 适用场景                   |
| ----------- | ----------- | ------------ | -------------------------- |
| `small`     | `--space-4` | `--radius-3` | 紧凑信息单元。             |
| 省略 `size` | `--space-6` | `--radius-4` | 普通信息单元。             |
| `large`     | `--space-7` | `--radius-4` | 宽松信息单元。             |
| `xlarge`    | `--space-8` | `--radius-4` | 内容较多的大尺寸信息单元。 |

尺寸确定时优先写 `small`、`large` 或 `xlarge`。具体档位由现有界面状态决定时，使用 `size`；它的字段轮廓明确告诉阅读者该分类是不定的。

variant 与 size 的默认解析结果都是 `undefined`，没有额外的默认候选。

## 与 Board 共用承载

Card 是一级独立信息体；Board 是零点五级承载角色。二者调用同一渲染实现，分别登记 Card 或 Board 身份，只创建一个原生节点，不互相套壳。Card默认块排版，Board保留网格和按尺寸变化的gap；margin trim只负责Card自己的块边界，不跨越内部Flow或Grid递归裁剪。

材质唯一落在 `../Board/Board.style.ts`，Card自身的块排版与首尾裁剪归`Card.style.ts`。Card入口选择自己的身份样式类，共享节点本体只转交调用方的class，不识别Card语义或分支。背景、边界、阴影、内部空间按上述 variant 与 size 规则产生；不再维护旧 `--Card-*` CSS 变量。`boardBorder` 是可供信息主体派生的公开边界材料；MessageBoard 在同一承载根消费自己的反馈边界，不修改 Board 的后代或默认材质。业务调用方按公开组件协议组合，不传样式袋。

## 交互边界

- Card 默认不是按钮，也不因为注册 click 事件就自动获得按钮语义。
- 整卡点击、选中状态、链接导航和复杂操作区需要先形成明确协议，再由具体组件或后续 Card 能力表达。
- 不要把交互 Card 临时实现成带 `onClick` 的普通 `div`，同时缺少键盘和可访问性语义。
- Top Layer 的提升状态与提升阴影仍由 Top Layer 负责。

## 主题与性能

- 所有 variant 都从当前主题的 `--color-surface`、`--color-line-soft` 和阴影 Token 取值；暗色主题不复用硬编码半透明白色。
- Card 禁止使用 `backdrop-filter: blur(...)` 和 `filter: blur(...)`。
- 当前颜色增强只有 `saturate(1.12) brightness(1.03)`，不移动像素，也不是 Card 成立的前提。
- 如果 Trace 显示颜色过滤仍有明显合成成本，可以直接删除过滤，只保留背景、边框和阴影。
