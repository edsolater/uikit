# Variable Cluster 整组赋值与 focus 状态归属修正 Plan

实施状态：2026-09-21 工程验收通过。独立工程审查者兼任测试审查，源码、测试与现役文档复核完成；冻结验证通过。工程通过不等于用户已认可本轮自主选择，最终判断交回用户。此前阶段记录不替代本次验收。

## 要改成什么

第二步修正第一层 Style System 留下的两个使用端问题：

1. Variable Cluster 向 Variable Cluster 声明时，按同名成员完成整组局部赋值，Button 不再逐项填写 tone 成员。
2. focus 与 hover、active 一样归入 State Condition。焦点效果由定义端状态能力和通用 Mixin 承担，Button 不再单独选择焦点颜色。

完成后，Button 只需要选择一整组动作配色：

```ts
rules([...button, '&[data-variant="solid"]'], [
  [toneColor, actionColor],
])

rules([...button, '&[data-tone="accent"]'], [
  [toneColor, accentColor],
])

rules([...button, '&[data-tone="danger"]'], [
  [toneColor, dangerColor],
])
```

来源与目标已有的同名成员在当前 CSS 选择器作用域内生成声明，不要求两组成员完全一致。背景、文字和焦点轮廓分别消费自己负责的成员，Button 不再为 focus 增加一条单独接线。

## 修正前的问题

本节记录修改动机，不代表工作区目前仍保留全部旧写法；完成情况须以实施后的代码与验收为准。

### Button 仍在逐项填写 Cluster

第一层实现已经能直接消费 Cluster 的 default，也能通过 `cluster('soft')` 选择成员；但 Cluster 作为声明目标时仍然只代表 default。因此 Button 的 accent、danger 分支必须重复写：

```ts
[toneColor, accentColor]
[toneColor('soft'), accentColor('soft')]
[toneColor('strong'), accentColor('strong')]
[toneColor('foreground'), accentColor('foreground')]
```

这里表达的不是四个独立业务决定，而是同一组语气材料的结构对应。让 Button 展开这些成员，会把 Cluster 内部结构泄露给使用端，也会让新增成员时容易漏接。

### focus 的显示属于状态，颜色却仍由 Button 协调

修正前的焦点轮廓通过 `focusVisible` 状态控制显示，`clickable` 也负责输出 outline 和 offset；但颜色仍经过独立 `focusColor`，由 Button 分支手工声明：

```ts
[focusColor, actionColor('line')]
[focusColor, accentColor('focus')]
[focusColor, dangerColor('line')]
```

这导致 focus 的最后一段责任仍留在组件。每增加一组配色，Button 都要记得再接一遍焦点颜色。

focus 归入 State Condition，并不表示把轮廓颜色塞进背景 Variable。若背景颜色在 focus 下改成 line，键盘聚焦时背景也会变成轮廓色，破坏现有视觉。正确边界是：

- Variable 的 focus 状态决定何时显示轮廓，实际 CSS 条件为 :focus-visible；
- 配色 Cluster 的 line 成员提供轮廓颜色；
- 背景和前景继续使用各自成员；
- hover、active 在中央 State Condition 顺序中高于 focus；
- `:focus` 与 `:focus-visible` 保持不同的浏览器触发语义。

## 一、Cluster 向 Cluster 整组赋值

### 对外行为

Cluster 保留三种不同用法：

```ts
toneColor                 // 普通值消费，代表 default
toneColor('soft')         // 选择 soft 成员
[toneColor, accentColor]  // 目标和内容都是 Cluster，整组声明
```

只有第三种情况触发整组赋值。普通 Variable 目标接收 Cluster 内容时仍然只消费来源 default，不把整组行为扩散到其他声明形式。

### 成员对应规则

采用用户最新裁决的第一层固定匹配：只为来源与目标已有的同名成员生成 CSS Variable 声明。例如目标 tone 有五项，来源 action 只有三项：

```text
toneColor：default、soft、strong、foreground、line
actionColor：default、foreground、line

toneColor.default     ← actionColor.default
toneColor.foreground  ← actionColor.foreground
toneColor.line        ← actionColor.line
```

tone 的 soft、strong 本次没有新声明，原有 CSS 定义与层叠继续生效；不清空、不补值、不因缺项报错。来源额外成员没有对应目标时不参与声明，也不因本次展开被激活。成员统一可以方便使用，但不是 Cluster 的必备约束。不在编译器中猜测不同名称的对应关系。

这里的“赋值”是生成当前选择器下的 CSS 声明，不是复制或替换共享 JavaScript 对象。此前“来源必须覆盖目标所有成员”的限制由本次裁决撤销。

