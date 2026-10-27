# Token 的创建与复用

本文描述 Token 的契约，源码已完成 Token 迁移。示例使用现役接口，统一设计见 [Token设计.md](../Token设计.md)。

Token 将基础内容和可选 state 作为一份定义。直接值、表达式以及带状态的共享材料使用同一种 Token，不再要求调用者选择不同的内容对象类型。

## 创建参数统一为一份定义

```ts
token('2px')
token('2px', 'spacing')
token({ default: '2px' })
token({ default: 2, hover: (base) => multiply(base, 2), active: 4 })
token(2, {
  name: 'strength',
  state: { hover: (base) => multiply(base, 2), active: 4 },
})
```

Argument parser 将不同写法归一为固定的七个 key：`default`、`name`、`state`、`address`、`registration`、`onFirstScan`、`compileWaveIndex`。可选项可以未提供，后续流程只处理统一结果。状态简写中的 default 是基础内容，其余项是状态定义；配置中的字段统一叫 state。

state 条件只接受静态预置字符串快捷名或 StateCondition。hover、active 等名称可直接使用，未定义字符串立即报错。新增共享预置在所属 Pieces 条件文件的映射中维护，临时自定义及原始 CSS 通过 stateCondition 对象的 entry 传入；解析结果统一为 `Map<StateCondition, TokenStateRule>`，不把条件对象隐式转成字符串。

只有 default 的定义与直接基础值形式等价，不生成隐式空 state。普通对象、数组数据通过 default 显式承载；已有 Token、表达式和延迟生产函数仍可直接作为基础值。输入分类与非法定义边界见 [Token 设计的参数入口](../Token设计.md#参数入口负责输入语法)。

## 使用另一个 Token 就是消费表达式

```ts
const spacing = token('2px', 'spacing')
const localSpacing = token(spacing)
const doubled = token(multiply(spacing, 2))
```

spacing 对外就是可坍缩的内容，与普通表达式按同一方式消费。localSpacing 不复制 spacing 的 state、address 或其他配置；其 default 保存对 spacing 的引用。坍缩时根据被引用对象的实际 _kind 自然取得对应 CSS 表达，不增加“传入 Token 就复制定义”的判断。

需要创建另一份定义时，普通函数读取来源的 default、state 等信息，明确组合继承项与覆盖项，再返回新 Token。引用已有值与组合已有定义各有明确动作，不在消费入口猜测调用者意图。

## CSS 声明身份由定义与使用决定

name、state、address、registration 或 modify 使用，都会使 Token 需要 CSS variable 身份。没有这些需求的 Token 直接输出 CSS value；例如未命名、无状态、未被修改的 token('2px') 输出 2px。需要 CSS variable 而没有 name 时，系统自动生成名称，声明、引用和修改共用该名称。

address 指定定义的位置，state 属于这个地址。后代消费只读取 CSS 结果，不在每个消费者复制状态或搬运公式。需要另一处计算位置时，应明确创建该地址的定义或登记当地 modify，不能由消费动作隐式建立。

需要 CSS variable 而未指定 address 时，默认根据地为 root；这一缺省不单独使普通直接值改变身份。正常消费由编译器按需建立自身 default 和 state，不要求先手动声明。主动采用 dangerous 重声明时，既有显式基础选择及层叠能力保留；这不是正常定义模板。

同名对象也不相互借入 JS 定义、状态或资源；CSS 名称相同引起的覆盖仍遵循地址、书写顺序和浏览器层叠。Token 不保存 priority，内部也不维护独立 definitionKey 或 declarations 列表。

## 内部 _kind 在坍缩前确定

_kind 是系统内部处理信息，可对外读取，调用方按约定不修改，也不是 parser 的第八个 key。构造 Token、表达式或 AST 引用时不即时输出 CSS。

编译先读取实际使用的 Token、附加规则以及 modify；onFirstScan 可以继续产生包含 modify 的规则。在所有会影响 _kind 和取值的修改读取完毕后，才允许相关 Token 坍缩。不限定要经过多少次激活或第几波，不能写成第一波激活前就已经知道全部修改。

因此，在源规则中先引用 Token、后写 modify，不会令前者输出直接值、后者却使用另一个 CSS 变量身份。compileWaveIndex 继续约束内容允许处理的时机，不替代“坍缩前读完修改”的条件。

## 可复用的是定义，不是加工历史

用途选择和计算由返回 Token 的普通函数承担。Token 不内置 Variant，不保留 RuleToken 或独立 adjust。函数可以组合基础内容和状态，但结果不保存 resultSource 系列加工记录，也不在后续使用时重放历史。

state 可以独立定义再交给 Token，也可以直接写入创建参数。Token.state 已是 Map；复用时直接传入，组合时展开 [...source.state] 或迭代条目，不再使用对象展开或 Object.entries。状态回调读取所属 Token 的基础内容，固定值原样保留；详细结果见 [states与条件选择.md](states与条件选择.md)。

局部条件通过根入口 stateCondition(input) 创建，直接作为对象复用。hover、active、enabled、disabled 等快捷名来自静态预置表，各自匹配，不自动互相排除，也不要求业务枚举交集。

需要明确区分返回新定义和指定位置修改时，读 [Token的定义组合与modify.md](Token的定义组合与modify.md)。
