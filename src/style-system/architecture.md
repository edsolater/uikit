# Style System 架构

Style System 保存 Key、Value、Declaration 与具体 Block 的结构，由 Root 同步激活并向浏览器追加完整规则。Button 已接入，其他组件未在本轮迁移。对象模型与未决扩展见 [design.md](design.md)。

## 入口与文件职责

[index.ts](index.ts) 公开基础 CSS 对象、选择条件和组合工具，只导出、不注册样式。values 与 declarations 是分组目录，不拥有独立领域契约，也不设 index；Button 直接从各具体文件具名导入值材料和属性操作。Style System 内部同样引用具体文件，不绕行公共 index。

| 位置 | 现役职责 |
| --- | --- |
| [core/css-key.ts](core/css-key.ts)、[core/css-declaration.ts](core/css-declaration.ts) | 属性 Key；Declaration 的 name、content 和内部 DeclarationRole，统一单条与多条属性输出。 |
| [core/css-value.ts](core/css-value.ts) | Value、激活上下文、字符串包装与延迟解析。 |
| [core/css-variable.ts](core/css-variable.ts) | 唯一变量创建入口；独立表达 fallback、可选根默认值、类型注册及 declareVariable 的局部取值定义。 |
| [core/css-block.ts](core/css-block.ts) | 普通 Block 对象、of 累计与当前 body；of 使用 fnkit 的 flapDeep 展开分组。 |
| [blocks/style.ts](blocks/style.ts) | Selector 下的属性、嵌套样式和媒体规则。 |
| [blocks/media.ts](blocks/media.ts) | 媒体条件下的完整 Rule。 |
| [blocks/keyframe.ts](blocks/keyframe.ts) | 动画名称下的 Keyframes，以及其中各时间点的 Frame。 |
| [blocks/property.ts](blocks/property.ts) | 自定义属性的 @property 注册描述符。 |
| [core/css-root.ts](core/css-root.ts) | 激活闭包、对象身份去重及完整规则的追加提交。 |
| [declarations](declarations) | 按属性系列保存 Key、属性解析规则与控制方法，返回节点本身。 |
| [selectors/msic.ts](selectors/msic.ts) | 可复用的选择条件字符串，不创建或共享 Block。 |
| [mixins/msic.ts](mixins/msic.ts) | inlineCenter 等有明确用途的属性组合函数。 |
| [values/materials](values/materials) | 已定义的值材料；固定值、变量和预先组合的复合值按实际含义共同组织。 |
| [values/functions](values/functions) | calc、color-mix、translateY 等 CSS 函数值；不包含阴影列表或属性声明。 |
| [values/shadow.ts](values/shadow.ts)、[transition.ts](values/transition.ts) | 一条阴影与一项过渡的内容及解析；类型不与消费它们的 CSS Key 混为一体。 |
| [values/list.ts](values/list.ts) | 保存完整 Value 引用的列表，供变量兜底或属性消费，不绑定阴影。 |
| [formatters/comma-list.ts](formatters/comma-list.ts) | 通用逗号列表输出，将上下文交给各项解析器；不创建 Value，不展开条目结构。 |
| [fnkit/derivable-object.ts](fnkit/derivable-object.ts)、[lazy-copy.ts](fnkit/lazy-copy.ts) | 独立保留对象派生与写时复制能力；CSS 核心不自动套用。 |

core 保存基础对象，tokens 不再作为目录层存在。Token 是值材料的使用称呼，不增加对象或构造函数；Variable 属于 Value，属性操作不属于 Value。

values 下的 materials 与 functions，以及 formatters 都是分组目录，不建立 index。materials 提供可直接选用的具体材料；functions 提供 CSS 函数值。阴影、过渡和完整值列表按各自内容独立定义，不再以“内部有多个部分”合并分类。shadowValue 保留名词式调用，表示取得一条 Shadow。

materials 中 font.ts、motion.ts、shadow.ts 各自合并固定尺度与可覆盖配置；space.ts、size.ts、radius.ts 分别承接空间长度与间距、控件尺寸、圆角。color-palette.ts 保存基础色板、中性色元和共同表面底色，color-surface.ts、color-text.ts、color-action.ts、color-tone.ts、color-edge.ts 分别提供背景、文字、动作、语气和边缘配色。基础表面底色不反向依赖语气配方，避免循环初始化。

appearance 和 *-theme 文件不再作为材料入口。混色比例就近保存在对应配方中；opacity.ts 只保存透明度。颜色注册选项在各变量处显式给出，不经过 inheritedVariable 包装。材料文件直接导出 normalSpace、pillRadius、bgColor 等名字，不要求使用方区分固定值与 CSS 变量。

## 对象与组合

Key 保存 name，使用 const generic 保留字面量类型，不添加 Brand。declaration 接收 Key 或名称、content 与可选解析职责，返回 Declaration。Declaration 的 name 表明目的；role 负责完整 CSS 输出，parseCss 将名称、内容与激活上下文交给它。