### 作用域与对象身份

整组赋值只在当前 Rule 的路径和主体条件中生成普通 Variable 声明。它不修改目标 Cluster、来源 Cluster 或任何成员 Variable 的 JavaScript 对象。

展开只进行一层。成员本身即使也是 Cluster，也作为该成员的 default Variable 消费，不继续递归，不引入深度合并。

同一目标成员被多个键别名引用时，只有目标对象和来源对象分别相同，才可合并为一条声明。以下情况必须报错：

- 同一目标对象被两个成员键对应到不同来源；
- 不同目标对象使用相同 CSS Variable 名字；
- 目标和来源是不同对象，却使用相同 CSS Variable 名字，可能生成 CSS 自引用。

目标成员与来源成员是同一对象时，这一项是无操作，不输出 `--x: var(--x)`。

## 二、focus 回到状态和定义端

### 状态关系

注册状态名使用小写的 focus、hover、active。focus 对应的浏览器条件是 `:focus-visible`；状态名称由系统定义，不必与 CSS 伪类同名。优先级为：

```text
focus（CSS 条件为 :focus-visible）
    ↓
hover
    ↓
active
```

这个顺序解决同一个 Variable 同时定义多个状态时的取值冲突。焦点轮廓与背景是不同 CSS 属性，因此 hover、active 改变背景时，轮廓仍应保留；不能把“优先级较低”实现成轮廓消失。

用户在 Variable 上直接通过 states 声明 focus，与 hover、active 使用同一方式，不需要先调用独立的 State Condition 注册函数：

```ts
variable(normalValue, {
  name: 'example-value',
  states: {
    focus: focusedValue,
    hover: hoveredValue,
    active: activeValue,
  },
})
```

focus 到 :focus-visible 的对应由系统内部承担。现有代码中的 stateCondition 函数不能作为用户需求的依据，也不能成为使用 Variable 状态前必须完成的额外步骤。内部怎样保存条件与顺序属于实现审查内容，本 Plan 不要求新增或保留该公共函数。其他状态的存在与排序不因本次修正而擅自改变。

真实触发继续使用浏览器的 `:focus-visible`。鼠标产生的普通 `:focus` 不能被测试或实现当成 `:focus-visible`。

### 配色成员

toneColor 形成完整的语气结构：

```text
default / soft / strong / foreground / line
```

line 表达可供边界或轮廓使用的颜色材料，不是另一个 focus 状态，也不要求 Button 映射一套 focus 成员。

- accent 原 focus 成员改为 line，实际色值仍来自 `--color-accent-focus`，保留原视觉。
- danger 保留已有 line。
- action 保留已有 default、foreground、line，不为匹配五项目标而补造 soft、strong。
- toneColor 增加 line，使 accent、danger、action 都能通过一条整组声明提供轮廓颜色。

撤销本轮仅为完整匹配而添加 action soft 的 14% 混色、strong 基色别名及新增 Theme token 的方案依据。各个已定义的配色点仍应分别可配置；本次不据此推导必须增加成员或某一种底层配置机制。

### 通用焦点材料

`focusOutline` 保留自己的状态责任：

```ts
variable('none', {
  states: {
    focus: valueSequence(focusStrokeWidth, 'solid', toneColor('line')),
  },
})
```

`focusOffset` 同样使用注册状态 focus，在实际 `:focus-visible` 条件下提供偏移。`clickable` 继续消费 focusOutline 与 focusOffset，并把它们转换为 outline、outline-offset 声明。

独立 `focusColor` 删除。Button 不再声明 focusColor，也不通过重复调用 clickable 或传入专门的焦点配色参数绕回同一职责。

## 三、Button 只选择整组配色

Button 继续拥有 variant、tone、size、status 的选择器及组件专属配方，但不拥有通用焦点规则。

- 默认与 bare 沿用 toneColor 的默认 accent 配色。
- solid 通过 `[toneColor, actionColor]` 声明 action 提供的同名配色成员。
- accent 通过 `[toneColor, accentColor]` 覆盖完整语气组。
- danger 通过 `[toneColor, dangerColor]` 覆盖完整语气组。
- solid 与 tone 同时存在时，后面的 accent／danger 整组声明覆盖 action 的同名成员；Button 不再单独覆盖 line。

无 tone solid 的背景和前景继续使用原 action 配方。tone 未被 action 声明的成员保留原有 CSS 取值；验收应检查实际消费者，不以人为补齐 Cluster 结构代替视觉验证。

