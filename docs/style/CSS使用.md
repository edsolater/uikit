# UIKit CSS 使用

引入 UIKit 包根后，基础 reset 随包加载。`APP.css` 只定义作用于 App 全局或根节点的样式，例如全局背景；组件中的样式必须写入该组件的 `.style.ts`，通过 Style System 登记，不能因首屏加载而放入组件 CSS。

```ts
import { cssRoot } from '@edsolater/uikit/style-system'
import { Button } from '@edsolater/uikit'
import './APP.css'

cssRoot.mount()
```

在页面提供 `<style id="css-root"></style>`，并在组件样式导入完成后、渲染前挂载。单独导入 Style System 子入口不会注册组件或文档级样式。动态加载新样式后需要再次挂载。

组件使用公开 Token、规则和表达式，不手写 `var(--...)` 引用旧材料；参照 [Button.style.ts](../../src/components/kits/Button/Button.style.ts) 和[样式文件写法](样式文件写法.md)。浏览器产生的最终 CSS variable 是 Style System 的输出；实例运行时数据可以通过 CSS variable 传递。
