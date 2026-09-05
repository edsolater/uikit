# JSS 样式系统

本 Plan 负责 UIKit 样式的 JSS 化。长期目标是只保留直接服务原始 HTML 的 reset.css；当前实施范围是 JSS 基础体系与 Button，其余组件和静态样式继续分阶段迁移。

## 目标与原始依据

样式原子化的目的，是让人和 Agent 通过已成立的积木组合组件。人审查业务时能看出组合关系、顺序和局部覆盖，不必重新阅读每项底层实现。旧 CSS 提供语义参考，不是逐像素或逐 selector 的对照要求。

历史依据：

- 9a533db 的 plugin utils/css-variable.ts 表达了智能状态变量与 surfaceColor → bgColor 的派生意图。原型尚未完成注册，不能把其运行缺陷作为契约。
- 1c1db38、4d27145 的本 Plan 明确 Box 生命周期、可复用结果与最终解析边界。
- 用户最新明确的全局状态配方、CSS 层叠及继承语义优先。Git 仅用于只读调查，不执行改变工作区、索引或历史的 Git 命令。

## 需求实现合同

本轮由总监固定语义，调查员核查历史，实现工程师修复 core，总监整理 tokens 与 Button，独立审查员直接对照用户原要求审查。没有证据的满足按未满足处理。

| 要求及责任主体 | 验收与证据位置 | 当前状态 |
| --- | --- | --- |
| Box 的 attach 连接真实生命周期；活根激活子内容，活 Box 追加内容继续输出；共享结果支持多父、多 Document | core/css-box.ts、core/css-stylesheet.ts；jss.test.ts 活追加、共享、重入及失败重试反例 | 满足 |
| cssVariable 保存自身全局默认与状态配方，使用只触发注册，不改变 selector 作用范围 | core/css-variable.ts；jss.test.ts 同名注册/冲突，jss.browser.test.ts 全局消费者、局部覆盖、继承 | 满足 |
| Value 与派生颜色保留对象和依赖，动态读取及字符串转换只发生在最终输出边界 | core/css-value.ts、parse-css 系列；jss.test.ts 动态返回、外部协议、嵌套派生；组合层无 parse/String | 满足 |
| core、atoms、tokens 分清定义责任；tokens 包含实际默认与智能派生，不是字符串别名表 | tokens/color.ts 等材料；历史对照、独立审查、无静态 CSS 的 Button 和智能颜色浏览器用例 | 满足 |
| Button 消费积木与 tokens，表达基础、solid、bare、tone、size、disabled | Button.style.ts、button.browser.test.ts；2048 单元/浏览器测试及构建 | 满足 |
| 文件命名、注释、架构和包入口与实现一致；没有旧职责并存 | 独立规则审查、类型检查、构建、子路径实导入、旧入口搜索和架构文档核对 | 满足 |

发生循环引用或冲突注册时暴露错误，失败不能记为已成功。CSS 的原生覆盖是合法行为，不属于注册冲突。任一合同项缺少证据时继续施工，不以总测试数抵消。

## 概念与边界

- CssKey 表示 CSS 写入位置。
- CssValue 表示内容，可以是原始值、动态对象、嵌套组合、变量或未来函数表达。所有内容最终由底层 parseCss 系列转换。
- CssDeclaration 保存 key/value 及依赖。它本身是离线结果。
- CssBox 保存容器头部、内容顺序与激活关系。selector、atRule、stylesheet 是公开创建函数，不带 Box 后缀。
- CssBlock 是内容加外层 CssBox 的可复用结果。裸 key/value 不是 block，包裹后的 { display: none } 可以是 block。
- cssAtom 是通用积木 namespace，所有成员都是返回 CssBlock 的函数。注册允许扩展和覆盖，不按来源拆 namespace。
- token 表示可复用语义材料，CssVariable 是其一种实现形式。token 可以含默认值、主题条件、状态和派生关系。

领域在定义端成立。Button 调用这些工具仍是 Button 业务，不因使用 value、block 或 selector 拆成一批工具分类文件。

## 生命周期与输出

模块加载、变量创建、atom 工厂注册、取得 declaration 和离线 attach 均不写 CSS。

stylesheet 连接 Document 后成为活根，激活沿 Box → 子 Box / Block → Declaration → Value 传播。共享结果可以挂到多处；依赖的成功注册在同一 Document 幂等，不同 Document 分别执行。活 Box 追加内容时，新内容继承活挂载并更新所有相关 stylesheet。

value 激活后不反注册、不回收。stylesheet 的替换连接属于挂载管理，不把它误解成 value 失活。

parseCss 系列承担最终转换。单独解析离线对象不注册 CSS。生命周期不能由一次 parser 遍历碰巧触发来冒充；动态 value 在最终读取时才显露的子对象也必须进入真实激活关系，不要求业务手动补登记。

组合函数包括颜色混合都保留输入对象。即使放在延迟回调中，组合函数主动调用 parse 仍然是提前压平。业务只消费对象，不承担转换责任。