## 代码落点

| 位置 | 职责与改动 |
| --- | --- |
| `src/style-system/variable-cluster.ts` | 保存内部成员关系，校验并形成一层同名成员声明；不公开成员反射 API |
| `src/style-system/compiler/compile-css.ts` | 在当前 Rule 作用域展开 Cluster 声明，随后复用普通 Variable 编译链 |
| `src/style-system/value-material/color/tone.ts` | tone 增加 line，accent 轮廓材料统一为 line；不强制各 Cluster 成员集合相同 |
| `src/style-system/value-material/color/action.ts` | 保留动作基色状态与 foreground／line，移除仅为旧完整匹配限制增加的成员 |
| `src/style-system/materials/state-conditions.ts` | 核对内部条件解析，使 Variable 上直接声明的 focus 对应 :focus-visible；不要求使用者调用额外注册函数 |
| `src/style-system/value-material/focus.ts` | 由 focus 状态控制轮廓，并从 tone line 取得颜色 |
| `src/style-system/component-handle-material/focus.ts` | 独立 focusColor 责任退出并删除 |
| `src/style-system/mixins/interaction.ts` | 继续承担 outline 与 offset 到 CSS 属性的映射，不增加组件配色参数 |
| `src/components/kits/Button/Button.style.ts` | 用整组声明选择 action／accent／danger，删除逐成员 tone 与 focusColor 协调 |
| 对应测试和 Style System 文档 | 锁定整组赋值、状态优先级、真实 :focus-visible 和 Button 现有视觉 |

## 实施顺序

### 1. 建立 Cluster 内部成员关系

在 variableCluster 创建时保存 Cluster 与原成员配置的内部关系。这个信息只供编译器判断双 Cluster 声明，不从公共 index 导出。

先确定双方已有同名成员，再检查这些实际配对的声明是否冲突；未匹配成员不参与冲突校验。不因缺项报错，避免编译到一半才失败并留下部分结果。

### 2. 在编译器展开一层声明

当 Rule 的目标和内容都能识别为 Cluster 时，生成同一路径、同一主体条件下的成员 Variable 声明，再走已有 Variable 声明、状态、依赖和显式覆盖逻辑。

普通消费、成员调用、Rule 源账本和共享对象保持原样。

### 3. 修正实际需要的颜色材料

为 tone 增加 line，把 accent 的 focus 材料归入 line；撤回本轮为完整匹配而补造的 action soft、strong。保持既有 CSS token 和当前 Button 可见配方，不新增配方调配器。

### 4. 接回通用焦点链

让 focusOutline 在 focus 状态下读取 tone line，最终匹配 :focus-visible，删除独立 focusColor。检查 clickable 仍只负责通用交互效果，不接收 Button 分支专用的焦点配置。

### 5. 简化 Button

solid、accent、danger 各自只保留一条 toneColor 整组声明。完整阅读 Button.style.ts，确认没有残留的 focusColor、逐成员 tone 映射或通过其他入口重新协调焦点。

### 6. 同步文档并完成验收

更新 Style System 设计、架构、状态说明和样式文件写法，使普通 Cluster 消费、整组声明与 focus 状态职责保持一致。最后执行独立源码复审和完整运行验证。

## 怎样验收

### Variable 状态线性声明与同址 CSS 组织

Variable 各自声明自己的状态；稳定 Value 表达式保留 Variable 引用，不传播状态组合。禁止编译器为独立状态自动枚举交集，也不能先指数展开再删掉重复结果。显式书写的嵌套条件不因此被删除。

- 两个 Variable 各有 hover、active，第一阶段恰好生成六个 Variable 声明节点：两项常态、两项 hover、两项 active；不存在自动 hover+active 节点。
- 两个独立 Variable 各有 2、5、10 个状态，分别生成 6、12、22 个 Variable 声明节点。用状态内容求值次数约束工作量同样线性增长，不用易波动的运行毫秒数替代结构性检查。
- 第二阶段给定六个交错排列、没有交集的声明节点，应得到一个主体块和两个状态块；同址的两个 Variable 声明出现在同一个 hover／active 块中。单独测试该阶段，不能让状态展开失败掩盖分组失败。
- 从 Variable 使用到最终 compileCSS 字符串再做完整回归：每个状态块只出现一次，消费属性保持 Variable 引用，不引入组合声明。
- 多个 Variable 放入 colorMix 等稳定表达式后，各自声明数量仍然线性；延伸 Variable 的有效状态也不能按子集展开。
- 保证 focus、hover、active 的优先级和显式声明顺序，不以枚举全部交集补偿选择器权重问题；分组不得改变有顺序意义的 CSS 覆盖关系。

