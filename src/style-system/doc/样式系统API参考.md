# Style System API 参考

本文按用途记录 Token 接口，完整定义见 [Token 设计](Token设计.md)。Token 迁移已实现并通过本轮验证；涉及 token 的代码使用当前公开入口。规则登记、CSS 读取与提交仍沿用现有入口。

## 对象与用途

| 对象                 | 用来表达什么                                                | 负责行为                                                  |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| Token                | 样式基础内容与可选状态；内容可以引用其他 Token 或计算表达式 | [Token 的创建与复用](behaviors/Token的创建与复用.md)      |
| State                | 可单独复用或直接写进 Token 的状态取值规则                   | [states 与条件选择](behaviors/states与条件选择.md)        |
| Key、Declaration     | CSS 属性目标与内容的配对                                    | [规则登记和撤销](behaviors/rule与rules的登记和撤销.md)    |
| Condition            | 选择作用位置和环境条件                                      | [CSS 作用域与层叠](behaviors/CSS作用域与层叠.md)          |
| StateCondition       | 当前主体的分类或状态条件，可直接复用                        | [主体状态条件](主体状态条件.md)                           |
| 普通函数             | 计算、格式化或组合定义后返回 Token                          | [Token 与表达式](behaviors/Token与表达式.md)              |
| modify               | 在指定位置或条件下修改同一个 Token                          | [定义组合与 modify](behaviors/Token的定义组合与modify.md) |
| Mixin                | 布局、文字、边界等完整效果                                  | [规则登记和撤销](behaviors/rule与rules的登记和撤销.md)    |
| rule、rules、CSSRoot | 登记、更新、撤销、读取与提交                                | [编译与挂载](behaviors/Compile与挂载.md)                  |

Pieces 是可复用材料的统称；Atom 表示组合中一块具体材料。普通值、表达式与有状态的共享材料统一通过 Token 表达。

## 创建 Token

```ts
token(value, name)
token(value)
token({ default: value })
token({ default: value1, hover: (base) => multiply(base, 2), active: 4 })
token(value, {
  name: 'name',
  state: { hover: (base) => multiply(base, 2), active: 4 },
})
```

Argument parser 返回固定的 default、name、state、address、registration、onFirstScan、compileWaveIndex 七个 key。可选项不要求由调用者全部填写。独立 State 可以通过配置中的 state 交给 Token。

state 输入接受字符串键对象或 `Iterable<[string | StateCondition, TokenStateRule]>`，其中所有字符串条件必须是静态预置快捷名，解析后统一为 Map。hover、active 等名称可直接使用；新增共享预置在所属 Pieces 条件文件的映射中维护，临时自定义使用 `stateCondition(input)` 对象。未定义字符串立即报错，原始 CSS 只能通过对象 entry 输入。

StateCondition 直接沿用 Condition 的单个 { header } 对象。stateConditionRegistry 汇总 Pieces 的预置快捷名表；Token 参数入口只查名并按 header 归一同条件规则，编译直接读取最终 Map。映射保留原对象和 CSS，不附加身份包装、:where() 或排序。

```ts
const whenCompact = stateCondition('&[data-density="compact"]')
const spacing = token('8px', {
  address: '.Panel',
  state: [
    [whenCompact, '4px'],
    ['hover', '6px'],
  ],
})
```

hover/active 字符串与对应对象均只判断交互状态，禁用条件独立匹配。不同属性的反馈共同生效，同一属性按原 CSS 特异度和定义顺序层叠。组件 state 优先简写，rules 地址可传 stateConditionRegistry 中的对象，不读取 header。

```ts
const source = token('2px')
const target = token(source)
```

