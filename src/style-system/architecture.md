Style System 保存 Key、Value、Declaration 和具体 Block 的结构，由 Root 同步激活并向浏览器追加完整规则。Button 已使用本目录，旧 JSS 的其他消费者未迁移；设计裁决与未决扩展见 [design.md](design.md)。

# 对象与文件职责

core 承担 CSS 对象、具体语法与注册过程；tokens 组合通用材料。fnkit 是存放业务无关能力的分组目录，保留独立的派生与写时复制实现；CSS 核心当前不依赖对象派生。

Core 与 Tokens 分别通过 [core/index.ts](core/index.ts)、[tokens/index.ts](tokens/index.ts) 向 Style System 外部公开能力。Button 等组件从这两个入口导入；Style System 内部直接引用具体文件，包括 Tokens 对 Core 的引用，不经过对外 index。Tokens 以 properties、values、variables 命名空间公开 css-properties、values、css-variables 三个领域的 index.ts，并直接以 selectors 命名空间公开选择条件文件。入口只做导出，不执行样式注册；css-block 内部路径不另设入口。

| 文件 | 现役职责 |
| --- | --- |
| [core/css-key.ts](core/css-key.ts) | 构造只保存 name 的 Key 对象。 |
| [core/css-declaration.ts](core/css-declaration.ts) | 定义确定的 Declaration 结构，并将已有 Key 与 Value 组成声明。 |
| [core/css-value.ts](core/css-value.ts) | 定义 Value、激活上下文、关键字包装及保留子值引用的组合。 |
| [core/css-block.ts](core/css-block.ts) | 定义格式契约、顶层 Rule 范围与递归集合的有序展开。 |
| [core/css-block/style.ts](core/css-block/style.ts) | 先绑定 selector，再组合声明、嵌套 Style Block 和 Media Block。 |
| [core/css-block/media.ts](core/css-block/media.ts) | 用媒体条件组织完整 Rule。 |
| [core/css-block/keyframe.ts](core/css-block/keyframe.ts) | 用动画名称组织 Keyframes，并定义只在其中出现的 Frame。 |
| [core/css-block/property.ts](core/css-block/property.ts) | 用自定义属性名称组织 @property 注册描述符。 |
| [core/css-variable.ts](core/css-variable.ts) | 定义 var 引用与兜底值，提供作用域取值的调用入口与激活时返回的 @property 注册规则。 |
| [core/css-root.ts](core/css-root.ts) | 在固定样式节点可用时计算激活闭包，按身份去重并追加完整顶层规则。 |
| [tokens/css-properties/margin.ts](tokens/css-properties/margin.ts) | 定义 margin 系列的 Key、普通属性函数和四方向组合。 |
| [tokens/css-properties/box-shadow.ts](tokens/css-properties/box-shadow.ts) | 单独定义当前尚无其他成员的 box-shadow 系列。 |
| [tokens/css-properties/padding.ts](tokens/css-properties/padding.ts) | 一至四个位置值的简写，或按对象字段覆盖方向。 |
| [tokens/css-properties/border.ts](tokens/css-properties/border.ts)、[font.ts](tokens/css-properties/font.ts) | 保留复合属性各组成值，输出时排列成 CSS。 |
| [tokens/css-properties](tokens/css-properties) 中的其他系列 | 按布局、尺寸、颜色、轮廓、交互、透明度、过渡和变换分别提供 Key 与属性函数。 |
| [tokens/selectors.ts](tokens/selectors.ts) | 可复用的相对状态条件，包括排除禁用控件的交互条件。 |
| [tokens/token.ts](tokens/token.ts) | 首次消费时返回默认值、根主题和媒体条件组成的规则。 |
| [tokens/css-variables/color.ts](tokens/css-variables/color.ts)、[dimension.ts](tokens/css-variables/dimension.ts)、[typography.ts](tokens/css-variables/typography.ts)、[motion.ts](tokens/css-variables/motion.ts)、[elevation.ts](tokens/css-variables/elevation.ts) | Button 当前消费的语义颜色、尺寸、字号、动效和阴影材料，按系列保留变量覆盖入口。 |
| [tokens/values/color-mix.ts](tokens/values/color-mix.ts) | 保留颜色 Value 与权重，在实际渲染路径中解析混色。 |
| [tokens/values](tokens/values) | 提供有明确单位或比例的基础值、圆角尺度及可组合的颜色材料，不绑定具体组件。 |
| [tokens/css-variables/spacing.ts](tokens/css-variables/spacing.ts)、[appearance.ts](tokens/css-variables/appearance.ts)、[tone.ts](tokens/css-variables/tone.ts) | 声明跨组件共享的尺寸、外观与语气变量；使用方通过调用公共变量定义取值。 |
| [tokens/css-variables/surface.ts](tokens/css-variables/surface.ts) | 组合共享颜色和显式状态变量，消费时注册当前分支。 |
| [fnkit/derivable-object.ts](fnkit/derivable-object.ts) | 提供从当前属性继续派生对象的通用 deriveable。 |
| [fnkit/lazy-copy.ts](fnkit/lazy-copy.ts) | 提供指定深度内首次写入才复制的通用 lazyCopy。 |