现有实现已实测存在指数枚举和同址状态块重复，属于待修缺陷。旧测试中把两个状态的四项声明或三个状态的八项声明当作正确结果的断言，不能继续作为验收依据。UI 外观正确不足以通过上述测试。

测试依据分为三类，不能将它们混同：

1. 用户目的：业务端无感、可理解，保留视觉效果，避免冗余输出与不必要的处理成本。
2. 用户明确要求的实现：Variable 状态不自动扩散；先形成选择器地址、键、值的声明节点，再让同层同地址声明共同输出。六节点示例属于用户明确表达，不能降格成 Agent 可随意替换的偏好。
3. Agent 臆测的实现与测试方法：例如路径数组长度、在哪个内部函数分组、精确求值次数上限、正则解析夹具、延伸链平铺到最终名字。允许用于本任务，但相关断言必须注释假设与边界，接受质疑。跨任务不得因旧测试存在就沿用为需求；应重新论证、调整或替换。

最终 CSS 检查不固定缩进、换行和互不影响的声明先后顺序。求值次数上限只是本轮诊断代理，既可能排斥常数不同的线性算法，也可能因缓存遗漏内部枚举，不能单独证明复杂度。替换第三类测试方法后，仍须覆盖前两类约束。

现有工程审查者兼任测试审查，检查断言的依据分类、反例与误判风险；不能仅以测试通过认可实现，也不能仅以旧测试失败否定满足目的与明确实现要求的新方案。

### Cluster 整组赋值

- 双 Cluster 声明输出双方已有同名成员的局部 Variable 声明；五项目标接收三项来源时只输出对应三项。
- 普通消费 Cluster 仍代表 default，调用 Cluster 仍返回指定成员。
- 普通 Variable 目标接收 Cluster 时仍只使用来源 default。
- 来源额外成员不声明、不激活；目标未匹配成员不产生声明、不清空、不补值，保留原有 CSS 取值。
- 整组赋值只展开一层，不递归合并成员 Cluster。
- 目标别名、不同对象同名和 CSS 自引用得到明确处理，不由输出顺序决定结果。
- 嵌套作用域内的整组声明只影响对应主体，不污染相邻主体或共享 JavaScript 对象。
- Rule 句柄从五项来源替换为三项来源时应成功更新；旧句柄的未匹配声明应退出，使相应成员按仍有效的 CSS 定义和层叠取值，不能残留旧输出。

### focus 状态与视觉

- 独立 focusColor 文件、导入和 Button 声明全部退出。
- Button 不再逐项协调 tone 成员或焦点颜色。
- focusOutline 只在真实 `:focus-visible` 下出现；普通鼠标 `:focus` 不被当成 :focus-visible。
- 材料通过 states.focus 使用焦点状态，输出选择器为 :focus-visible；同一 Variable 同时命中 focus、hover、active 时，优先级依次升高。
- hover、active 改变主体外观时，焦点轮廓仍然存在，不能因属性不同而被错误移除。
- 默认、bare、solid 与 accent、danger 的九种组合在浅色、深色主题下保持原有常态、hover、active、disabled 与焦点视觉。
- solid 无 tone 使用 action line；accent 使用原 accent focus 色值；danger 使用 danger line。
- focus 不改变背景和前景为 line 颜色。

### 完整验证

实现冻结后依次执行：

1. 类型检查；
2. 完整单元测试；
3. 完整浏览器测试；
4. 生产构建。

执行验证前后记录同一组源码和配置文件哈希，证明测试期间没有继续写入。独立工程审查者复核源码、测试设计和文档；执行核验者只报告实际命令、数量、退出码和日志。主 Agent 亲审 Cluster 编译调用链、焦点调用链以及完整 `Button.style.ts`。

## 不在本次增加的内容

第二层规则 Variable 仅记录为未来方向：依托的 Variable 改变时，计算规则保持不变，结果随依托变化；例如 soft、strong 按当前 default 计算。具体表达、API 和工程设计尚未裁决，本次不实现，也不以缺少该能力判定第一层失败。固定同名声明与未来规则能力是两件事。

- 不增加深度合并或递归 Cluster 配方。
- 不增加通用配方调配器。
- 不增加 Button 专用的焦点 Mixin 参数。
- 不把 `:focus` 与 `:focus-visible` 合并。
- 不让 Value 恢复状态能力。
- 不修改共享 Cluster 或 Variable 对象完成局部赋值。
- 不顺带清理与 Cluster、focus 无关的材料、组件或文档。

