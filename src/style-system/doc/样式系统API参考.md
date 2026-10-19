# 如何查API

本文按用途展示仓库内Style System的公开调用形状和例子，帮助选择API；有效输入、返回、错误和生命周期以[单项行为](behaviors/__spec.md)为准。这里不定义第二套规则，也不把当前内部结构作为使用前提。完整业务写法先读[按钮教程](从按钮需求组合样式.md)或[使用入口](样式系统对象与行为.md)。

## 对象与用途

| 对象 | 用来表达什么 | 负责行为 |
| --- | --- | --- |
| Key、Declaration | 属性目标与内容的配对 | [明确目标](behaviors/样式声明必须明确目标与内容.md)、[重复贡献](behaviors/重复声明按约定组合贡献.md) |
| Value、withContent | 数据与格式复用 | [包装方式](behaviors/替换内容保留包装方式.md) |
| Variable、VariableName | 可覆盖的具体内容、名称引用 | [创建](behaviors/变量创建必须明确内容与名称.md)、[引用身份](behaviors/引用只携带具体对象的定义.md) |
| Condition、StateCondition | 适用位置或主体状态 | [名称登记](behaviors/状态名称登记必须明确且无歧义.md)、[确定次序](behaviors/同时成立的状态必须有确定结果.md) |
| Expression、CSSFunction | 内容组合与具名CSS函数调用 | [复合语义](behaviors/复合样式必须保持原有语义.md)、[扩展内容](behaviors/内容改写只影响本次消费位置.md) |
| Modification、adjust、modify | 独立变化、组合新结果或修改已声明基础 | [独立变化](behaviors/独立变化可被多个来源复用.md)、[相对修改](behaviors/相对修改保留基础与操作顺序.md) |
| Mixin | 布局、文字、边界等完整效果 | [只产生所选效果](behaviors/配置产生的效果必须局限于所选项.md) |
| rule、rules、CSSRoot | 登记、更新、撤销、读取与提交 | [独立撤销](behaviors/样式登记可独立撤销.md)、[提交保护](behaviors/样式提交保留已有且失败可回退.md) |

Pieces是这些可复用材料的统称；Atom是在组合中将Value或Variable当作一块内容使用的称呼。了解其目录职责或内部协议时再读[架构](../architecture.md)。

## 创建与派生

以下是调用形状示意，具体输入含义由[创建行为](behaviors/变量创建必须明确内容与名称.md)和[定义复用行为](behaviors/延伸样式保留来源且允许覆盖.md)负责。

```ts
variable(defaultContent, nameOrOptions)
variable({ default: defaultContent, hover: hoverContent }, nameOrOptions)
source.derive()
source.derive(content, nameOrOptions)
source.derive(source.content, { name: 'new-name', states: { hover: hoverContent }, priority: 0 })
```

常见配置是name、states、priority、registration、onActive和compileWaveIndex。registration的syntax/inherits/initialValue分别有什么效果，见[注册行为](behaviors/变量注册保留显式类型与继承语义.md)；配置创建与之后消费的区别见[延迟消费](behaviors/动态样式只在使用时求值.md)。Variable.name的字符串拼接和CSS引用使用[名称行为](behaviors/引用只携带具体对象的定义.md)。

## 独立变化与来源绑定

```ts
const source = variable(oklch({ lightness: 0.5, chroma: 0.1, hue: 240 }), 'source')
const change = modification({
  name: '--change', type: 'color',
  detail: { lightness: 0.3, chroma: current => add(current, 0.3) },
})
const merged = adjust(source, change)
rules('.item', [declare(merged), color({ content: merged })])
```

本例把亮度设为0.3、彩度相对增加0.3，其余通道沿用来源。变化本身可以复用，完整含义和共同声明结果见[独立变化行为](behaviors/独立变化可被多个来源复用.md)。数值变化可写成`modify(target, { type: 'expression', detail: current => add(current, 2) })`；何时需要显式基础、怎样累计或替换步骤见[相对修改行为](behaviors/相对修改保留基础与操作顺序.md)。

协议材料是操作读取的数据形状：DeclareProtocol展示key/content及可选declarations；Adjust/Modify目标材料展示key、可选states和registration；颜色变化材料展示type、key/content。接受与拒绝边界由[声明材料行为](behaviors/样式声明必须明确目标与内容.md)负责，类型定义从[公开入口](../index.ts)查到对应文件。

## 并列声明独立颜色

页面需要协调多个独立颜色时，在同一rules里并列declare；完整使用例见[按钮教程](从按钮需求组合样式.md)。共享来源与组件控制如何配合见[共享颜色行为](behaviors/共享颜色来源允许组件独立覆盖.md)。公开能力范围不由本页额外扩展。

## 声明与作用域

```ts
rules(button, [
  [$alignSelf, 'center'],
  declare(surfaceColor, surfaceColorDefault),
  color({ background: surfaceColor }),
])
```

第二参数把属性、局部值和完整效果放在一起。声明输入参照[明确目标](behaviors/样式声明必须明确目标与内容.md)，同址竞争参照[有效优先关系](behaviors/同址声明保留有效优先关系.md)，重复Key的join参照[贡献组合](behaviors/重复声明按约定组合贡献.md)。普通使用者先看[Key求和例子](样式系统对象与行为.md#声明目标key)，无需先读聚合实现。

## 状态与内容输出

需要可复用反馈时，把状态写进Variable，再将该对象交给color、elevation等效果；用法见[状态专题](主体状态条件.md)。[自身状态](behaviors/样式状态只由变量自身承担.md)、[确定次序](behaviors/同时成立的状态必须有确定结果.md)及[禁用反馈](behaviors/禁用主体不接受交互反馈.md)分别负责结果。焦点轮廓的用法见使用入口，生成路径留在架构。

## 内容扩展

普通业务样式先用已有表达式和Mixin；确有新内容格式时，使用createJSSContent或JSSContent的公开能力。查[位置改写](behaviors/内容改写只影响本次消费位置.md)、[显式位置与来源](behaviors/节点编辑保留显式位置与来源.md)及[延后完成](behaviors/延后内容完成后再交付结果.md)取得完整约定；节点、Controller和已编译读取的当前实现见[架构](../architecture.md#内容扩展与位置记录)。
