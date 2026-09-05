# JSS 架构

## 领域与入口

src/jss 提供 CSS 对象表达、组合、生命周期和输出。业务组件从 @edsolater/uikit/jss 使用公开能力，领域不反向依赖组件。

- core 保存 Value、Declaration、Box 和 Block 对象，实现激活与最终解析。
- atoms 提供返回 CssBlock 的通用工厂与注册 namespace。
- tokens 定义颜色、尺寸、阴影、动效和排版材料，保存默认值及对象派生关系。
- Button.style.ts 消费这些材料，组织自己的 selector、语气和尺寸覆盖。

## 从组合到 CSS

创建、import、declaration()、离线 attach 与单独 parse 均不注册 CSS。mountCssStylesheet 把根连接到 Document，并为这份挂载建立 Box 激活环境。

```txt
组件执行
  -> mountCssStylesheet
    -> Box 激活环境沿子 Box / Block 传播
      -> Declaration 连接 Value 依赖
        -> Value 首次激活，执行自身延迟注册配方
    -> 最终 parse 读取对象树并收集动态出现的 Value
      -> 挂载方补激活动态依赖
      -> 更新该 Document 的 stylesheet
```

Box 保留每个活挂载的传播进度。活 Box 追加内容时，继续激活并更新它连接的所有 stylesheet；共享 Box 可以服务多个根与 Document。Value 的成功激活动作按 Document 幂等，失败仍可重试，不做反注册。

parseCssValue 和 parseCssStylesheet 只转换和收集结果。动态 source 在最终解析时读取，返回的子对象仍被递归识别，业务无需额外登记它的激活关系。解析成功而激活失败时保留待交付结果；解析失败保留待刷新状态，不能将空 stylesheet 当作成功。

## 智能变量与层叠

cssVariable 保存变量引用、全局注册配方与局部 declaration() 接口。其 value 配方支持默认、hover、active、focusVisible。首次消费触发全局注册，不借用使用方 selector。

- @property 保存 CSS 类型、初值和继承选择。
- 需要另行提供的默认值写在 :where(:root)，不逐元素重置。
- 状态写在全局 :where(:hover)、:where(:active)、:where(:focus-visible)。
- declaration(value) 取得有意的局部覆盖，局部覆盖、祖先继承、状态竞争均由 CSS 决定。
- inherits:false 的元素采用自身注册初值，不继承根 declaration。
- 全局伪类也可命中祖先；后代可能继承祖先的状态值。JSS 不把它缩成组件范围。

Button 当前使用非命名层，与全局变量配方按正常权重和顺序竞争。其他调用方可自行使用 atRule('@layer ...')，层的优先级仍遵从原生 CSS。

## 材料与业务

tokens/token.ts 将 token 默认值、暗色主题和减少动效条件保留为 Box/Declaration 对象，首次消费才挂载根规则。材料可以互相依赖；未消费的材料只存在于 JS。

颜色从品牌和中性色元派生语义颜色。cssBaseVariable.surface 持有状态表面，bg 通过 color-mix 对象依赖表面与强调色，fg 和 action 各有自己的状态配方。尺寸与排版提供可覆盖阶梯，阴影引用共享阴影色，动效时长引用媒体偏好缩放。

当前只覆盖 Button 所需材料闭包，其余静态 tokens 和组件还在后续迁移范围内。Button 浏览器测试不导入 all-base.css，验证其材料自身有默认定义；已有 CSS 或调用方仍可按层叠覆盖变量。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| index.ts | 公开 JSS 协议、atoms 和 tokens |
| atoms/css-atom.ts | 通用 property 工厂、focusRing 与可扩展 registry |
| tokens/token.ts | token 根默认、主题和媒体配方的延迟挂载 |
| tokens/color.ts | 颜色材料与智能 surface、bg、fg、action 派生 |
| tokens/dimension.ts | 间距、尺寸和边界厚度 |
| tokens/elevation.ts | 阴影颜色及高度派生 |
| tokens/motion.ts | 减少动效偏好、时长和缓动 |
| tokens/typography.ts | 共享字号 |
| core/css-key.ts | CSS key 规范化 |
| core/css-value.ts | 对象内容、序列及明确依赖 |
| core/css-value-activation.ts | Value 依赖激活、幂等和注册输出边界 |
| core/css-variable.ts | 全局变量配方与局部 declaration |
| core/css-declaration.ts | key/value 与激活依赖的离线结果 |
| core/css-color.ts | 不提前压平的 color-mix 对象组合 |
| core/css-box.ts | 有序内容及每个活挂载的传播状态 |
| core/css-box-activation.ts | 将 Box 内容连接到 Block、Declaration 和 Value 激活 |
| core/css-block.ts | 带独立外 Box 的可复用内容 |
| core/parse-css-value.ts | 最终 value 字符串与实际对象收集，检测循环 |
| core/parse-css-stylesheet.ts | 最终结构解析、顺序与循环检查 |
| core/css-stylesheet.ts | Document 挂载、活链刷新及失败重试 |
| jss.test.ts | 离线组合、动态依赖、活链、多根与失败反例 |
| jss.browser.test.ts | 全局状态、局部覆盖、继承、主题和真实 DOM 更新 |

文件边界发生在定义端。Button 的 tone、size、bare、solid 等业务组合留在 Button.style.ts；不会按所用工具类别创建 button-values 或 button-blocks 伪领域。

## 阅读路线

调用从 index.ts 进入；查材料读 tokens，查通用积木读 atoms。生命周期从 css-stylesheet → css-box → css-box-activation → css-value-activation 阅读；最终对象转换读 parse-css 系列。后续迁移见 [JSS 样式系统 Plan](../../docs/plans/JSS样式系统.md)。
