# Style System 2.0 设计

本文说明 Style System 2.0 已确定的对象模型和编译语义。Subject Condition 的语义与组合边界见 [Subject Condition](subject-condition.md)，样式名称的 namespace、语义层级与 CSS 实现边界见 [naming.md](naming.md)，当前文件职责见 [architecture.md](architecture.md)，组件样式写法见 [样式文件写法](../../docs/style/样式文件写法.md)。

# 设计目标

样式作者只表达“哪个地址拥有什么值”，不为最终 CSS 的花括号手工创建 Block：

- Condition Path 表达地址。
- `rule()` 登记一条源配置，`rules()` 按顺序批量登记，账本由 CSSRoot 持有。
- Declaration 与 Value 保存尚未展开的语义。
- `compileCSS()` 在执行时解读全部源配置，解析条件与内容，并返回 CSS string。
- CSS Variable、Keyframes 和 CSS `@function` 等依赖，只在编译器真正访问相应 Value 时进入本次结果。

Block、StyleRule、MediaRule 和 KeyframeRule 不再是对象模型。它们在最终 CSS 中的结构，都由 Condition Path 和编译规则生长出来。

## 定义层与业务层

Style System 及其共享 values、selectors、properties、mixins 是定义层；整个组件 `.style.ts` 是业务层。载体位置不能把一次性定义变成可复用抽象。

定义层提供业务无关、能脱离具体组件复用的材料、条件、CSS Key 和效果。判断范围是整个 UIKit 的多组件设计系统：像 `clickable()`、`boundary()`、`elevation()` 这样可与绑定组件解耦的目的，即使暂时只有一个消费者也可成为共享黑盒；Button 的 `solid` 配方和尺寸档位仍由 `.style.ts` 中的 Rule 选择材料，再交给通用 Mixin 翻译。是否共享不取决于当前调用次数，也不取决于抽出后的顶层代码是否更短。


# 核心对象

| 对象 | 职责 |
| --- | --- |
| Condition | 描述相对于当前地址的有序 selector、At Rule 或其他 CSS 结构。 |
| Subject Condition | 引用已承诺主体稳定且满足交换律的 Condition；保存固定名称与嵌套顺序。 |
| Condition Path | Condition 组成的有序嵌套地址；普通部分保留原顺序，Subject Condition 部分使用中央顺序。 |
| CSS Key | 原生属性或 Descriptor 的名称；Variable 也可充当声明目标。 |
| RawValue | 已不可继续拆解的原始值，当前是 `string` 或 `number`。 |
| Valuable | 可被 CSS 化的对象的共同协议，包含可选的按需依赖。 |
| Value | 按 Subject Condition 选择内容；条件参与消费表达式展开。 |
| Variable | 独立的变量身份；使用时引用并按需自动定义。 |
| CSS Function | 编译时调用的内容生成函数；只认识自身输入与语法。 |
| Declaration | 已经匹配好的 Key 与可选 content；只保存这对关系，content 为 `undefined` 时整条声明无效。 |
| Rule | 一条 `[Condition Path, Key, Content]` 配置，Key 只保存一次。 |
| Rules | 按声明顺序保存 Rule 的数组。 |
| Rule Handle | 控制一次 `rule()` 登记仍然有效的内容。 |
| Rules Handle | 删除一次 `rules()` 批量登记中仍然有效的条目。 |
| CSSRoot | 拥有源 Rules 账本，负责统一编译与宿主提交。 |
| CSS Compiler | 解读源 Rules 和派生 Rules，最终返回 CSS string。 |

Condition 保存 CSS 结构所需的 `header`。Subject Condition 由 Style System 集中安装，引用已有 Condition 并为它分配名称与嵌套顺序。Rule 地址、Value 与 Variable 可以直接使用已安装名称；编译器按中央定义取得 Condition 和顺序。完整边界见 [Subject Condition](subject-condition.md)。

调用处直接使用名称，不导入条件对象：

```ts
const foreground = value('red', {
  hover: 'blue',
  active: 'green',
})
```

`Rule` 是一条配置，不是容器；`Rules` 才是集合：

```ts
type Rule = [
  (Condition | string)[] | undefined,
  CSSKey | undefined,
  RuleValue,
]
type Rules = Rule[]
```

Rule 的前两项合称地址，不再另存一份 Key；两项都允许为空：

源路径中的 Condition 保存普通嵌套，字符串保留已安装的主体条件名称。进入编译后，两者分别进入普通路径与激活集合；不能提前把名称转成普通 header 而丢失身份。

