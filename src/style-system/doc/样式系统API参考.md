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
token(value, {
  name: 'name',
  state: { hover: (base) => multiply(base, 2), active: 4 },
})
```

第一个参数是基础内容，第二个参数是配置；普通对象和数组原样作为数据，即使含有 default、hover 等字段也不解析为配置。Argument parser 返回固定的 default、name、state、address、registration、onFirstScan、compileWaveIndex 七个 key。可选项不要求全部填写。

state 输入接受快捷名对象、Map、单个条件 entry，以及这些形式的任意嵌套数组或 Iterable，按顺序展开且保留 entry 配对。所有字符串条件必须是静态预置快捷名，解析后统一为 Map。hover、active 等名称可直接使用；新增共享预置在所属 Pieces 条件文件的映射中维护，临时自定义使用 stateCondition(input) 对象。未定义字符串立即报错，原始 CSS 只能通过对象 entry 输入。

```ts
const buttonColorSource = buttonToken(brandColor, {
  state: [interactiveColorStates({ chromaResponse: 1 }), { danger: badColor }],
})
```

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

token(source, options) 创建独立 Token，继承直接传入的 source 的 address、state、registration 和生命周期配置；default 默认引用 source，完整名包含来源完整名这一引用部分，以及当前 Token 自身的实体标识。options.name 只指定实体，省略时自动生成，不复用来源完整身份。追加配置覆盖顶层字段，显式 undefined 清除对应配置；default 可覆盖为不同类型。state 按条件合并：同 header 后值覆盖且保留原位置，新条件追加；state: {} 不删除已有状态条目，state: undefined 清空整份状态，来源不变。

```ts
const panelSpace = token(baseSpace, {
  name: 'panel-space',
  address: '.Panel',
})
```

一组定义共享名称前缀与固定位置时，用 createNewTokenGenerator 预设共性：

```ts
const panelToken = createNewTokenGenerator({
  prefixName: 'panel',
  address: panelConditionPath,
})
const panelSurface = panelToken(surfaceColor, { state: { hover: paperColor } })
const panelSpace = panelToken(baseSpace)
```

完整 name 按“可选前缀-可选来源引用-自身实体标识”组合。普通 `token(value, { name: 'brand-color' })` 的完整名为 `brand-color`；`token(source, { name: 'local' })` 得到 `brand-color-local`，省略实体时得到 `brand-color-<自动标识>`。内部名称不含 CSS 双连字符，CSS 输出为 `--${name}`。

生成器只提供统一前缀与定义地址，调用处不能传名称字符串或指定 `name`、`address`。`buttonToken(source)` 得到 `button-brand-color-<自动标识>`，直接 `buttonToken('red')` 得到 `button-<自动标识>`。前缀不改变实体；匿名 Token 来源也以稳定内部名参与引用，取得名称不改变来源的纯值身份。地址未配置时随消费位置发布，不继承来源地址。对应行为见 [Token 的创建与复用](behaviors/Token的创建与复用.md#完整名由前缀引用和实体组成)。

业务含义由供人阅读的 JS 变量名表达；CSS 自定义属性名只是系统派生或自动生成的映射标识，具体拼写没有业务意义，主要用于测试定位和调试追溯。通过 Token 对象取得对应名称，无须手工维护两套语义名称。

已有 Token 直接传入，state 软合并业务差异；生产函数用于延迟计算或消费时读取数据等明确目的，不作为规避继承的写法。继承不复制运行身份、自动名称或隐藏的输出方法，详细规则见 [Token 设计](Token设计.md#产生-token-的函数)。

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

## 混色与颜色调整

`colorMix` 接受直接颜色、`[color, weight]` 元组和具名的 `{ color, weight? }`。
`weight` 使用零至一比例，省略时采用 CSS 默认比例。

```ts
colorMix(
  {
    color: { base: buttonColorSource, alpha: 0.14 },
    weight: 0.18,
  },
  surfaceColor,
)
```

`color` 可以直接引用颜色，也可以用 `{ base, lightness?, chroma?, hue?, alpha? }`
描述来源及 OKLCH 通道变化。数值或 Token 直接设置通道；回调接收当前通道表达式，
例如 `alpha: (current) => multiply(current, 0.14)` 表示将来源透明度乘以 0.14。
省略的通道保留来源值，调整完成后再按权重参与混色；混色空间仍为 Oklab。
来源、通道和权重中的 Token 引用保留到 CSS，继续响应状态与局部覆盖。

## CSS 坍缩与资源

有 name、state、address、registration，或被 modify 的 Token，输出为 CSS variable；需要名称但未命名时自动分配。其余 Token 输出为 CSS value。内部 _kind 由系统决定，外界不能指定。

显式 address 固定 default 与 state 的发布位置；继承与覆盖后仍未指定时，需要 CSS variable 的 Token 在各 AST 消费地址分别定义，不锁定首次位置或写回 address。普通 token('2px') 仍直接输出。全局材料明确指定 address: ':root'；多处定义不会重复调用同一对象的 onFirstScan 或 onCompile。

onFirstScan 可以返回包含 modify 的规则。系统在坍缩前必须完成能影响相关 Token 的修改读取，再确定最终输出；不限定激活波次。compileWaveIndex 只限制内容允许处理的最早时机。

registration 提供 syntax、inherits 及可选 initialValue，分别对应 CSS @property 的语法、继承和注册初始值。initialValue 不从 default 自动推断。

## 登记、读取与提交

rules(path, declarations) 登记属性和效果。输入支持普通对象、单个 `[属性或 Key, 内容]` 及嵌套数组或标准 Iterable，按顺序自动完成声明。对象键使用 CSS 原名；Key 通过二元组保留身份。Token 作为内容消费，由架构根据自身 default、state、address 自动建立定义，不需要手动补一条 Token 声明。

Token 的条件变化在自身 state 中表达；独立配置用新 Token，并在具体属性中明确消费，不自动替换旧引用。手动 declare、[token, value] 和 [token, undefined] 保留为 dangerous 操作，不作运行时或类型拦截；它们不属于推荐的组件编写方式。modify 的表达式加工及 Mixin 结果仍可作为输入，集合空项和普通属性 undefined 不输出。

clickable({ cursor, opacity, focusColor, address }) 接受组件提供的光标、透明度和焦点颜色内容；address 可选，内部未固定位置的 Token 随实际消费地址发布。cursor 可传入带 state 的 Token；省略时沿用 pointer 与禁用状态的 not-allowed 默认值，不额外叠加一份光标声明。

compileCSS() 读取全局登记并返回 CSS 文本；compileRules(rules) 编译显式材料；cssRoot.mount() 提交到宿主提供的 style#css-root。规则句柄只更新或撤销自己的登记；需要页面更新时重新提交。失败构建不应提交半份结果。

低层 AST 编辑与资源生命周期见 [接口与扩展协议](当前接口与扩展协议.md)。