## 实施结束时必须交回的判断

最终说明不能只报告测试通过。需要逐项写清：

- 固定同名匹配实际生成哪些 CSS 声明，未匹配成员怎样保留原有取值；
- 为什么只展开一层；
- 为什么 line 是轮廓颜色材料，不是 Button 需要协调的另一套 focus 状态；
- 为什么不能把 line 写进背景 Variable 的 focus 状态；
- 仅为旧完整匹配限制而补造的 action 配色是否已退出；
- 哪些候选方案被放弃，以及它们会怎样把 focus 协调责任重新留在 Button；
- 每项结论属于用户明确裁决、已验证事实，还是本轮自主实现判断，供用户最终再次裁决。


## 本次实施记录

职责仍按既有边界分工：Cluster 内部提供同名配对，编译器展开一层局部声明；Variable 编译负责自身状态，记录组织负责安全合并；焦点材料负责状态与 line 消费，clickable 输出轮廓，Button 选择整组配色。

本次落地包括双方已有键的局部赋值、撤回 action 的伪造 soft／strong、内置 focus 匹配 `:focus-visible`、移除自动状态幂集，以及每份源规则／依赖输出内的安全同址分组。五成员 tone 接受三成员 action 时，只生成 default、foreground、line 三项声明，soft／strong 不增加声明。已有 Button 配方与主题 token 保留。

以下是自主实现判断，供最终复核；工程测试通过不代表用户已认可这些具体选择：

- 状态优先级：原 `&[data-a]` 会压过后写的 `&:where([data-b])`。采用 `&:where(原主体附加条件)` 统一归零附加权重，保留中央顺序，放弃枚举交集；代价是已零权重条件可能多一层 where 包装。普通 Condition 不改变。
- 自动定义作用域：当 outer 的 hover／active 内容读取 inner 时，采用显式 Rule 及局部声明分支的结构地址和状态条件生成 inner 定义，求值临时条件不成为新定义作用域。缓存按 Variable 对象和显式作用域区分，避免同名不同对象的状态被吞掉。原有同址常态首次定义与显式声明优先语义保留。
- 输出分组：每份输出内逐项检查被跨越的记录；仅互不覆盖时移动到已有同址块。同名 CSS 变量、任意两项原生属性、原始内容或定义类 At Rule 都阻断移动；不解析全部 CSS 简写关系。此保守策略可能留下可合并块，但保留有意义的覆盖顺序；扫描最坏为二次复杂度，状态节点生成本身线性，不先枚举后去重。
- 测试判断：保留节点数量、无自动交集、实际焦点触发与 Button 视觉矩阵；旧缺键报错、幂集数量和选择器包装断言按新目的调整。求值次数上限与正则读取简单夹具仍只是诊断方法，不是新公共 API 契约。

定向结果：编译相关 4 文件 64 项单元通过；CSSRoot、Variable 链与 Button 3 文件 35 项浏览器通过。最终全套结果由执行核验者记录。失败截图清理沿用已有安全限制，不绕过此前被拒绝的删除操作。


### 最终验收证据

独立执行核验顺序运行类型检查、完整单元、完整浏览器和生产构建。首次冻结仅 bundle-consumption 的旧选择器文本断言失败；修正后类型检查与 32 文件 158 项单元全部通过，退出码均为 0。相同生产源码／配置的浏览器 13 文件 69 项及构建已通过，退出码均为 0，不为纯断言和文档修正重复运行。

核验者选取 305 份源码、文档与配置文件，两个冻结批次各自前后 SHA256 均一致；批次间精确变更为该单元断言与旧 Plan。最终快照之后仅补旧 Plan 的 line 列表项、单测的测试假设注释和本 Plan 验收记录，未再改生产源码、配置或测试逻辑。独立工程审查复核源码、测试依据及现役文档，未发现尚未处理的确认缺陷。

保留的边界：记录整理最坏二次扫描，不据状态线性断言声称整个编译器线性；已有 focusVisible 名称仍匹配相同条件，新定义采用 focus，不把两个名称当作两个业务状态。截图盘点为 8 张且本次冻结验证前后内容不变；不推断此前数量变化的原因，也不绕过先前被拒绝的截图删除。验证日志属本次临时产物；执行核验者核实目录边界后尝试清理，但自动审批以 blocked by policy 拒绝删除，未绕过，目录仍保留在 C:/Users/edsol/AppData/Local/Temp/uikit-validation-20260921-062236。正式测试与 Plan 保留。