单元测试守住 Key、Declaration 和 Value 的公共关系；css-root.browser.test.ts 在真实浏览器中验证完整坍缩、注册闭包、变量、动画和追加行为。具体 Block 与基础 CSS 系列不按文件机械配套测试。

---

# 定义结构

Key 与 Value 独立存在。key 使用 const generic 保留 name 的字面量类型，只返回 Key 对象。declaration 接收已有 Key 和 Value，产生确定的 Declaration。常用 CSS 属性可以定义对应 Key 和普通 JavaScript 函数；函数只是组织与调用手段，不是第六个 CSS 角色。Declaration 不是 Block，也不具有激活状态。Block 构造器复制输入 body 列表并公开 readonly body，列表内继续共享原始节点。

```ts
import { declaration, type Declaration } from './core/css-declaration'
import { key } from './core/css-key'
import { value, type Value } from './core/css-value'
import { variable } from './core/css-variable'
import { styleRule } from './core/css-block/style'
import { cssRoot } from './core/css-root'

const colorKey = key('color')
const color = (value: Value): Declaration<'color'> => declaration(colorKey, value)
const foreground = variable('foreground', {
  registration: { syntax: '<color>', inherits: true, initialValue: value('blue') },
})
const wholeRules = styleRule('.button')(color(foreground))
cssRoot.activate(wholeRules)
```

StyleRule 的 body 容纳 Declaration、嵌套 StyleRule 和 Media；Media 容纳完整 Rule；Keyframes 容纳 Frame；Frame 和 PropertyRule 容纳 Declaration。Rule 是可提交到样式表顶层的 Block 类型集合，排除仅属于动画内部的 Frame，不新增 CSS 角色。

body 位置在定义时确定。对象没有 attach、运行时 children 追加、依赖清单或 Block 激活方法。Content 接受节点及任意深度的有限数组，构造时按顺序展开数组并保留节点引用；不会拆掉具体 Block，也不为分组创建无语法职责的 Block。四方向 margin 等集合直接交给入口，调用方不负责 spread；来源数组后续变化不改变已定义规则。

`styleRule(selector)` 返回普通内容函数，第二次调用通过 rest parameter 接收片段。每次调用产生独立 StyleRule，不累计内容。共享 `hover = styleRule('&:hover')` 可以连接不同组件的外观；相对 selector 按真实 CSS 层次解释，不受数组层数影响。

属性函数接收 Value 或字符串，不枚举合法关键字；toValue 只包装字符串，不复制 Value。padding 的位置形式输出 shorthand，对象形式只输出给出的方向；border 按输入顺序用空格连接各参数；font 的对象字段明确字号与行高的斜杠关系。组成值保留到 parseCss，由 joinValues 处理分隔，每个子 Value 仍经 parseValue 参与激活。

transitionValue 用位置参数组合一项过渡的属性、时长与缓动，产生普通 Value；transition 接收这些值及其递归集合，负责项间逗号。数组仍然只有分组意义，不承担空格或逗号层次。

---

# 激活与浏览器提交

index.html 静态提供 `<style id="css-root"></style>`。`cssRoot` 是正式默认入口，Root 不接收外部 stylesheet 参数，也不监听 DOMContentLoaded；调用者必须在该承载节点及其 sheet 已可用时调用 activate。缺少承载节点时先抛错，不激活任何 Value。

1. Root 接收完整 Rule 及其递归集合，建立本次待处理集合。
2. 每个 Rule 调用自己的 `parseCss(context)`；Block 经过 body，Declaration 通过 `parseValue` 经过实际 Value，组合 Value 同样沿内部内容传递 context。已注册 Rule 继续遍历，让此前插入失败的依赖有机会重试；只有尚未注册 Rule 保留本次文本用于插入。
3. `parseValue` 先通知当前 Root，再渲染 Value。Root 第一次见到该对象时同步调用 onActive，并保存其可选返回 Rule。
4. 返回 Rule 加入同一待处理集合，其内部 Value 继续同样处理。集合按对象身份去重；回到已遇到的入口 Rule 时结束该环。
5. 所有新增 Rule 坍缩完成后，Root 逐条 `insertRule(css, stylesheet.cssRules.length)`，仅在成功插入后登记该 Rule。

