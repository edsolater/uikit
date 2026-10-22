# 如何查API

本文按用途展示仓库内Style System的公开调用形状和例子，帮助选择API；有效输入、返回、错误和生命周期见[__spec.md](behaviors/__spec.md)。完整业务写法先读[按钮教程](从按钮需求组合样式.md)或[使用入口](样式系统对象与行为.md)。

## 对象与用途

| 对象 | 用来表达什么 | 负责行为 |
| --- | --- | --- |
| Key、Declaration | 属性目标与内容的配对 | [rule与rules的登记和撤销.md](behaviors/rule与rules的登记和撤销.md) |
| Value、withContent | 数据与格式复用 | [Value与Expression.md](behaviors/Value与Expression.md) |
| Variable、VariableName | 可覆盖的具体内容、名称引用 | [Variable的创建与复用.md](behaviors/Variable的创建与复用.md) |
| Condition、StateCondition | 适用位置或主体状态 | [CSS作用域与层叠.md](behaviors/CSS作用域与层叠.md)、[states与条件选择.md](behaviors/states与条件选择.md) |
| Expression、CSSFunction | 内容组合与具名CSS函数调用 | [Value与Expression.md](behaviors/Value与Expression.md)、[内容扩展与AST编辑.md](behaviors/内容扩展与AST编辑.md) |
| Modification、adjust、modify | 独立结果或指定范围内的完整结果加工 | [adjust与modify.md](behaviors/adjust与modify.md) |
| Mixin | 布局、文字、边界等完整效果 | [rule与rules的登记和撤销.md](behaviors/rule与rules的登记和撤销.md) |
| rule、rules、CSSRoot | 登记、更新、撤销、读取与提交 | [rule与rules的登记和撤销.md](behaviors/rule与rules的登记和撤销.md)、[Compile与挂载.md](behaviors/Compile与挂载.md) |

Pieces是这些可复用材料的统称；Atom是在组合中将Value或Variable当作一块内容使用的称呼。了解其目录职责或内部协议时再读[架构](../architecture.md)。

## 创建与派生

以下是调用形状示意，具体输入含义见[Variable的创建与复用.md](behaviors/Variable的创建与复用.md)。

```ts
variable(defaultContent, nameOrOptions)
variable({ default: defaultContent, hover: hoverContent }, nameOrOptions)
variableFrom(source, source.content)
source.variant('content')
variableFrom(source, content, nameOrOptions)
variableFrom(source, source.content, { name: 'new-name', states: { hover: hoverContent }, priority: 0 })
```

常见配置是name、address、states、variants、priority、registration、onActive和compileWaveIndex。address 是根据地，缺省root；states随根据地，variableFrom/variant/adjust未指定新地址时沿用来源地址。registration的syntax/inherits/initialValue分别有什么效果，见[按需资源与同名替换.md](behaviors/按需资源与同名替换.md)；配置创建与之后消费的区别见[Value与Expression.md](behaviors/Value与Expression.md)。Variable.name的字符串拼接和CSS引用使用[Variable的创建与复用.md](behaviors/Variable的创建与复用.md)。

variants 按名称保存变体规则或固定值；`source.variant('content')` 返回保留状态的 Variable，结果不带父层变体。variableFrom 对所有 Variable 原样继承 states 和 variants，规则基于新基础计算，固定值保持原值。完整边界见[Variable的创建与复用.md](behaviors/Variable的创建与复用.md#选择一种用途)。

## 独立变化与来源绑定

```ts
const source = variable(oklch({ lightness: 0.5, chroma: 0.1, hue: 240 }), 'source')
const change = modification({
  name: '--change', type: 'color',
  detail: { lightness: 0.3, chroma: current => add(current, 0.3) },
})
const merged = adjust(source, change)
rules('.item', [jssColor({ content: merged })])
```

本例把亮度设为0.3、彩度相对增加0.3，其余通道沿用来源。变化本身可以复用，默认、状态、变体及其状态都会加工。数值变化可写成`modify(target, { type: 'expression', detail: current => add(current, 2) })`；完整范围、当前基础、步骤累计与替换见[adjust与modify.md](behaviors/adjust与modify.md)。

协议材料是操作读取的数据形状：DeclareProtocol展示key/content及可选declarations；Adjust/Modify目标材料展示key、可选states和registration；颜色变化材料展示type、key/content。接受与拒绝边界由[rule与rules的登记和撤销.md](behaviors/rule与rules的登记和撤销.md)负责，类型定义从[公开入口](../index.ts)查到对应文件。

## 并列声明独立颜色

页面需要协调多个独立颜色时，在同一rules里并列declare；完整使用例见[按钮教程](从按钮需求组合样式.md)。共享来源与组件控制如何配合见[共享主题与组件颜色控制.md](behaviors/共享主题与组件颜色控制.md)。公开能力范围不由本页额外扩展。

## 声明与作用域

```ts
rules(button, [
  [$alignSelf, 'center'],
  declare(surfaceColor, 'green'),
  jssColor({ background: surfaceColor }),
])
```

第二参数把属性、局部值和完整效果放在一起。声明输入、同址竞争与重复Key的join见[rule与rules的登记和撤销.md](behaviors/rule与rules的登记和撤销.md)。普通使用者可先看[Key求和例子](样式系统对象与行为.md#声明目标key)。

## 状态与内容输出

需要可复用反馈时，把状态写进Variable，再将该对象交给color、elevation等效果；用法见[状态专题](主体状态条件.md)。根据地主体、同时命中与禁用的结果见[states与条件选择.md](behaviors/states与条件选择.md)。焦点轮廓的用法见使用入口，生成路径留在架构。

## 内容扩展

普通业务样式先用已有表达式和Mixin；确有新内容格式时，使用createJSSContent或JSSContent的公开能力。本次消费改写、显式位置与来源、等待及撤销见[内容扩展与AST编辑.md](behaviors/内容扩展与AST编辑.md)；节点、Controller和已编译读取的当前实现见[架构](../architecture.md#内容扩展与位置记录)。