## 智能变量与原生层叠

cssVariable 是统一公开名称，不另外暴露 cssStateVariable 分类。变量保存自己的延迟注册配方；使用者只决定何时需要它，不提供或改变配方的 selector 上下文。

例如以下配方在变量首次真实使用时注册：

```css
@property --smart-color {
  syntax: "<color>";
  inherits: true;
  initial-value: blue;
}

:where(:hover) {
  --smart-color: green;
}

:where(:active) {
  --smart-color: red;
}

:where(:focus-visible) {
  --smart-color: orange;
}
```

默认值可以由 @property 初值提供；没有相应初值或默认值为派生表达时，在低权重根规则提供可继承默认。不能给每一个元素重设默认值，切断祖先的局部覆盖继承。

property.initialValue 与根上的 value.default 是不同 CSS 位置；inherits 为 false 时，元素采用自己的注册初值，根声明不向后代继承。JSS 保留这项 CSS 行为，不自动改写 inherits。Button 当前与变量注册处于同一非命名层，以权重和源码顺序表达覆盖；其他使用方选择 layer 时仍服从原生层叠层规则。

全局低权重状态是默认逻辑。局部 declaration 可以覆盖它；同权重同时命中时遵从 CSS 源码顺序。JSS 不提高权重、不绑定使用方 selector，也不消除层叠。

```ts
selector('.Example', cssAtom.backgroundColor(cssBaseVariable.bg))
selector('.Override', cssBaseVariable.bg.declaration('blue'),
  cssAtom.backgroundColor(cssBaseVariable.bg))
```

第一个使用默认智能颜色；第二个有意指定局部背景值。declaration() 表达取得声明结果，不是立即执行 CSS 注册。custom property declaration 由变量提供，不通过 atom 再造入口。

智能颜色由 token 定义端表达派生：表面色拥有状态配方，背景混合表面与强调色，前景与动作色各有自己的状态关系。派生始终保留对象引用，浏览器按 CSS 变量、层叠和主题计算实际颜色。

## 实施落点与顺序

1. 修复 core 的 Box 激活、动态 value 依赖、全局变量配方与纯解析边界，移除 CssDeclarationBranch 的错误局部状态路线。
2. atoms 承担通用 property 工厂和 focus ring；tokens 按 color、dimension、elevation、motion、typography 定义材料。默认值和必要主题、媒体条件由材料自身携带，未使用材料不写 CSS。
3. Button 删除全局 token 别名表，直接消费材料并组合业务 selector。局部尺寸和外观覆盖留在 Button。
4. 浏览器同时验证全局消费者、局部覆盖、继承、活 Box 追加和无整组静态 CSS 的 Button。
5. 独立审查对照历史和用户要求，检查有无改写需求、缩小作用范围、提前压平或以测试规避缺口。
6. 最后同步真实架构和文件职责，完成类型、构建和下游验收。

当前 tokens 提供 Button 所需闭包；颜色、尺寸、动效等其余公开能力仍按后续迁移扩展，不据此声称所有 CSS 已迁完。

## 验证与收口

- 正例：只 import 不写 CSS，首次使用注册；多实例幂等；派生值保持对象。
- 反例：局部覆盖能压住全局状态；祖先覆盖能继承；另一个 selector 能消费已注册的全局状态。
- 生命周期：活链追加立即更新；共享 Box 多根、多 Document；失败可重试；循环与注册冲突暴露错误。
- 无静态基础 CSS 的 Button 显示、状态、尺寸和语气成立。
- UIKit 类型检查、单元与浏览器测试、生产构建；下游 2048 测试和构建。
- 具名函数 JSDoc、文件头、kebab-case 新文件、缩写 camelCase；不引入源码 declare / readonly。
- 当前包入口 @edsolater/uikit/jss，旧 style-utils 子路径和错误状态分支职责不得并存。

## 本轮交付证据

2026-09-05：独立审查裁决为理解保持，未发现阻断语义偏移。JSS 核心定向测试 18 项；UIKit 全单元 22 个文件 92 项、浏览器 9 个文件 31 项通过，类型检查和生产构建通过。发布子路径 @edsolater/uikit/jss 的实际导入取得 cssAtom 工厂及 bg 变量。

下游 my-playground 的 UIKit Junction 已确认指向当前工作区；2048 单元 41 项、浏览器 17 项和生产构建通过。既有静态 CSS 的 @function 压缩器警告仍存在，属于后续静态 CSS 迁移范围。

这些证据覆盖本轮基础体系与 Button；没有把其他组件的全量迁移标成完成。失败测试临时截图已清理，Git 全程只读。

## 后续迁移

其余组件、controls、traits、plugins、Example 和非 reset 静态 CSS 逐步迁移。SSR 收集、其他输出 target、使用记录与 localStorage 预热需在对应任务明确；本轮不额外实现这些系统。
