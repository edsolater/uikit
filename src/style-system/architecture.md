# Style System 架构

Style System 保存 Key、Value、Declaration 与具体 Block 的结构，由 Root 同步激活并向浏览器追加完整规则。Button 已接入，其他 JSS 消费者未迁移。对象模型与未决扩展见 [design.md](design.md)。

## 入口与文件职责

[index.ts](index.ts) 公开基础 CSS 对象、选择条件和组合工具，只导出、不注册样式。values 与 css-properties 是分组目录，不拥有独立领域契约，也不设 index；Button 直接从各具体文件具名导入值材料和属性操作。Style System 内部同样引用具体文件，不绕行公共 index。

| 位置 | 现役职责 |
| --- | --- |
| [css-key.ts](css-key.ts)、[css-declaration.ts](css-declaration.ts) | 保存属性名称与 Key–Value 关系；Declaration 输出冒号、分号。 |
| [css-value.ts](css-value.ts) | Value、激活上下文、字符串包装与保留引用的复合值。 |
| [css-variable.ts](css-variable.ts) | 唯一变量创建入口；独立表达 fallback、可选根默认值、类型注册及 declareVariable 的局部取值定义。 |
| [css-block.ts](css-block.ts) | 普通 Block 对象、attach 累计、当前 body 和递归集合展开。 |
| [css-block/style.ts](css-block/style.ts) | Selector 下的属性、嵌套样式和媒体规则。 |
| [css-block/media.ts](css-block/media.ts) | 媒体条件下的完整 Rule。 |
| [css-block/keyframe.ts](css-block/keyframe.ts) | 动画名称下的 Keyframes，以及其中各时间点的 Frame。 |
| [css-block/property.ts](css-block/property.ts) | 自定义属性的 @property 注册描述符。 |
| [css-root.ts](css-root.ts) | 激活闭包、对象身份去重及完整规则的追加提交。 |
| [css-properties](css-properties) | 按属性系列保存 Key 和属性函数；复合语法保留各输入 Value。 |
| [selectors.ts](selectors.ts) | 可复用的选择条件字符串，不创建或共享 Block。 |
| [mix.ts](mix.ts) | inlineCenter 等有明确用途的属性组合函数。 |
| [values](css-values) | 固定值、变量引用和复合值统一按内容组织；font-scale.ts、color-surface.ts 等系列平铺，不另设系列子目录。 |
| [values/appearance.ts](css-values/appearance.ts)、[opacity.ts](css-values/opacity.ts) | 圆角、边缘、焦点、阴影覆盖入口，以及透明度和混色配比。 |
| [fnkit/derivable-object.ts](fnkit/derivable-object.ts)、[lazy-copy.ts](fnkit/lazy-copy.ts) | 独立保留对象派生与写时复制能力；CSS 核心不自动套用。 |

core、tokens 不再作为目录层存在。Token 是值材料的使用称呼，不增加对象或构造函数；Variable 属于 Value，属性操作不属于 Value。

材料中的 *-scale.ts 保存固定尺度，*-theme.ts 组合可覆盖的默认材料；theme 不是独立运行系统。其他语义文件保存状态色、语气色、间距等引用。公共入口直接导出 normalSpace、pillRadius、bgColor 等名字，不要求使用方区分固定值与 CSS 变量。

## 对象与组合

Key 保存 name，使用 const generic 保留字面量类型，不添加 Brand。declaration 接收 Key 与 Value，返回确定的 Declaration；属性函数是普通组合手段，不增加角色。

Value 与 Variable 都不可调用。普通属性接收 Value 或字符串，字符串由 toValue 包装，已有 Value 保留身份；不枚举关键字合法性。属性操作要求显式输入，不以空调用选择默认值。

declareVariable(reference, input) 产生作用域赋值，不改变共享 reference 或 fallback；直接把 reference 传给属性则输出 var(...)。定义渲染时先通知上下文经过目标变量，再解析输入 Value，因此只定义、不消费引用，也不会漏掉可选注册。