| 地址 | 语义 |
| --- | --- |
| `[path, key]` | 追加 path，并选择 key。 |
| `[path, undefined]` | 只追加 path，沿用当前 key。 |
| `[undefined, key]` | 保持当前 path，选择 key。 |
| `[undefined, undefined]` | 保持当前地址。 |

RuleValue 可以继续包含 Rules。编译器进入它时沿用上层地址，再按内部 Rule 的路径与 Key 继续寻址。因此 CSS `@function` 的函数体、Keyframes 的帧和其他嵌套内容都使用同一个模型，不需要专用 Block。


# Rule 直接登记源配置

`rule()` 与 `rules()` 在 `.style.ts` 顶层直接调用，把配置按实际调用顺序写入 CSSRoot 内部源账本：

```ts
rule(button, $color, foreground)

rules(button, [
  [$color, foreground],
  [$backgroundColor, actionSurface],
])
```

`rule(condition, key, value)` 只登记一条 Rule。`rules(condition, declarations)` 接受声明二元数组、嵌套分组与表示“本层没有声明”的 `undefined`，先完整归一化和验证，再按输入顺序写入。整批输入无效时不留下部分登记，也不改变已有句柄的所有权。两者均不编译或操作 DOM。

Declaration 的结构就是 `[key, content]`。`declare(key, content)` 只返回同一个二元数组，作者可以按上下文决定是否使用。普通属性 Key、Variable 和 Descriptor 都直接充当受体。复合内容由具体函数生成，或通过目的 Mixin 配置；Key 不解释对象和数组：

```ts
[$borderRadius, pill]
[$gap, normalSpace]
contentLayout({ padding: [normalSpace, wideSpace] })
[$transition, transitionValue(
  [$backgroundColor, fast, standard],
  [$color, fast, standard],
)]
```

`rules()` 递归展开声明组合和 Mixin 返回值，跳过任意层级的独立 `undefined`；遇到以 CSS Key 开始的二元数组就停止，content 即使是数组也整体保留。Declaration 的 content 为 `undefined` 时整条声明同样被跳过。登记时拆出 Key 和 content，编译时不再识别第二份 Declaration。Key 不保存语法，内容函数在编译时生成自身语法。