token(source, options) 创建独立 Token，继承直接传入的 source 的 address、state、registration 和生命周期配置；default 默认引用 source，name 不继承，避免同名自引用。需要 CSS variable 身份且未指定新名时，由既有机制自动命名。追加配置覆盖顶层字段，显式 undefined 清除对应配置；default 可覆盖为不同类型。state 按条件合并：同 header 后值覆盖且保留原位置，新条件追加；state: {} 不删除已有状态条目，state: undefined 清空整份状态，来源不变。

```ts
const panelSpace = token(baseSpace, {
  name: 'panel-space',
  address: '.Panel',
})
```

一组定义共享前缀与根据地时，用 createNewTokenGenerator 预设共性：

```ts
const panelToken = createNewTokenGenerator({
  prefixName: 'panel',
  address: panelConditionPath,
})
const panelSurface = panelToken({ default: surfaceColor, hover: paperColor })
const panelSpace = panelToken(baseSpace)
```

生成器只返回一个等效 token 的函数，预设前缀与 address。直接传入具名 Token 时，名称取前缀加来源显式名称并去掉开头的 --，例如 base-space 生成 panel-base-space；其他输入使用前缀加现有名称分配器的新名称。逐项配置覆盖共性配置，其他输入和类型规则与 token 一致。

需要只引用来源而独立定义状态时，用 token({ default: source, ...states })；default 内部和计算表达式中的 Token 不继承配置，只消费来源结果。继承不复制运行身份、自动名称或隐藏的输出方法，详细规则见 [Token 设计](Token设计.md#产生-token-的函数)。

## 定义组合与修改

复用定义、选择用途及产生变化结果都用普通函数返回 Token。函数可读取来源的 default、state 等信息，组合后创建新 Token；不维护加工来源、历史或待重放的操作。

```ts
const doubled = (base) => token(multiply(base, 2))
const amount = doubled(4)
```

modify 则表达对目标 Token 的条件修改，沿用当前条件声明形式：

```ts
rules(
  ['.Item', '&[data-large]'],
  [
    modify(amount, {
      type: 'expression',
      detail: (current) => multiply(current, 2),
    }),
  ],
)
```

被 modify 的 Token 需要 CSS variable 身份；没有 name 时自动命名。加工函数返回的新 Token 不因“被加工过”自动取得这种身份。

## CSS 坍缩与资源

有 name、state、address、registration，或被 modify 的 Token，输出为 CSS variable；需要名称但未命名时自动分配。其余 Token 输出为 CSS value。内部 _kind 由系统决定，外界不能指定。

onFirstScan 可以返回包含 modify 的规则。系统在坍缩前必须完成能影响相关 Token 的修改读取，再确定最终输出；不限定激活波次。compileWaveIndex 只限制内容允许处理的最早时机。

registration 提供 syntax、inherits 及可选 initialValue，分别对应 CSS @property 的语法、继承和注册初始值。initialValue 不从 default 自动推断。

## 登记、读取与提交

rules(path, declarations) 登记属性和效果。输入支持普通对象、单个 `[属性或 Key, 内容]` 及嵌套数组或标准 Iterable，按顺序自动完成声明。对象键使用 CSS 原名；Key 通过二元组保留身份。Token 作为内容消费，由架构根据自身 default、state、address 自动建立定义，不需要手动补一条 Token 声明。

Token 的条件变化在自身 state 中表达；独立配置用新 Token，并在具体属性中明确消费，不自动替换旧引用。手动 declare、[token, value] 和 [token, undefined] 保留为 dangerous 操作，不作运行时或类型拦截；它们不属于推荐的组件编写方式。modify 的表达式加工及 Mixin 结果仍可作为输入，集合空项和普通属性 undefined 不输出。

compileCSS() 读取全局登记并返回 CSS 文本；compileRules(rules) 编译显式材料；cssRoot.mount() 提交到宿主提供的 style#css-root。规则句柄只更新或撤销自己的登记；需要页面更新时重新提交。失败构建不应提交半份结果。

低层 AST 编辑与资源生命周期见 [接口与扩展协议](当前接口与扩展协议.md)。
