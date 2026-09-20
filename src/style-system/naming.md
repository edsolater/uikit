# Style System 命名

名字说明对象的用途与存在形式。Variable 的最后一个单词表达形式，例如 surfaceColor、backgroundColor、controlSize、boundaryWidth；对应 CSS 名字为 surface-color、background-color、control-size、boundary-width。

## 对象命名

| 对象 | 示例 | 含义 |
| --- | --- | --- |
| Key | $backgroundColor、$opacity | 原生 CSS 声明目标 |
| Variable | surfaceColor、fastDuration | 有独立身份的材料及其形式 |
| Cluster | accentColor、neutralColor | 同组 Variable 的统一入口 |
| 成员键 | soft、strong、2 | 声明端指定的成员选择 |
| Mixin | color、boundary、clickable | 完整效果 |
| State Condition | hover、active、focusVisible | 主体自身状态 |

Cluster 本身也是 Variable，所以名字同样以形式结尾。成员键不要求再带完整 Variable 名字；accentColor('soft') 已经能表达所选材料。hover、active 属于成员的状态，不成为语气成员。

Value 只表达稳定内容；不能为承载状态而建立智能 Value。命名规则不要求把既有稳定 Value 一律改名，也不要求所有名字追加字面上的 Unit 或 CSS 单位。

## 通用与组件归属

surfaceColor 描述承载面的颜色，被 Button 使用仍可属于通用抽象。buttonSurfaceColor 描述 Button 自己，属于 Button。

不能只删除 button 前缀就把组件配方搬进抽象层。判断标准是：不用业务名字仍能自然、准确地说明它，其他组件使用也不别扭。只描述某个组件领域的内容留在组件内。

CSS 原始 token 可以继续由基础 CSS 提供。新 Variable 用有形式的名字，并引用原始 token；不为统一 JS 名字而改写无关 CSS 领域。

## 阅读顺序

所有定义都在首次使用之前，定义后紧接消费；后续继续复用。模块归属按描述目标判断，模块内部顺序按首次使用排列。不能先在文件开头堆放整批局部材料，让读者记住尚未使用的名字。
