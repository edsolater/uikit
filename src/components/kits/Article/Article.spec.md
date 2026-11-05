# Article 设计规格

Article 属于 [语义组件](../../../../docs/guide/语义组件.md)，表达独立成篇、能够脱离周围结构理解的完整阅读主体。默认只提供原生 `article` 与 `margin-trim: block`，不提供背景、内边距、边框或阴影等容器皮肤。

## 独立正文

```tsx
<Article>独立正文</Article>
```

Article 固定使用原生 `article`，不提供 `as` 标签选择或承载组件协议。普通分组或仅需视觉卡片时，不为此套用 Article。

## 显式组合 Card

```tsx
<Card large>
  <Article>需要视觉容器的正文</Article>
</Card>
```

这是 Card 承载独立正文的常规场景，外层 Card 根节点与内层 `article` 各自存在。Card 的尺寸、材质及原生属性直接写在 Card 上，不经 Article 透传；两个组件分别拥有样式、Marker、ref 和实例集合。Article 不提供 Group 命名空间，Card 不提供 `is` 正文模式。

Article 内也可以包含作为正文组成部分的资料卡片。两种方向含义不同，不规定组件的固定嵌套顺序，见 [组件嵌套](../../../../docs/guide/组件嵌套.md)。

## Props 与实例控制

`ArticleProps` 复用除 `as` 之外的 `PivProps<'article'>`，加上用途说明与自身 `ref`：

| 属性 | 用途 |
| --- | --- |
| `children` | 完整正文，可组合文字、标题或视觉容器，保留来源更新 |
| `description`、`descriptionDisplay` | 用途说明及结构查看中的显示选择 |
| `id`、`class`、`style` | 正文根的身份与调用方必要布局 |
| `htmlProps`、`on`、`domRef` | 原生 article 的属性、事件与 DOM 引用 |
| `if`、`shadowProps`、`is` | 既有显示、低优先级来源与附加能力 |
| `ref` | 接收 Article 自己的 Controller，不替代组合中 Card 的实例引用 |

`ArticleController.props` 通过既有字段状态干预正文输入，不包含 `as` 或 Card 的 `size`、`variant`。嵌套 Card 的引用只操作该 Card。

## 内容边界与样式

`Article.style.ts` 仅对 `.Article` 登记 `margin-trim: block`：裁剪自身首尾块外边距，保留中间正文间距。它不改变裸 `article`、`section` 或其他容器，也不跨嵌套 Card 修改其内边距、材质或子组件样式。

需要 App 布局约束时，由调用方声明正文在该布局中的位置和可收缩尺寸，不把页面布局或视觉皮肤变成 Article 默认值。
