# Style System API 参考

本文按用途记录 Token 接口，完整定义见 [Token 设计](Token设计.md)。Token 迁移已实现并通过本轮验证；涉及 token 的代码使用当前公开入口。规则登记、CSS 读取与提交仍沿用现有入口。

## 对象与用途

| 对象                 | 用来表达什么                                                | 负责行为                                                  |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| Token                | 样式基础内容与可选状态；内容可以引用其他 Token 或计算表达式 | [Token 的创建与复用](behaviors/Token的创建与复用.md)      |
| State                | 可单独复用或直接写进 Token 的状态取值规则                   | [states 与条件选择](behaviors/states与条件选择.md)        |
| Key、Declaration     | CSS 属性目标与内容的配对                                    | [规则登记和撤销](behaviors/rule与rules的登记和撤销.md)    |
| Condition            | 选择作用位置和环境条件                                      | [CSS 作用域与层叠](behaviors/CSS作用域与层叠.md)          |
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

```ts
const source = token('2px')
const target = token(source)
```

target 的基础内容就是可坍缩的 source，按普通表达式消费并自然形成引用，不复制 source 的定义，也不根据传入对象另作继承判定。

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
