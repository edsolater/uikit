# 如何引用 UIKit CSS

`src/css` 存放可以被外部项目单独引入的原子化 CSS 文件。每个文件只负责一个稳定样式职责，例如 `reset.css` 只负责浏览器默认样式重置，不负责主题色、组件样式或页面布局。

## 安装包

```bash
bun add @edsolater/uikit
```

## 在应用入口引入

在外部项目的入口文件里直接引入需要的 CSS 原子文件：

```ts
import '@edsolater/uikit/css/reset.css'
```

如果项目有自己的全局样式，建议先引入 UIKit 的 reset，再引入项目样式：

```ts
import '@edsolater/uikit/css/reset.css'
import './app.css'
```

## 构建注意事项

外部项目的构建工具需要支持从依赖包中引入 CSS。Vite、现代 Rollup、Webpack 和 Rspack 项目通常可以直接处理这种写法。

UIKit 发布包会把 `src/css` 原样复制到 `dist/css`，并通过 `package.json` 的 `exports` 暴露 `./css/*`。因此外部项目不应该引用 `dist` 路径，也不应该引用 UIKit 源码路径。

推荐路径：

```ts
import '@edsolater/uikit/css/reset.css'
```

不要使用：

```ts
import '@edsolater/uikit/dist/css/reset.css'
import '@edsolater/uikit/src/css/reset.css'
```
