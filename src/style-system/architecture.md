# Style System 架构

Style System 2.0 由模块顶层的 `rule()` / `rules()` 向 CSSRoot 账本登记源配置。App 在渲染前统一调用 `cssRoot.mount()`，编译 CSS string 并原子提交到宿主。Button 已接入这条链路；其他组件不在本次迁移范围。对象语义见 [design.md](design.md)，组件写法见 [样式文件写法](../../docs/style/样式文件写法.md)。

# 文件职责

| 位置 | 当前职责 |
| --- | --- |
| [core/css-condition.ts](core/css-condition.ts) | Condition 的稳定名称、CSS 块头和 Condition Path。 |
| [core/css-key.ts](core/css-key.ts) | 普通属性、CSS Variable 与 Descriptor 共用的 Key，以及普通属性固定的内容语法。 |
| [core/css-rule.ts](core/css-rule.ts) | Rule/Rules 协议、单项登记与批量输入的完整归一化验证。 |
| [core/css-value.ts](core/css-value.ts) | RawValue、条件 Value、复合 Value 与可选 `onActive`。 |
| [core/css-declaration.ts](core/css-declaration.ts) | `[key, content]` 声明二元数组，以及返回同一结构的可选 `declare()` 助手。 |
| [compiler/compile-css.ts](compiler/compile-css.ts) | 单次编译会话、派生依赖、地址覆盖和 CSS string 输出。 |
| [compiler/compile-value.ts](compiler/compile-value.ts) | Condition Path 收集、对应 Value 读取、循环检测与复合值降级。 |
| [compiler/compile-declaration.ts](compiler/compile-declaration.ts) | 声明语法和方向简写扩写。 |
| [core/css-variable.ts](core/css-variable.ts) | 逻辑 CSS Variable、Condition Key 对应的 Custom Property 名称、局部重定义及按需根定义。 |
| [core/css-root.ts](core/css-root.ts) | 私有源 Rules 账本、同址写入所有权与句柄；快照编译、宿主查找和原子提交。 |
| [values/animation.ts](values/animation.ts)、[values/functions/custom.ts](values/functions/custom.ts) | 动画、Keyframes、CSS 函数调用及其按需定义。 |
| properties | 浏览器原生 CSS 属性的 CSS Key。 |
| values/functions、values | 复合值、CSS 函数和按需定义；创建时不生成 CSS。 |
| values/materials | 能脱离具体组件复用的设计系统材料；不为普通 CSS Key 建立同名镜像 Value。 |
| values/materials/color | 颜色 namespace 的透明分组目录；`action.ts`、`edge.ts`、`palette.ts`、`surface.ts`、`text.ts`、`tone.ts` 分别承载具体目的，目录不建立整体入口。 |
| selectors | 可复用 Condition。 |
| mixins/content.ts、mixins/space.ts、mixins/interaction.ts | 与具体组件无关的完整效果，按内容、空间和交互领域归档；函数返回 Declaration 组合只是实现形式。 |

[index.ts](index.ts) 公开 `rule`、`rules`、可选的 `declare` 助手、Value、Declaration、`cssRoot` 和 `compileCSS`，不公开 Root 类、内部登记函数或源账本。包根另外导出 `cssRoot`、`compileCSS`，供应用启动使用。材料与属性从具体文件具名导入，内部文件不绕行公共入口。

---

# 源配置

`Rule` 是一条 `[RuleAddress, RuleValue]`；`Rules` 是保存多条 Rule 的 Map。RuleAddress 固定为：

```ts
[
  ConditionPath | undefined,
  CSSKey | undefined,
]
```

`.style.ts` 在模块顶层直接登记：

```ts
rules('.example', [
  [$color, foreground],
  [$padding, ['4px', '8px']],
])
```

`rule(path, key, value)` 只登记单项；`rules(path, declarations)` 递归展开并验证声明二元数组与嵌套分组，再按顺序登记。以 CSS Key 开始的 `[key, content]` 是展开终点，content 即使是数组也整体保留；`declare(key, content)` 只返回相同的二元数组。CSSRoot 拥有全部写入：地址按 Condition name 序列与 Key 名称比较，同址后写覆盖前写，但沿用首次插入位置。

单项 Rule Handle 支持 replace/remove；批量 Rules Handle 只提供 remove。句柄仅控制本次登记仍然拥有的条目，后写内容取得所有权后，旧句柄不能干预；删除后也不能复活。无效批量输入不影响任何已有条目或句柄。Handle 的动作只影响下一次编译，不直接操作 DOM。

RuleValue 可以是 Value、声明二元数组或递归 Rules。递归 Rules 用于函数体、帧定义等需要继续携带相对 Path 或 Property 的内部结构，不构成业务侧源容器。

---

# Value 读取

`value(default, conditions)` 保存 default 以及若干 Condition 对应的 Value，不立即展开。`conditions` 只是 `[ConditionPath, ValueInput][]` 存储字段。State 是 Condition 的一种语义用法，媒体或业务条件也可直接绑定 Value；通用与业务由作者的复用范围决定，不构成类型分类。每次编译收集 default 可继承的 Condition Path 及当前 Value 保存的 Condition Path，再逐个读取：

~~~text
请求 Condition Path
  -> 当前 Value 存在同路径 Condition：读取对应 Value
  -> 当前 Value 不存在同路径 Condition：读取 default
  -> 携带原请求 Condition Path 继续读取子 Value
  -> RawValue 或复合表达：生成结果
