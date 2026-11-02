# Article 设计规格

## 组件定义

`Article` 表达一份能够脱离当前页面结构、仍可独立理解的正文内容。它是语义组件，不提供背景、内边距或边框；组件自身通过`.Article`默认裁剪内容首尾块外边距，保留中间内容间距。这不改变所有原生article标签的行为。

```txt
Article = 独立正文语义
Card    = 可选的视觉形式
```

默认调用直接生成原生 `article`：

```tsx
<Article>正文内容</Article>
```

## 什么时候使用

- 内容拥有自己的主题，并能通过独立 URL 打开或脱离周围结构阅读时使用 Article。
- Example 详情正文、文章、帖子或其他独立成篇内容可以使用 Article。
- 只需要普通分组、页面 Section、侧边区域或视觉 Card 时不使用 Article。

Article 不是为了把所有原生 `article` 标签组件化。只有“独立正文”本身构成阅读代码时的强抓手，才使用它。

## 透明承载

Article 可以让另一个组件承载它的视觉形式：

```tsx
<Article as={Card} class="example-card">
  正文内容
</Article>
```

最终只生成一个节点：

```html
<article class="Article Board Card example-card">正文内容</article>
```

`as={Card}` 在 Article 中具有明确协议：

- `as` 选择表现载体，不选择另一种原生标签。
- Article 消费 `as`，再要求载体使用原生 `article`。
- Article 不在载体外再创建一层 DOM。
- 载体的其他公开属性可以直接传给 Article。
- Article 的正文语义优先于载体原本的默认原生标签。

因此：

```tsx
<Article as={Card} {...props} />
```

在单节点原生语义和载体属性转交上等价于：

```tsx
<Card as="article" {...props} />
```

前一种写法优先表达“这是一篇正文”，更适合正文详情调用处。Article仍保留自身`.Article`类与正文边界裁剪，因此不表示两种写法的最终class完全相同。

## Props

不传载体时，Article 接受除 `as` 之外的 `PivProps<'article'>`：

| 属性                         | 含义                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| `children`                   | 正文的完整内容。                                           |
| `id`                         | 原生 article 的 id。                                       |
| `if`                         | 为 `false` 时正文不进入 DOM。                              |
| `class`                      | 附加正文的调用方身份。                                     |
| `style`                      | 设置原生 article 的特殊样式。                              |
| `htmlProps`                  | 设置 article 可用的 HTML、ARIA、`data-*` 或 DOM property。 |
| `on`                         | 注册原生事件；Article 本身不增加交互。                     |
| `domRef`                        | 取得最终原生 article 节点。                                |
| `plugin`、`plugins`、`trait` | 注入 Piv 底层能力。                                        |
| `shadowProps`                | 上层组件转交低优先级 Piv props。                           |

传入 `as={Card}` 后，Article 接受 Card 除 `as` 之外的公开属性，例如 `variant` 和 `size`。Article 占有最终原生语义，因此调用方不能再把载体改成其他标签。

## 默认 Card 不需要额外属性

Card 的默认 variant 已经是完整可用的半透明主题卡片。Article 只需要默认 Card 时直接写：

```tsx
<Article as={Card}>正文内容</Article>
```

不要为了表示“这是正文”附加 `solid`。variant 只在正文确实需要不同视觉声量时选择。

## CSS 变量

Article只拥有正文边界的首尾外边距裁剪，不提供皮肤或CSS变量。使用`as={Card}`时，可使用Card已公开的样式控制点；这些材料仍然属于Card。
