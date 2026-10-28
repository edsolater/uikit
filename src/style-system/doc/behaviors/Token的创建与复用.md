# Token 的创建与复用

本文描述 Token 的契约，源码已完成 Token 迁移。示例使用现役接口，统一设计见 [Token设计.md](../Token设计.md)。

Token 将基础内容和可选 state 作为一份定义。直接值、表达式以及带状态的共享材料使用同一种 Token，不再要求调用者选择不同的内容对象类型。

## 创建参数统一为一份定义

```ts
token('2px')
token('2px', 'spacing')
token(2, {
  name: 'strength',
  state: { hover: (base) => multiply(base, 2), active: 4 },
})
```

第一个参数是基础内容，第二个参数是配置；状态统一放在配置的 state 中。Argument parser 归一为固定的七个 key：`default`、`name`、`state`、`address`、`registration`、`onFirstScan`、`compileWaveIndex`。可选项可以未提供，后续流程只处理统一结果。

state 接受快捷名对象、Map、单个条件 entry，以及这些形式的任意嵌套数组或 Iterable；按顺序展开容器，entry 的条件和值保持配对。条件只接受静态预置字符串快捷名或 StateCondition，未知字符串立即报错。新增共享预置在所属 Pieces 条件文件的映射中维护，临时自定义及原始 CSS 通过 stateCondition 对象 entry 传入；结果统一为 `Map<StateCondition, TokenStateRule>`，不把条件对象隐式转成字符串。

普通对象和数组直接作为第一个参数传入，是原始数据；名为 default、hover 的字段也不作为配置解析。特殊格式通过第二参数提供。没有 state 配置时不生成隐式空状态，见 [Token 设计的参数入口](../Token设计.md#参数入口负责输入语法)。

## 直接传入 Token 继承定义

```ts
const spacing = token('2px', 'spacing')
const localSpacing = token(spacing)
const doubled = token(multiply(spacing, 2))
```

localSpacing 是独立 Token，继承 spacing 的 address、state、registration 和生命周期配置，default 默认引用 spacing。追加配置覆盖同名顶层字段；state 同条件覆盖、新条件追加，显式 undefined 清除，空对象不删除已有条目。来源保持不变；新对象不继承 name、运行身份或自动名称，避免同名自引用。

已有 Token 直接传入，state 自然继承并软合并差异。生产函数用于延迟计算、消费时读取变化数据或等待内容可用等明确目的，不是继承开关。计算表达式内部的 Token 仍是内容引用；创建入口完成定义继承后，坍缩不再复制配置。其他加工由普通函数表达，不保存创建历史。

## CSS 声明身份由定义与使用决定

name、state、address、registration 或 modify 使用，都会使 Token 需要 CSS variable 身份。没有这些需求的 Token 直接输出 CSS value；例如未命名、无状态、未被修改的 token('2px') 输出 2px。需要 CSS variable 而没有 name 时，系统自动生成名称，声明、引用和修改共用该名称。

显式 address 固定 default 与 state 的定义位置，后代读取该位置的 CSS 结果，不搬运祖先公式。创建结果未指定 address 时，需要 CSS variable 的 Token 在每个 AST 消费地址分别建立自身 default 与 state；同一对象多处使用不锁定首次地址，也不写回 address。

全局材料显式指定 address: ':root'。未指定地址不会使普通 token('2px') 改为 CSS variable；正常消费由编译器按需建立所需定义，不要求手动声明。每位置的定义准备与对象生命周期分开，onFirstScan、onCompile 仍按每对象每次编译调用一次。主动采用 dangerous 重声明时，既有显式基础选择及层叠能力保留；这不是正常定义模板。

同名对象也不相互借入 JS 定义、状态或资源；CSS 名称相同引起的覆盖仍遵循地址、书写顺序和浏览器层叠。Token 不保存 priority，内部也不维护独立 definitionKey 或 declarations 列表。

## 内部 _kind 在坍缩前确定

_kind 是系统内部处理信息，可对外读取，调用方按约定不修改，也不是 parser 的第八个 key。构造 Token、表达式或 AST 引用时不即时输出 CSS。

编译先读取实际使用的 Token、附加规则以及 modify；onFirstScan 可以继续产生包含 modify 的规则。在所有会影响 _kind 和取值的修改读取完毕后，才允许相关 Token 坍缩。不限定要经过多少次激活或第几波，不能写成第一波激活前就已经知道全部修改。

因此，在源规则中先引用 Token、后写 modify，不会令前者输出直接值、后者却使用另一个 CSS 变量身份。compileWaveIndex 继续约束内容允许处理的时机，不替代“坍缩前读完修改”的条件。

## 可复用的是定义，不是加工历史

用途选择和计算由返回 Token 的普通函数承担。Token 不内置 Variant，不保留 RuleToken 或独立 adjust。函数可以组合基础内容和状态，但结果不保存 resultSource 系列加工记录，也不在后续使用时重放历史。

state 可以独立定义再交给 Token，也可以直接写入配置。已定义的 Token.state 是 Map，可以直接参与嵌套组合；手动读取它使用 Map 迭代，不使用对象展开或 Object.entries。状态回调读取所属 Token 的基础内容，固定值原样保留；详细结果见 [states与条件选择.md](states与条件选择.md)。

局部条件通过根入口 stateCondition(input) 创建，直接作为对象复用。hover、active、enabled、disabled 等快捷名来自静态预置表，各自匹配，不自动互相排除，也不要求业务枚举交集。

需要明确区分返回新定义和指定位置修改时，读 [Token的定义组合与modify.md](Token的定义组合与modify.md)。