源账本保留原生声明及顺序，不预先删除同址前值。例如浏览器会忽略无效后值，继续采用有效前值；编译器不能提前把前值丢掉。最终输出见[有序 CSS 记录](#有序-css-记录)。

`rule()` 返回句柄：

```ts
const appearance = rule(button, $color, foreground)

appearance.replace(nextForeground)
appearance.remove()
```

句柄只修改或删除自己的登记，不控制其他同址声明。删除后再 replace 会报错；后写声明不会使先写句柄失效。句柄只修改源配置，不直接编译或操作 DOM。

源 Rules 是 CSSRoot 的内部状态，不从公共入口暴露。测试保存登记返回的句柄并在用例结束后删除，避免直接清空账本或建立业务侧配置容器。

## Mixin 表达效果

Mixin 是返回 Declaration 组合的完整效果。它不绑定具体组件，并拥有“语义配置怎样翻译为 CSS Key”的关系。省略配置产生 content 为 `undefined` 的 Declaration，由 `rules()` 跳过，不重置其他 Rule。

判断参数化 Mixin 时，去掉组件名称并把材料换成参数：剩余关系仍是完整目的，而且目的扩展时所有调用者都应共同获得，边界成立。只转发另一个 Mixin、逐项复刻 CSS Key 或必须查看实现才能理解的函数，都不是黑盒。

Mixin 的文件归属见 [architecture.md／文件职责](architecture.md#文件职责)，组件使用方法见 [样式文件写法／Mixin 赋予效果](../../docs/style/样式文件写法.md#mixin-赋予效果)。


# Value 表达内容

Value 与 Variable 独立，共同继承 Valuable；CSS Function 是保存输入的普通可调用函数，不是 Value 的表达式分支。原始内容仍是字符串或数值，不建立 Expression、状态值或单值体系。

```ts
const foreground = value('red', {
  hover: 'blue',
  active: 'green',
})
```

`value(default, conditions)` 保存 default 以及若干 Subject Condition 名称对应的 Value。对象是常规写法；Map、Set、键值数组与其他键值 Iterable 适合动态组装。创建时不递归解包、字符串化或触发 `onActive`。普通 `value('red')` 也保留 Value 对象；编译给定 Rule 地址时才向下读取，直到得到原始内容或调用 CSS Function 取得内容。

# Subject Condition 决定 Value 分支

State 是 Subject Condition 的一种语义用法，不建立 State 类型。hover、active、disabled 是常见例子；媒体、容器及其他保持主体稳定且满足交换律的判断也可以决定 Value 取值。

Subject Condition 由 Style System 统一定义名称、Condition 与嵌套顺序。登记者承诺该 Condition 只约束当前主体，并且与其他 Subject Condition 可交换；编译器不验证这项君子协定。Rule、Value 与 Variable 直接使用名称字符串，不导入 `whenHover` 等条件对象。完整身份与嵌套边界见 [Subject Condition](subject-condition.md)。

条件是否通用由服务对象决定，与 Condition、Subject Condition 的机制分类无关。共享材料保存自身语义所需的条件取值；组件特有的一次性配方直接由 Rule 表达，不为缩短调用处而建立具名私有 Value。通用效果的实现 Value 由 Mixin 封装，不向业务暴露一组只有实现含义的原始槽位。

下面假定定义层已登记 `compact` 与 `wide`；两者都是示例名称，当前并未内置：

```ts
const spacing = value('12px', {
  compact: '6px',
  wide: '16px',
})
```

这里 `compact` 与 `wide` 都是 Subject Condition 名称。一个共享材料可以把属于自身语义的 Subject Condition 取值保存在定义处：

```ts
export const interactiveSurface = variable('color-surface-interactive', {
  fallback: value(paletteColor('neutral', 1), {
    hover: paletteColor('neutral', 2),
    active: paletteColor('neutral', 3),
  }),
})

rules(button, [[$backgroundColor, interactiveSurface]])
```

这里 `interactiveSurface` 表达可交互的承载面，而不是 `background-color` 的镜像名称。`$backgroundColor` 已经说明 CSS 实现位置，Value 只补充该位置要放入的语义内容。`paletteColor` 是原始色阶的 Variable Cluster 查询，不是 Mixin；只返回预定义 Variable，不增加核心对象类型。查询协议见[样式文件写法／Variable Cluster 查询材料](../../docs/style/样式文件写法.md#variable-cluster-查询材料)。

# Variable 在各条件下改写同一个值

Variable 始终对应同名 Custom Property。它被作为内容消费时只输出一个 `var(--name, fallback)`，条件分支改变该变量的赋值，不展开消费它的 CSS Function。

动态 fallback 在实际消费地址生成 default 与条件赋值；静态 fallback 只留在 `var()` 内。解析结束后只补充没有显式同址声明的缺省赋值，并放在显式规则之前。不同消费地址分别得到自己的条件默认值。

`[variable, input]` 可以用完整 Value 同时修改 default 与条件分支，也可以用条目数组只修改指定地址。未声明的地址保留默认定义；允许增加 fallback 中没有的条件。

```ts
const exampleBackground = variable('color-background-example', {
  fallback: value('white', { hover: 'gray', active: 'silver' }),
})

[exampleBackground, 'red']
// 只定义 --color-background-example。

[exampleBackground, [['hover', 'blue']]]
// 在 hover 下写入 --color-background-example: blue。

[exampleBackground, value('red', { active: 'green' })]
// 默认写入 red，active 时向同一个变量写入 green。
```

Variable 的 Subject Condition 只改变同名 Custom Property，不加入消费表达式的 Subject Condition 集合。两个输入都是 Variable 时，消费它们的属性只输出一次，由浏览器取得各变量当前的值。

Variable 表达独立可赋值的输入，不为普通 CSS 属性预先建立同名槽位。Button 的中性表面占比属于 Button，因此其 Variable 配方留在 Button；共享的仍是编译机制。

# Value 从 Rule 地址向叶子展开

编译先取得 Rule 地址，再逐层进入 Value 与 CSS Function。普通 Value 提供可达的 Subject Condition；在每个目标激活集合下，所有输入按同一有效顺序取值，再由 Function 组合。Variable 始终保留为 `var()` 引用。嵌套 Function 不建立新的条件作用域。

- RawValue 与无条件的 Value 不增加条件贡献。
- 每个激活集合下，Value 从自身已有分支中取最后一个匹配项；未匹配才 default。
- 有效顺序目前来自 Subject Condition 注册顺序，与分支书写顺序无关。
- default 不增加条件；重复条件只保留一项；不同条件共同保留。
- Variable 的条件不加入消费表达式。
- 合并结果按 Subject Condition 的固定顺序生成嵌套地址；取值和地址排列都遵循这套顺序。

例如，A、B、C 表示三个不同的 Subject Condition。Value 1 有 default、A、B，Value 2 有 default、B、C，需要覆盖 default、A、B、C、[A, B]、[A, C]、[B, C]、[A, B, C]。A、B、C 同时激活时，Value 1 取 B、Value 2 取 C；条件身份仍各一份。

假定定义层已登记容器条件 `compactContainer`。一个子 Value 受 hover 影响、另一个受 compactContainer 影响时，编译器生成 default、hover、compactContainer，以及包含二者的规范嵌套地址。具体先后由中央顺序决定；最后一项表示逐层嵌套两个 Condition，不是拼接 selector。CSS 属性值是一个整体；浏览器负责判断嵌套条件是否匹配，但不会替编译器拼接两条声明中的 Value 片段。

## 循环检查覆盖全部候选

循环检测记录当前递归链中的 Value 对象。再次进入同一对象时停止编译并报错；访问完成立即退出活动链，因此不同参数、分支和声明共享同一 Value 不会误报。

解析必须覆盖全部可达候选；候选合并不能跳过循环检查或按需依赖。

## 普通 Condition Path 保持顺序

普通 Rule Path 不重排、不去重，合法的重复 selector 可以显式增加 specificity。普通 Value 贡献的 Subject Condition 按名称合并、去重和排序，再逐层追加为嵌套路径；编译器不组合 selector。Variable 不向消费地址贡献条件。

## 复合值保留子 Value

calc、color-mix、shadow、transition、transform、animation 和列表都保存子 Value，由同一套完整候选解析机制编译。各函数只负责最终 CSS 语法，不判断 Subject Condition 是否能够同时匹配。

`colorMix([color, ratio], otherColor)` 的比例也接受 Value 或 Variable。数字 `0.82` 在编译时成为 `82%`；Variable 比例成为 `calc(var(--ratio, 0.82) * 100%)`，由浏览器使用当前变量值计算。业务构造阶段不做数值换算。

## 通用状态与业务条件

`focus`、`focusWithin`、`focusVisible`、`disabled`、`hover` 与 `active` 都可以是通用 Subject Condition 名称。禁用匹配原生 `:disabled` 或 UIKit 的 `[data-status~="disabled"]`；hover/active 反馈排除这两种禁用协议。

hover、active、disabled 等通用状态由 Style System 映射到 CSS header。State 仍只是语义称呼，不增加 State 类型或构造函数。

通用状态只提供可复用的 Subject Condition 身份，不决定每个组件的视觉结果。`clickable()` 等通用 Mixin 可以拥有自己的 active 与 disabled 反馈；Button 的 variant、tone 和 size 配方则留在 `Button.style.ts`。只在某个 Value 或 Variable 本身就表达可复用材料时，才把它的条件取值提升到定义层。

Rules 只在规则结构和依赖定义中嵌套，不作为 Value 内容。CSS `@function` 的完整函数体由其依赖定义携带；Value 展开不能追加普通路径。


# `onActive` 只产生本次派生 Rules

Value、Variable 和 CSS Function 通过 Valuable 提供可选的 `onActive`：

```ts
interface Valuable {
  onActive?: (context: CompileContext) => Rules | void
}
```

创建 Value、登记 Rule 或只导入样式模块都不触发回调。`compileCSS()` 解析访问该 Value 时触发；返回的 Rules 进入当前编译的派生集合，并继续接受同一套递归解读。候选规范化不能跳过其中的可达依赖。

派生 Rules 不写回源 Rules。因此删除源 Value 后再编译，它曾带来的 `@property`、Keyframes 或 `@function` 会自然退出结果，不需要单独的停用阶段。

同一 Valuable 在一次编译中只激活一次，首次解析位置作为回调上下文。Rules 自引用和 Value 递归引用都会终止并报错，不产生部分 CSS。

## 有序 CSS 记录

内部记录使用普通可变三元组数组：

```ts
type CSSRecord = [conditions: (string | undefined)[], key: string | undefined, css: string]
```

Condition 与 CSS Key 在进入记录前降级为字符串；不存 Value、owner 或节点对象。树只由 conditions 的前缀关系表达。

值的激活集合先规范化、统一取值，再追加最终记录。记录不做全局重排或同址属性覆盖；相邻路径共享嵌套块，隔着其他声明的条件块可以再次出现。跨段合并会改变原生简写与详细属性的级联，不能为了合并而引入属性分析。

变量缺省值是单独的自动定义责任：不替换显式同址赋值。按需依赖是完整定义，以其声明的路径与 Key 接管同址前定义；不扫描 header 判断是否是函数、帧或属性注册。

字符串函数只比较相邻路径，开闭块并写入内容；不解析 Value、选择条件或处理属性覆盖。


# `compileCSS()` 是唯一生成入口

公开生成操作只有：

```ts
const cssString = compileCSS()
```

它不接收业务侧 Rule 容器，也不返回中间树。源账本快照进入两个内部步骤：

1. `resolveRules()` 解析 Rules、Value、Variable、CSS Function 与依赖，把有效候选挂载为有序记录数组。
2. `stringifyCSS()` 线性读取完整数组，返回 CSS string。

这两个边界仅供编译器内部使用和测试，不从 Style System 公共入口导出。

Compiler 比 Formatter、Encoder 或 Decoder 更准确：这里不仅排版，还会解读高层对象、按 Subject Condition 展开 Value、触发依赖、生成浏览器接受的 CSS 内容。


# CSSRoot 账本与应用启动

CSSRoot 拥有有序源 Rules 账本与登记句柄。公开对象只提供无参 `cssRoot.mount()`；无参 `compileCSS()` 使用同一账本快照，只返回 CSS string。挂载先确认宿主存在，再编译，成功后提交到 `style#css-root`：

- 保留宿主原有前缀内容。
- 新结果与上次结果相同时不改写节点，现有 CSSOM 对象保持不变。
- 编译失败时不提交，宿主继续保留上一次成功结果。
- Rule Handle 更新源配置后，需要再次调用 `mount()` 才反映到 DOM；当前不建立自动订阅。

组件通过静态 `import './Button.style'` 保证样式模块执行。App 入口在静态依赖执行完毕后、`render()` 之前统一调用 `cssRoot.mount()`；组件渲染不触发编译。

```ts
import { cssRoot } from '@edsolater/uikit'
import App from './App'

cssRoot.mount()
render(() => <App />, root)
```

宿主由 App 的 HTML 提供 `<style id="css-root"></style>`。漏导入自身样式是组件封装问题；缺少宿主或启动挂载是 App 基础设施问题。服务器可调用 `compileCSS()`，不执行浏览器挂载。

静态 CSS 要求所有样式模块在首次挂载前完成登记；各应用入口与打包配置怎样满足这项约束，见 [architecture.md／Button 接入](architecture.md#button-接入)。


# 验收条件

1. `Rule` 只表示一条配置，`Rules` 才表示集合；公共 API 不暴露源 Rules。
2. `.style.ts` 顶层使用单项 `rule()` 或批量 `rules()`；声明统一为 `[key, content]`，`declare()` 只返回相同二元数组，无效批次不产生部分写入。
3. 原生声明保留顺序，覆盖由 CSS 决定；句柄只控制自己的登记。
4. Subject Condition 集中登记名称、已有 Condition 与固定顺序；主体稳定和交换律由登记者承诺，编译器不负责验证。
5. Value、Variable 独立继承 Valuable，CSS Function 延迟生成内容；不增加 Expression 或 Key 语法体系。
6. 同一激活集合下，各 Value 按有效条件顺序选自身最后匹配分支；缺分支不丢失已有匹配，地址逐层嵌套。
7. 循环检查覆盖全部候选；共享引用不会被误判。
8. 普通 Rule Path 不重排、不去重；Variable 不向消费地址贡献条件。
9. `onActive` 只向本次派生 Rules 添加可达依赖，不污染源 Rules。
10. CSSRoot 持有内部账本；`compileCSS()` 无参生成 CSS string，App 在渲染前无参挂载且原子提交。
11. Style System 定义层提供业务无关的材料、Condition、CSS Key 和 Mixin；组件特有效果直接留在自己的 `.style.ts`。
12. Mixin 以完整效果为语义单位，不按单个 CSS Key 机械拆分，也不与具体业务组件绑定。
13. Variable 表达独立语义输入；不同条件修改同名 Custom Property，不展开消费表达式，不派生条件变量名。
14. 抽象后若仍需查看实现才能理解业务，该抽象必须回到直接 Rule；不用顶层行数代替理解链验收。