```ts
import { declareVariable } from './css-variable'
import { styleRule } from './css-block/style'
import { backgroundColor } from './css-properties/color'
import { bgColor } from './values/color-surface'

const kitRoot = styleRule('.example')
kitRoot.attach(declareVariable(bgColor, 'red'), backgroundColor(bgColor))
```

每次创建 Block 都建立独立累计列表。attach 按顺序接收节点及任意深度的有限数组，返回自身；数组只分组，不产生 CSS 层次。来源数组后续变化不影响已接收列表，列表中的节点仍保留身份。body 保存当前列表，不施加只读类型约束，由调用方遵守修改约定；子 Block 后续 attach 会反映在父节点下一次 parseCss 中。

具体种类决定节点位置：StyleRule 接收 Declaration、StyleRule、Media；Media 接收 Rule；Keyframes 接收 Frame；Frame 与 PropertyRule 接收 Declaration。Rule 排除不能独立提交的 Frame。Block 不维护激活状态、依赖表或 Root 订阅。

选择条件是字符串，例如 stateHover 与 stateActive；其匹配范围仍排除原生 disabled，状态自身不增加优先级。复用条件后，调用 styleRule 分别创建实例，不再通过包装函数避开共享状态。

padding 保留位置简写或方向对象；border 按输入顺序空格连接；font 对象明确字号与行高的斜杠关系。transitionValue 组合单项过渡，transition 连接多项及递归集合。它们在输出时通过 joinValues、parseValue 继续访问子 Value，不提前丢失激活路径。

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

root 和 registration 可以同时存在，按类型注册、根默认定义的顺序进入同一次激活。Root 复用已有 flattenContent 展开规则集合，不新增包装 Block、独立 Token 对象或额外注册器。原 token() 入口已由 variable() 接管。

动画名称用 Value 保存，onActive 可以返回 Keyframes；帧内注册变量继续在同一激活波处理。名称再次出现在 Keyframes header 时，不重复执行回调。

## Button 接入与扩展

[Button.style.ts](../components/kits/Button/Button.style.ts) 使用直接导入，不再使用属性或材料 namespace。kitRoot 是按钮根节点；hoverStyle、solidStyle、各语气、尺寸及状态节点在使用位置创建，紧接着 attach 到父节点，再提供内容。节点直接导出供调用方继续接入，不另建聚合控制表。

基础定义和属性按职责分段，中文注释及空行承担扫读入口。inlineCenter() 返回通用居中组合；Button 专用外观直接留在分支里，不包装成缺少独立意义的“可复用配方”。

Button 实际执行 → registerButtonStyle → cssRoot.activate(kitRoot) → 沿 Value 闭合注册 → 向 style#css-root 追加规则。只 import 不激活，服务器端跳过。Example 的 index.html、Storybook 的 preview-head.html 和浏览器验证宿主提供承载节点。

本次对象与入口调整保留既有 CSS 名称、取值、条件、顺序与优先级，包括 --component-* 和状态变量覆盖链，不改写实心、语气、禁用组合的级联策略。

## 验证与运行边界

单元测试集中在 Key、Declaration、Value 关系，Block 身份、累计和隔离，以及变量定义不修改共享引用。css-root.browser.test.ts 验证递归输出、注册闭包、@property、动画、去重和失败重试。Button 的浏览器用例验证真实挂载、变体、尺寸、主题、焦点、hover、禁用和局部覆盖；DOM 行为仍由 Button.test.tsx 验证。不为每个属性或配方增设测试文件。

CSS 成功插入后不修改、不卸载。运行变化使用 DOM 状态、媒体条件或元素 style 上的变量取值。Block 不冻结，但 Root 不订阅后续 attach：已登记顶层 Block 的累计变化不会自动提交；离线 parseCss 仍读最新内容。增量提交机制尚未实现。

declareVariable 只返回 Declaration，不直接写 DOM；没有新增 setTheme 或元素赋值适配器。Root 不按文本或名称合并，不报告同名冲突；承载节点被移除或替换后的恢复不在当前生命周期内。

Style System 尚无独立包级发布入口，旧 JSS 的公共入口及其他消费者保留。后续扩展按设计文档裁决，不通过隐式订阅、兼容包装或规则重写绕过这些边界。
