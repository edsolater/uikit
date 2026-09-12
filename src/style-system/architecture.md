Style System 保存可组合的 CSS 对象，由唯一固定 Root 接通并提交浏览器。此目录尚未接管组件使用的 `src/jss`；设计取舍与待做事项见 [设计文档](design.md)。

# 对象与派生

所有 Block 都是可调用对象。直接引用对象就能使用，`x()` 才从 x 的当前属性派生新对象；结果仍可继续调用。Value、Property、Selector 共享 Block 能力，Variable 属于 Value，业务不另填分类。

`fnkit/derivable-object.ts` 用函数 Proxy 承接属性。未覆盖的 primitive 始终从来源读取；引用值首次读取时保存 `lazyCopy(value)`，赋值只覆盖自身。调用时合并来源、当前状态和调用参数，建立下一对象。Block 通过 `block({ isActive: false })` 的调用形式显式重置派生状态，不再传构造选项。

`fnkit/lazy-copy.ts` 用 depth 指定隔离层数：默认 0 只处理自身，1 包含直接属性，Infinity 处理全部层数。同一来源在一次 lazyCopy 中复用同一代理。函数调用保持来源行为，写时复制只处理可见属性。

业务决定哪里需要独立状态。唯一使用的 Selector、需要共享的 Value 都可直接使用；需要隔离的对象才显式调用。attach 和激活不会替业务派生。

```ts
import { selector } from './core/derive/css-selector'
import { property } from './core/derive/css-property'
import { value } from './core/derive/css-value'
import { root } from './core/css-root'

const thin = value('2px')
const border = property('border-width', thin)
const button = selector('.button').attach(border)
root.attach(button)

// 需要独立组合时显式派生；连接数组中的 border 仍共享。
const input = button()
input.selector = '.input'
root.attach(input)
```

---

# 连接、激活与解析

attach 接受任意数量的实际对象，按顺序保存引用，返回接收者。离线组合只改变结构；接通 Root 后，激活沿 children、可选 dependence 及语义字段依赖传播。isActive 保证每个对象只激活一次，活对象新增连接立即接通新增对象。

Property 保存 key 和 value；Variable 保存 name 和 defaultValue。getDependencies 从当前字段取得依赖，不额外缓存一份值关系。普通 Block 只展开子级，Selector 生成选择器规则，Property 生成声明，各自的 parseCss 负责最终标点。Root 提交时才启动解析，构造、派生和激活均不求字符串。

原始值可修改 raw，选择器可修改 selector，属性可修改 key 或 value。离线修改会进入首次解析。当前没有自动监听字段赋值：活对象直接更换值依赖不会自动接通新值，也不会刷新 CSSOM；已实现的实时传播入口是 attach。没有通用 setValue 或字符串 Content 包装层。

---

# 文件职责

core 拥有 CSS 对象与激活语义；derive 和 fnkit 都是组织目录，不建立分组入口。前者排列 CSS 语义派生，后者存放不认识 CSS 的基础能力。tokens 组合通用材料，组件业务组合仍留在组件 style 文件。

| 文件 | 职责 |
| --- | --- |
| [fnkit/lazy-copy.ts](fnkit/lazy-copy.ts) | 提供默认浅层及可选深层的惰性写时复制。 |
| [fnkit/derivable-object.ts](fnkit/derivable-object.ts) | 建立完整的可调用对象，对属性使用浅层写时复制并连续派生。 |
| [core/css-block.ts](core/css-block.ts) | 定义共同对象与构造选项，保存连接，传播激活，安排 CSS 状态的派生。 |
| [core/derive/css-value.ts](core/derive/css-value.ts) | 将基本文本或数值保存为命名值对象。 |
| [core/derive/css-variable.ts](core/derive/css-variable.ts) | 保存变量引用、兜底值及既有状态后缀材料；尚不执行浏览器注册。 |
| [core/derive/css-property.ts](core/derive/css-property.ts) | 保存属性名和值对象，取得值依赖并解析声明。 |
| [core/derive/css-selector.ts](core/derive/css-selector.ts) | 保存选择器及子级，解析完整样式规则，包括空规则。 |
| [core/css-root.ts](core/css-root.ts) | 将实际对象接通并向固定 stylesheet 追加完整规则。 |
| [tokens/base-css.ts](tokens/base-css.ts) | 五个单项 Property 构造，以及组合四个方向的 margin。 |
| [tokens/css-color-mix.ts](tokens/css-color-mix.ts) | 保存颜色对象与权重，派生时隔离权重集合，最终解析混色。 |
| [tokens/well-known-css-variables.ts](tokens/well-known-css-variables.ts) | 组合共享颜色及既有状态后缀材料。 |

相邻测试承担对应验证：derivable-object.test.ts 使用中性对象；css-block.test.ts 检查身份、连接及激活；css-property.test.ts、css-value.test.ts 检查语义字段关系；base-css.test.ts 检查基础组合；css-root.browser.test.ts 检查真实浏览器结果。测试不构成额外领域。

---

# 固定根与当前边界

仓库 index.html 静态提供 `<style id="css-root"></style>`。root 是唯一固定对象，不接收外部 stylesheet，自身没有激活生命周期。

root.attach 保存实际对象，激活后调用其 parseCss，再通过 insertRule 追加完整规则。重复传入同一对象会追加多条规则，但共享该对象的激活状态；没有隐式实例化。嵌套结构随外层规则提交。

当前没有规则替换、刷新、撤销及挂载位置管理，不向共享 Block 写入单个 parent 或 index 冒充全部使用关系。活对象 attach 后内部结构和激活已变化，但先前写入的 CSSOM 不会自动变化。

变量全局智能注册仍未实现，既有状态后缀材料不能证明注册需求已经完成。deriveable 与 lazyCopy 目前只存在于本目录的 fnkit 组织目录，尚未迁入外部 FNKIT；对象合并直接使用外部 FNKIT。
