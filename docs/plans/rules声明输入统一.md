记录 2026-09-19 已确认并完成的 `rules` 声明输入改造。本文最初只获准记录计划；同日用户随后明确授权代码实施，因此旧的“只写文档、待授权”限制已经退出实施阶段。下列状态与证据记录实际落地结果。

首次交付的源代码类型、单元、浏览器与构建命令通过，但终审发现公共入口的副作用导入会被打包器移除，导致打包后 `marginLeft` 未安装；因此首次交付未通过终审。后续修正以实际属性 Key 建立显式数据依赖，并增加打包后消费回归，本文只把修正后的结果记为完成。

# 已确认的决议

`rules` 接受能够转换为有序声明元组序列的输入。对象、元组数组、Map 和提供声明条目的其他 Iterable 都是该协议的用法，不把支持范围限定为两种容器，也不限定在 Mixin 内部。

目标用法：

```ts
rules(button, {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
})

rules(button, [
  [$display, 'inline-flex'],
  [$alignItems, 'center'],
  [$justifyContent, 'center'],
])
```

两种输入最终进入同一条 `[key, content]` 处理路径。对象中的字符串名称可查询已注册的声明目标；显式 Key 和 Variable 仍能直接作为目标。转换保留输入提供的顺序和重复项，内容保留原有对象身份，不经过 JSON 或字符串序列化。

对象无法表达重复属性或以 Variable 对象为键；需要这些能力时使用元组序列或其他适合的条目容器。以各容器实际提供的枚举顺序为准，不声称能恢复对象或 Map 在构造时已经覆盖的重复项。

业务端只表达目的、无需区分底层实现，是已确认的 Feature。例如 `contentLayout({ mode: 'center' })` 由实现负责兑现居中。不得再次把业务端无法判断 Flex/Grid 差别列为缺陷，也不得要求业务补选技术手段。

# 当前事实与负责位置

| 位置 | 当前事实 | 后续责任 |
| --- | --- | --- |
| [rule.ts](../../src/style-system/rule.ts) | `rules` 已将声明对象及条目 Iterable 统一转换为有序 Declaration；完整验证后才登记，并支持嵌套组合与 undefined | 继续由此负责输入转换与批量登记 |
| [css-key.ts](../../src/style-system/css-key.ts) | CSSKey 包含 string；`key()` 登记原生名称与驼峰名称，`resolveCSSKey()` 统一解析字符串与显式目标 | 继续由此负责名称登记、冲突拒绝和解析 |
| [declaration.ts](../../src/style-system/declaration.ts) | Declaration 是二元组；识别到声明后，内容不再当分组展开 | 保持内容边界，配合新输入类型；不增加第二种内部声明结构 |
| [value.ts](../../src/style-system/value.ts) | 条件分支已接受对象与键值 Iterable，使用 fnkit 集合转换 | 可参考集合访问方法；其先转 Map 的做法会合并重复键，不能直接搬到声明序列 |
| [keys/layout.ts](../../src/style-system/materials/keys/layout.ts) 等属性文件 | 已定义 `$alignItems = key('align-items')` 等 Key | 名称映射尽量依托原有定义，避免维护两套属性清单 |
| [mixins/content.ts](../../src/style-system/materials/mixins/content.ts) | `contentLayout` 只公开 center 目的，内部选择 inline-flex；中心声明使用对象输入 | 继续作为声明输入消费者，不承担输入转换设施 |

# 实施顺序与监察点

以下是取得代码实施授权后的顺序。每项均以自己的证据判定完成；总测试数不能替代单项验收。

| 步骤 | 要做什么 | 完成判据与测试位置 | 状态 |
| --- | --- | --- | --- |
| 1. 明确名称解析 | 确定 `alignItems` 如何找到 `align-items` 对应 Key，以及注册冲突、初始化与未知名称的处理；原生 CSS 字符串入口继续有效 | `key()` 登记原名与驼峰名；公共入口显式调用 `registerPropertyKeys()` 消费全部实际 Key；重复目标允许，异目标同名报错；原生属性和自定义属性直通，未知驼峰名报错 | 已完成 |
| 2. 统一声明输入 | `rules` 接受对象和声明条目 Iterable，复用同一转换路径；更新 Declarations 类型，让 Mixin 返回值自然接入 | [样式登记经依赖解析生成CSS.test.ts](../../src/style-system/test/样式登记经依赖解析生成CSS.test.ts) 已验证对象、数组、Map、Set 条目和一次性 Iterable 生成相同 CSS；类型检查通过 | 已完成 |
| 3. 保留序列与内容 | 正确处理嵌套混合分组、重复 Key、undefined、Variable 目标及数组内容 | 编译器测试已验证 `margin`、`margin-left`、重复 `margin` 的原序输出，Variable 目标、延迟内容身份、undefined 与一次性遍历均保持 | 已完成 |
| 4. 保留整批拒绝 | 完整转换成功后才登记；无效条目、循环分组或迭代器抛错均不留下半批规则 | 编译器测试已验证无效输入、循环、迭代器抛错和字符串输入均不留下登记，已有句柄仍可替换 | 已完成 |
| 5. 用真实调用验证简化 | 在获准的消费者处采用对象声明，展示转换前后的代码；统一 center 作为紧随其后的独立小步 | `contentLayout` 的 center 和 Button loading Rule 使用对象输入；Button 改用 center 后编译 CSS 长度与 Bun.hash 均保持 `19240`、`11016386830676721411`，浏览器回归通过 | 已完成 |
| 6. 同步与交付 | 将已实现协议写入设计说明、架构与样式写法，更新本文状态和证据 | 已同步设计、两级架构与样式写法；类型、31 个单元文件 168 项、11 个浏览器文件 58 项和构建均通过，打包消费探针覆盖 `marginLeft` | 已完成 |