~~~

选中对应 Value 后只继续读取同路径 Condition，不引入其中其他 Condition。复合表达保留子 Value，不同子值的 Condition 可以形成交集。

循环检测使用当前活动链上的 Value 对象与实际访问键。hover、active 和 default 是不同槽位；完成一次读取后立即退出活动链，因此共享对象和不同条件不会被误判。普通 Rule Path 不参与这项折叠，也不会删除重复 Condition。

---

# 一次编译

`compileCSS()` 每次建立独立会话：

1. 由 CSSRoot 浅拷贝内部源 Rules，传给内部 `compileRules()`，固定本次源配置。
2. 按 Map 顺序递归累计 Path 与 Property。
3. 解读声明二元数组，展开可静态确定的属性结构。
4. 读取各 Condition 对应的 Value，解读复合内容。
5. 激活实际访问到的 Value，把 `onActive` 返回的 Rules 放入本次待处理集合。
6. 继续处理派生 Rules，直到依赖闭合。
7. 以最终地址为键应用后写覆盖，并按保留下来的顺序输出 CSS string。

源 Rules 与派生 Rules 分离。CSS Variable 的根定义和 `@property`、动画的 Keyframes、CSS 函数定义都属于本次派生结果，不写回源配置。下次编译从源 Rules 重新计算可达依赖。

同一 Value 在一个会话内只激活一次。Rules 自引用或 Value 实际槽位循环会使编译抛错，不返回部分结果。

具名 `@property`、Keyframes 和 `@function` 以完整定义为更新单位。同名定义后写时，旧定义的局部内容不会混入新定义。

---

# CSSRoot 启动与提交

应用入口按以下顺序执行：

~~~text
静态导入组件和样式模块
  -> rule() / rules() 写入 CSSRoot 账本
App 入口 cssRoot.mount()
  -> 内部编译
    -> 源 Rules 快照
    -> Value 与声明二元数组解读
    -> 本次派生 Rules
    -> CSS string
  -> style#css-root
render()
~~~

Root 按 `HTMLStyleElement` 保存宿主已有前缀和上次成功的 CSS string。编译成功且字符串变化时才整体更新 `textContent`；字符串未变化时不触碰节点，CSSOM 对象身份保持不变。编译失败时提交步骤不会发生，宿主继续保留上次成功结果。

CSSRoot 是唯一源账本所有者。公共 `compileCSS()` 和 `cssRoot.mount()` 均无参，不接收组件容器。前者供只需要 CSS string 的消费者使用；后者先检查宿主，再使用同一编译流程提交。Root 类与内部登记入口均不从公共入口暴露。

---

# Button 接入

[Button.style.ts](../components/kits/Button/Button.style.ts) 在模块顶层完成全部 Rule 登记。基础、variant、tone、size 与 status 按 Button 业务协议分区；Button 专属定义直接写在对应 Rule 中，不为一次性内容建立私有 Mixin 或具名 Value。

Style System 提供以整个 UIKit 为范围的通用材料和效果。Button 可以直接把 `content()`、`clickable()`、`focusRing()` 和交互材料当作黑盒，因为这些目的不与 Button 绑定；具体材料通过参数或声明交给效果：

```ts
content({ font: 'inherit', emphasis: bold, leading: singleLine })
[$color, interactiveForeground]
[$boxShadow, interactiveElevation]
clickable()
```

Button 的 `solid` 外观、tone 映射和尺寸档位无法脱离 Button 协议，因此直接声明 CSS Key 与材料的关系。局部出现两次相似代码不足以把它们提升为 Style System 抽象；反之，一个目的能与绑定组件解耦时，不必等到第二个组件出现才建立通用黑盒。

逻辑 Variable 仍可在 `[variable, content]` 中充当 Key，以 Condition Key 定义局部配方；它必须表达独立语义输入，不用来为普通 CSS 属性建立同名镜像槽位。

`whenDisabled` 同时匹配 `:disabled` 与 `[data-status~="disabled"]`；`whenHover`、`whenActive` 排除相同禁用协议。这些通用状态是具有稳定 name 的 Condition，Variable 派生名称和局部重定义按 name 匹配，不按 CSS header 文本猜测。

Button.tsx 静态导入 Button.style.ts；组件渲染不编译或挂载。只导入模块会登记配置，不操作 DOM。

[Example 入口](../app/example-dashboard/index.tsx) 的静态依赖会先执行所有 Example 及其组件样式，然后在 render 前挂载；index.html 已提供 style#css-root。Storybook 的 preview 显式提前导入 Button.style.ts 并统一挂载，保证后加载 Story 不承担样式激活。缩略图 runner 也在渲染前建立宿主并挂载。

未来懒加载组件的样式必须由应用清单在启动时提前导入。组件遗漏自身样式导入属于封装错误；宿主与统一 mount 由应用负责。组件不提供运行时补偿。package.json 的 sideEffects 保留源码 `.style.ts` 与产物 `.style.js`，避免静态登记被 tree-shaking 删除。

---

# 验证边界

- 编译器单元测试负责登记顺序、覆盖、按 Condition 取值、复合值、循环和派生依赖。
- Root 浏览器测试负责真实 CSSOM、宿主前缀、无变化提交与失败保留。
- Button 浏览器测试负责组件实际 selector、变量覆盖、交互状态和计算样式。
- 测试产生的源 Rule 必须在用例后通过句柄移除；不能为了隔离恢复业务侧配置容器。