Root 不拼 CSS 语法。Declaration 负责声明标点；具体 Block 负责自己的 header 和花括号。离线直接调用 parseCss 或不带上下文的 parseValue 只生成文本，不执行 onActive。

激活结果和注册身份属于 Root 实例，不写回 Value 或 Block。重复输入同一顶层 Rule 不重复插入，共享 Value 在同一 Root 只执行一次回调；另一个 Root 具有独立登记。嵌套 Block 随其所在外层定义提交，不另外提升到顶层。

浏览器插入异常原样抛出，失败 Rule 不登记成功；此前已经成功插入的规则永久保留。再次激活入口时，沿实际内容重新取得已缓存的回调结果，补齐失败依赖；成功规则不重复插入，onActive 不重复执行。这不是整批原子提交。

---

# 按需注册材料

`variable(name, options)` 在 Tokens 的 css-variables 中声明公共变量，保存 var 引用和可选 fallback。`reference(value)` 产生作用域内的取值定义，不改变 reference 或 fallback；普通属性直接接收 reference，最终输出 var(...)。Variable 是携带 Value 字段的可调用对象；调用返回 Declaration，函数自身仍是 Root 去重的身份。公共成员如 variables.paddingY 不带 component 前缀，实际 CSS 属性名 --component-padding-y 保留。取值定义渲染时通知 Root 经过目标变量，再解析输入 Value，所以只定义变量也可以触发其可选注册。提供 registration 时，在定义时组成 PropertyRule；该 Value 的 onActive 返回此规则。注册描述符以 Declaration 表达，initialValue 也是 Value，因此其内部内容继续参与本次闭包。名称参数不含 `--`，syntax 和初值合法性由 CSS 协议及浏览器负责。

动画使用 `value('fade', { onActive: () => fadeRules })` 保存名称，`keyframes(name, frames)` 保存完整定义。名称 Value 首次消费时返回 Keyframes，Frame 中引用的注册变量继续进入同一次激活；名称再次在 Keyframes header 中出现也不会重复执行回调。

现有颜色 tokens 保留默认、hover、active 的显式对象分支及兜底链。注册使用 `syntax: '*'`、`inherits: true`，不设初值，使尚未赋值的变量继续使用 var fallback；类型化变量由调用方提供独立可计算的初值。状态选择由调用方的 selector 决定，token 不自动生成伪类规则。

token 在同一可调用变量实例上附加 onActive，返回低优先级的根规则，提供共享材料的默认值及 data-theme、减少动效偏好分支。状态变量优先消费各自覆盖值，再消费共同覆盖值，最后使用状态配方。例如 hover 背景依次读取 --bg-hover、--bg、混色兜底；只改元素 style 不会增加规则。

---

# Button 接入

values 保存基础尺度、颜色和配比，css-properties 保存属性 Key、属性函数及可复用的属性组合，css-variables 保存公共变量及其默认配方。Button.style.ts 只选择这些材料、通过调用公共变量定义当前规则的取值，并连接业务片段与最终 buttonRules，不重新声明 Button 专属变量或数值。基础布局、外观、交互、variant、tone 和 size 在 `.Button` 处连接，状态由嵌套 selector 表达；没有旧 JSS 适配或业务注册表。原 --button-* 覆盖入口改为 --component-*，语气分支共享 --component-tone-*；不保留旧名称的转发层。

Button 实际执行 → registerButtonStyle → cssRoot.activate(buttonRules) → 沿真实 Value 引用闭合注册 → 向 style#css-root 追加完整规则。服务器端跳过注册；只 import 不激活。Example 的 index.html、Storybook 的 preview-head.html 和浏览器验证宿主在组件执行前提供样式节点。宿主移除节点后恢复已有注册不在当前契约内。

button.browser.test.tsx 验证真实渲染、变体、尺寸、主题、焦点、hover、禁用、局部变量覆盖和重复注册；Button.test.tsx 保留 DOM 与组件行为，CSSOM 验证不由 jsdom 代替。Example 直接体验浏览器交互，不再用旧变量伪造 hover、active。

---

# 永久注册与范围

CSS 一旦成功插入就不修改、不卸载。运行变化使用 DOM class、data attribute、伪类、媒体条件或元素 style 上的 CSS Variable。新规则继续追加，既有 CSSRule 对象保持不变。

Root 按对象身份登记，不按名称或文本合并，不报告同名定义冲突。固定 style 节点的替换及已注册定义恢复不属于当前生命周期。Button 从组件执行链使用 Style System，基础能力尚无独立包导出；旧 JSS 的公共入口及其他消费者保留，其他组件未迁移。

deriveable 与 lazyCopy 保留其独立实现和测试。它们仍可作为通用手段使用；Key 是普通对象，属性函数是普通 JavaScript 组织手段，二者都不被通用派生覆盖。
