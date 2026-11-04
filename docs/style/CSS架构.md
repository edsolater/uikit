# CSS 架构

UIKit 的手写样式只由 `reset.css` 负责浏览器默认行为的重置，由 `APP.css` 负责作用于 App 全局或根节点的样式，例如全局背景。组件中的样式，包括 ExampleDashboard 的样式，必须使用组件的 `.style.ts` 和 Style System；加载时机不能改变职责归属。插件、主题材料、原生控件外观与文档视觉策略同样由 Style System 定义并登记；边界和 Button 参照见[样式文件写法](样式文件写法.md)。

`reset.css` 只保留浏览器默认行为的重置。`all-base.css` 汇总 reset 并声明样式层顺序，不定义组件或 App 样式。包根导入这一入口；属于 App 全局或根节点的背景可由 `APP.css` 定义。

组件聚合入口登记原生控件、文档视觉策略及插件功能样式，应用在样式注册后调用 `cssRoot.mount()`；Style System 子入口的独立导入不登记这些规则。具体运行链见 [Style System 架构](../../src/style-system/architecture.md)。

旧的组件 CSS、tokens、controls 和 traits 的静态 CSS 不再是组件样式入口。旧 CSS 文件及其变量路径退出后，使用方应通过 Style System 的公开 Token 和组件能力接入；生成的 CSS 仍由浏览器负责层叠、继承和渲染。