普通属性使用默认 Role，也可提供只解析属性内容的函数，由默认 Role 补上名称与标点。padding 方向形式、margin 等提供完整 DeclarationRole，输出多条属性；外界仍只面对 Declaration。Role 不是另一种节点或包装控制器。

当前没有通用 set 或 _set，也没有通过整体替换工作的正式调用方。日常内容在构造处确定，继续扩展使用属性自己的语义能力，例如 transition.append；不把直接改写 content 当成替代入口。将来若出现无合理替代方案的内部替换需求，按 [设计文档](design.md#declaration-的内容解析与控制) 的 _set 限制裁决，不预先保留逃生入口。

Value 与 Variable 都不可调用。普通属性接收 Value 或字符串，字符串由 toValue 包装，已有 Value 保留身份；不枚举关键字合法性。属性操作要求显式输入，不以空调用选择默认值。

declareVariable(reference, input) 产生作用域赋值，不改变共享 reference 或 fallback；直接把 reference 传给属性则输出 var(...)。定义渲染时先通知上下文经过目标变量，再解析输入 Value，因此只定义、不消费引用，也不会漏掉可选注册。

```ts
import { declareVariable } from './core/css-variable'
import { styleRule } from './blocks/style'
import { backgroundColor } from './declarations/color'
import { bgColor } from './values/materials/color-surface'

const kitStyle = styleRule('.example')
const appearance = [declareVariable(bgColor, 'red'), backgroundColor(bgColor)]
kitStyle.of(appearance)
```

每次创建 Block 都建立独立累计列表。of 使用 fnkit 的 flapDeep 按顺序展开递归数组并接收节点，返回自身；例如 of(a, [b, [c]]) 与 of(a, b, c) 接收结果相同。Content 复用 fnkit 的 MayDeepArray 类型。flapDeep 底层使用原生展开，受引擎调用栈限制，不另设极端深度处理算法。来源数组后续变化不影响已接收列表，列表中的节点仍保留身份。body 保存当前列表；子 Block 后续 of、声明节点后续 append 会反映在父节点下一次 parseCss 中。

具体种类决定节点位置：StyleRule 接收 Declaration、StyleRule、Media；Media 接收 Rule；Keyframes 接收 Frame；Frame 与 PropertyRule 接收 Declaration。Rule 排除不能独立提交的 Frame。Block 不维护激活状态、依赖表或 Root 订阅。

选择条件是字符串，例如 stateHover 与 stateActive；其匹配范围仍排除原生 disabled，状态自身不增加优先级。复用条件后，调用 styleRule 分别创建实例，不再通过包装函数避开共享状态。

padding 的位置形式保存一至四个值，方向形式保存 PaddingSides 并由内部 Role 输出指定的长属性；margin 的 Role 输出共用同一值的四个方向。border 保存有序组成部分；font 保存字体字段，其解析职责包含字号与行高的斜杠关系。

Transition 是 `[目标属性, 时长, 缓动, 可选延迟]` 单项内容，parseTransition 只解析该条目。transition 返回 TransitionDeclaration，保存条目列表并允许 append；条目数组不参与 Block 的分组展开。

ShadowShape 是一条阴影的几何与颜色配置，shadowValue(shape) 返回同时拥有值解析能力的 Shadow。它不保存 Key 或列表，单条阴影可以由不同属性消费。boxShadow 返回 BoxShadowDeclaration，接收独立 Shadow 列表，或者一个完整 Value/关键字；append 只用于直接配置的 Shadow 列表，不擅自拆解变量或已组合的列表值。

formatCommaList 在阴影声明、过渡声明和值列表之间复用，只决定逗号格式。属性声明选择消费单项还是列表，各项的内部语法仍由自身解析器负责，冒号与分号由 Declaration 提供。聚合内容不是 Key，值对象也不是属性声明。

valueList(...items) 返回 ValueList，通过 items 保留完整 Value 节点，不接收任意分隔符和字符串片段。materials/shadow.ts 用它组合接触阴影与扩散阴影，作为 raisedShadow 的根默认值。解析沿列表、单项 Shadow、几何与颜色继续调用 parseValue，保留注册闭包；同一 Shadow 可被多个声明或变量引用。

calcMultiply 保存原值和倍率，ColorMix 的 MixColor 表达各个参与混色的颜色及可选比例。joinValues 与 transitionValue 不在正式入口中，配置无需先制造排版片段或过渡包装节点。

materials/motion.ts 的 fastDuration 根定义等效于 calc(120ms * var(--sys-motion-scale))，motionDurationMultiplier 在普通偏好下为 1，在减少动效偏好下为 0；standardEasing 提供可覆盖的缓动曲线。计算留给浏览器，不在 JS 中提前求值。

## 激活与浏览器提交

宿主先提供 `<style id="css-root"></style>`；Root 不监听 DOMContentLoaded，也不自动创建承载节点。节点或 sheet 不可用时，先抛错，不激活 Value。

1. activate 接收完整 Rule 及递归集合，建立本次待处理集合。
2. Rule 沿 Block、Declaration 和复合 Value 的实际结构调用 parseCss(context)。
3. parseValue 先通知 Root，再渲染内容；同一 Root 首次遇到该 Value 时同步执行 onActive，缓存其返回的可选 Rule 或递归 Rule 集合。
4. 返回的规则集合按原顺序展开，加入待处理集合并继续遍历；集合按对象身份去重，激活环回到已有 Rule 时终止。
5. 坍缩完成后逐条 insertRule，只在插入成功后登记该顶层 Rule。

Root 不拼 CSS 语法。离线 parseCss 不触发 onActive；嵌套 Block 不提升到顶层。注册记录属于 Root，不写回 Value 或 Block；不同 Root 独立登记。

浏览器插入异常原样抛出，已成功规则保留，失败规则不登记。再次激活已登记入口仍遍历其内容，以补齐失败依赖，不重复插入成功规则或重复执行已缓存的 onActive。这不是整批原子提交。

## 按需材料

variable 创建普通引用对象；只有显式提供 root 或 registration 时才配置 onActive，返回需要提交的规则列表。普通引用以及只有 fallback 的引用不产生根定义或类型注册。

registration 预先组成 PropertyRule。注册描述符也使用 Declaration，initialValue 中的 Value 继续进入激活闭包。名称不含开头的 --；浏览器负责检查 syntax 与初值合法性。

颜色引用的注册保留 syntax: '*'、inherits: true 且不设初值，让未赋值变量继续使用 fallback。bgHoverColor、bgActiveColor 等独立对象保留原有状态覆盖链：先读状态变量，再读共同变量，最后读状态配方，不由值材料自动制造伪类规则。

root.value 形成低优先级 :where(:root) 默认定义；root.dark 保留根元素 data-theme="dark" 的覆盖，root.reducedMotion 保留减少动效偏好覆盖。未提供 root 时不产生这些规则。fallback 只影响 var 引用兜底，registration.initialValue 只属于浏览器类型注册，二者都不隐式成为根默认值。

root 和 registration 可以同时存在，按类型注册、根默认定义的顺序进入同一次激活。Root 使用 fnkit 的 flapDeep 展开入口与注册规则集合，不新增包装 Block、独立 Token 对象或额外注册器。原 token() 入口已由 variable() 接管。

动画名称用 Value 保存，onActive 可以返回 Keyframes；帧内注册变量继续在同一激活波处理。名称再次出现在 Keyframes header 时，不重复执行回调。

## Button 配置与接入

[Button.style.ts](../components/kits/Button/Button.style.ts) 使用直接导入，不再使用属性或材料 namespace。正文按基础样式、交互反馈、外观变体、语义色调、尺寸与状态定义配置，所有 of 在末尾组装区表达归属；分支先组成完整内容，再按既有顺序进入根节点 kitStyle。

文件是一级阅读单元；三行长等号注释区分二级区域，单行短横线标题区分三级主题，例如“语义色调”下的“危险操作”。节点注释与空行提供局部中文扫读入口，不为排版制造函数。inlineCenter() 返回通用居中组合；Button 专用外观与直接列出六条配置的 buttonTransition 留在当前文件，不要求 transitionValue 或 map。

当前唯一导出是 registerButtonStyle。kitStyle、各分支与声明节点均为内部配置，不承诺外部 JS 修改入口；测试通过组件的实际激活调用验证规则复用，不依赖导出私有节点。完整阅读约定见 [Button 的阅读与连接方式](design.md#button-的阅读与连接方式)。

Button 实际执行 → registerButtonStyle → cssRoot.activate(kitStyle) → 沿 Value 闭合注册 → 向 style#css-root 追加规则。只 import 不激活，服务器端跳过。Example 的 index.html、Storybook 的 preview-head.html 和浏览器验证宿主提供承载节点。

本次对象与入口调整保留既有 CSS 名称、取值、条件、顺序与优先级，包括 --component-* 和状态变量覆盖链，不改写实心、语气、禁用组合的级联策略。

## 验证与运行边界

单元测试集中在 Key、Declaration、Value 关系，Block 身份、累计和隔离，以及变量定义不修改共享引用。css-root.browser.test.ts 验证递归输出、注册闭包、@property、动画、去重和失败重试。Button 的浏览器用例验证真实挂载、变体、尺寸、主题、焦点、hover、禁用和局部覆盖；DOM 行为仍由 Button.test.tsx 验证。不为每个属性或配方增设测试文件。

CSS 成功插入后不修改、不卸载。运行变化使用 DOM 状态、媒体条件或元素 style 上的变量取值。构建节点不冻结，但 Root 不订阅后续 of 或 append：已登记顶层 Block 的内容变化不会自动提交；离线 parseCss 仍读最新内容。增量提交机制尚未实现。

declareVariable 只返回 Declaration，不直接写 DOM；没有新增 setTheme 或元素赋值适配器。Root 不按文本或名称合并，不报告同名冲突；承载节点被移除或替换后的恢复不在当前生命周期内。

Style System 尚无独立包级发布入口。后续扩展按设计文档裁决，不通过隐式订阅、兼容包装或规则重写绕过这些边界。
