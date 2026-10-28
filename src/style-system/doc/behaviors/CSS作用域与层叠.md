本文按 Token 模型描述 CSS 边界，源码已完成 Token 迁移。

下文的外部局部赋值用于说明仍保留的 dangerous 低层行为，不是组件编写模板；正常定义使用 Token 自身 default、state、address，局部独立值创建新 Token 并接入属性。不对手动声明作运行时或类型拦截。

Style System 用 CSS 表达样式，因此保留 CSS 的求值位置、继承、层叠和环境条件。动态不是让任何地方的同名输入都能改变所有公式；控制范围必须能从声明位置和引用关系判断。

# 显式地址保留 CSS 继承结果

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

这份公式已经明确建立在 root，不会因消费位置改变而迁移。需要另一份 Button 公式时，可以显式指定 Button 地址，或让未指定地址的 Token 在 Button 消费处建立定义；对既有目标的条件加工仍使用 modify。

# 未指定地址的定义随使用位置建立

```ts
const spacing = token('4px', {
  name: 'local-spacing',
  state: { hover: '6px' },
})
rules('.A', { width: spacing })
rules('.B', { height: spacing })
```

spacing 需要 CSS variable 身份，但没有固定 address，因此在 A、B 各自建立默认值与 hover 状态。它不只属于先扫描到的 A，也不把 A 或 B 写回 spacing.address。onFirstScan、onCompile 仍按对象每次编译调用一次，每位置的定义准备交给既有 AST；toCSSString 只负责输出。

无状态、无名称且没有其他变量需求的 token('2px') 仍直接输出 CSS value。全局材料使用显式 address: ':root'，不能因为某个 Token 被多处消费，就把它或其显式固定的依赖全部投影到每个位置。

# 显式固定来源的修改仍继承结果

```ts
const size = token('4px', { name: 'scope-size', address: ':root' })
const delta = token('1px', { name: 'scope-delta', address: ':root' })
rules('.Parent', [
  modify(size, {
    type: 'expression',
    detail: (current) => add(current, delta),
  }),
  [key('width'), size],
])
rules('.Child', [declare(delta, '10px'), [key('width'), size]])
```

Child 位于 Parent 内，只有 Parent 明确建立修改。Parent 为 5px，Child 继承同一 5px；Child 只读取 size，不应因当地 delta 为 10px 自动变成 14px。根 delta 改为 3px 时，Parent 与 Child 都为 7px。这里约束领域结果，不声称当前实现已符合。

伪代码推导：`Parent结果 = Parent处的原结果4 + Parent处的delta1`；`Child结果 = 继承Parent结果`。这里的来源显式固定在 root，只有 Child 明确加入当地修改，才重新讨论 Child 的公式与修改顺序。普通表达式和 modify 不改变显式地址的 CSS 求值边界。

# 局部换值与原生层叠

在 Local 显式声明某变量为 red，影响 Local 及适用继承者；外层和兄弟仍取原值。它不改变 JS 定义，不把该定义的 states 移到 Local，也不迫使依赖它的祖先公式重新绑定。

CSS 书写顺序本身影响结果。例如同一主体依次出现 `padding: 1px`、`padding-left: 2px`、`padding: 3px`，最终左内边距为 3px；不能为了合并条件块重排为 2px。嵌套条件保留每层范围，即使文字重复也不能当作无用项删除。Token 不保存 priority，同址声明顺序与浏览器跨地址层叠保持各自职责。

# 运行时变化继续由 CSS 响应

已提交的 CSS 引用、state、媒体和主题条件应继续动态生效。配置暗色 12px、普通 8px、减少动效 0px，就让浏览器按实际条件选择；不能在编译时冻结一个分支，也不能添加未配置的环境分支。

修改 JS 创建配置则需要重新构建并提交，不承诺普通对象写入自动更新页面。动态控制与规则复用是不同责任，真实组合见 [共享主题与组件颜色控制.md](共享主题与组件颜色控制.md)。
