Style System 用 CSS 表达样式，因此保留 CSS 的求值位置、继承、层叠和环境条件。动态不是让任何地方的同名输入都能改变所有公式；控制范围必须能从声明位置和引用关系判断。

# 继承结果，不隐式搬运公式

```css
:root {
  --base: 4px;
  --width: calc(var(--base) * 2);
}
.Button {
  --base: 7px;
  width: var(--width);
}
```

Button 宽 8px。根上的 width 在根计算，再向后代继承；Button 的 base 为 7px 不使它重新变成 14px。若根 base 改为 9px，则根公式响应，Button 宽变为 18px，无需重新编译 JS。

需要在 Button 计算另一份公式，就显式指定该 Variable 的 Button 根据地，或在 Button 条件下明确 modify。根据地自动声明只保障指定位置有定义，不因消费行为新增计算位置。

# 同一边界也约束修改配方

```ts
const size = variable('4px', 'scope-size')
const delta = variable('1px', 'scope-delta')
rules('.Parent', [
  modify(size, { type: 'expression', detail: current => add(current, delta) }),
  [key('width'), size],
])
rules('.Child', [declare(delta, '10px'), [key('width'), size]])
```

Child 位于 Parent 内，只有 Parent 明确建立修改。Parent 为 5px，Child 继承同一 5px；Child 只读取 size，不应因当地 delta 为 10px 自动变成 14px。根 delta 改为 3px 时，Parent 与 Child 都为 7px。这里约束领域结果，不声称当前实现已符合。

伪代码推导：`Parent结果 = Parent处的原结果4 + Parent处的delta1`；`Child结果 = 继承Parent结果`。只有在 Child 明确加入当地修改，才重新讨论 Child 的公式与修改顺序。普通表达式、adjust 和 modify 不得各自恢复“读取即当地重算”的例外。

# 局部换值与原生层叠

在 Local 显式声明某变量为 red，影响 Local 及适用继承者；外层和兄弟仍取原值。它不改变 JS 定义，不把该定义的 states 移到 Local，也不迫使依赖它的祖先公式重新绑定。

CSS 书写顺序本身影响结果。例如同一主体依次出现 `padding: 1px`、`padding-left: 2px`、`padding: 3px`，最终左内边距为 3px；不能为了合并条件块重排为 2px。嵌套条件保留每层范围，即使文字重复也不能当作无用项删除。内部贡献等级只用于同完整地址选择，不取代浏览器跨地址层叠。

# 运行时变化继续由 CSS 响应

已提交的 CSS 引用、state、媒体和主题条件应继续动态生效。配置暗色 12px、普通 8px、减少动效 0px，就让浏览器按实际条件选择；不能在编译时冻结一个分支，也不能添加未配置的环境分支。

修改 JS 创建配置则需要重新构建并提交，不承诺普通对象写入自动更新页面。动态控制与规则复用是不同责任，真实组合见 [共享主题与组件颜色控制.md](共享主题与组件颜色控制.md)。