核心验收是输入到 CSS 的关系保持：同等声明得到同等输出，改变声明顺序仍能改变原生级联结果。不得为通过测试而排序、去重、改写原有期望或丢弃未识别项。

# 不可违背的边界

- 最初建文轮次只允许写本文；同日后续用户授权已明确接管同一实现范围。未获授权的相邻工作仍不进入本次修改，已有用户内容保持。
- 统一入口属于 `rules`，不创建仅供 Mixin 使用的对象声明分支，不迫使调用方先手动转换。
- 内部继续使用原有声明与 Rule 协议，转换在登记入口完成，不在编译阶段再识别一套输入容器。
- 字符串名称查找与对象条目提取各有责任，所有容器共享同一 Key 解析规则；不得把“变量已存在”与“名称已注册”混为一谈。
- 声明序列不经过 Map 去重或 JSON 序列化；不递归拆开已经识别出的 content，不提前激活 Value 或 Variable。
- 不因表达方式统一而修改颜色、混色比例、禁用策略或其他组件配方；不顺带重写整个编译器。
- 业务只表达目的。Mixin 的技术实现差别不要求业务感知；测试保护可见效果，不把某种技术名称固化为业务需求。

实施依据：[代码编写](../../../ai-rules/rules/Code-代码编写.md)、[代码修改验收](../../../ai-rules/rules/Code-代码修改验收.md)；本文范围与表达依据：[文档修改范围](../../../ai-rules/rules/Agent-文档修改范围.md)、[设计文档内容](../../../ai-rules/rules/Agent-设计文档内容.md)、[让文本更易读](../../../ai-rules/rules/Document-让文本更易读.md)及项目 [Plan 写法](../how-to-write-plan.md)。执行时核对现役规则，不将本计划的候选实现冒充硬性需求。

# 实施决定

- `key()` 是单个名称安装入口：登记 CSS 原名及其驼峰名称。公共 Style System 入口显式调用 `registerPropertyKeys()`，后者持有全部实际属性 Key 并逐项登记；因此初始化不依赖业务导入顺序，也不会被打包器当作无用副作用导入删除。相同属性重复登记不冲突，名称改指另一属性时立即报错。
- `resolveCSSKey()` 是统一解析入口。显式 Key 和 Variable 原样保留；已登记名称返回对应 Key；合法原生属性和自定义属性保留字符串；未知驼峰名称拒绝整批登记。
- `rules()` 只接受声明对象或标准 Iterable。没有标准 Iterable 的自定义转换对象不属于本次协议，不增加序列化方法或第二套适配接口。

# 优先级与后续工作

`rules` 的统一输入与名称解析已经完成；`contentLayout` 的技术选择也已收回实现，业务统一使用 center。这项 Feature 已落地，不再作为待讨论缺陷。

色阶曲线属于后续生成器工作。Variable Cluster 已提供稳定取色入口，当前人工定义可以继续使用；曲线不是本轮缺陷，也不阻塞声明输入改造。其他组件抽象与颜色配方重复需按具体业务另行讨论，不列为本次顺手清理范围。

# 实施验收

实现只修改声明输入、名称解析、center 消费者、直接相关测试与现役说明；没有进入色阶曲线、颜色配比、禁用策略、其他组件清理或编译器重写。Button 编译 CSS 在实施前后均为长度 `19240`、Bun.hash `11016386830676721411`。

首次交付依赖 `import './properties/register'`，在源码执行时有效，但 `package.json` 的 sideEffects 声明使打包器移除了完整安装链；这次失败证明源测试和普通构建成功不足以覆盖发布消费。修正后公共入口对属性定义形成显式调用与数据依赖，没有扩大 sideEffects。长期回归使用 `Bun.build({ write: false })` 打包真实入口，再从内存模块调用 `rules('.Built', { alignItems: 'center', marginLeft: '2px' })`，输出包含 `align-items` 与 `margin-left`。最终 `bun run type-check`、31 个单元文件 168 项、带 `--browser.screenshotFailures=false` 的 11 个浏览器文件 58 项、`bun run build` 与 `git diff --check` 均通过。
