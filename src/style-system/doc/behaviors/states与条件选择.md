state 将一份定义的反馈保存起来，使业务换基础或选择用途时无需重写每个 hover、active。state 属于明确主体，不因为变量被谁读取就自动改变归属。

# 规则读取基础，固定值保持固定

```ts
const size = variable('4px', {
  name: 'feedback-size', address: '.Button',
  states: { hover: base => add(base, '2px'), active: '12px', disabled: '0px' },
})
rules('.Button', [[key('width'), size]])
```

Button 普通为 4px、hover 为 6px、active 为 12px、disabled 为 0px。规则接收根据地的基础内容，生成 CSS 表达式，不先读取浏览器算好的数值。合法 0 必须保留。

将基础改成 10px 时，hover 为 12px，固定 active 仍为 12px；选择 variant 则基于 variant 自己的基础。这由 [Variable的创建与复用.md](Variable的创建与复用.md) 推导，不额外引入 state 联动机制。state 彼此不是累计修改：不能先应用 hover，再拿 hover 结果计算 active。

# 状态只随根据地展开

若根据地为根，state 也属于根；要让每颗 Button 响应自身交互，就显式指定 Button 地址。后代仅消费这份变量，得到的是 CSS 继承结果，而不是属于后代的一套新 state。

反例：根定义普通 4px，标记对应的 state 为 8px；Box 在其他地址明确赋 10px。仅给 Box 加同名标记，Box 仍为 10px；给根加标记，无局部覆盖的消费者变为 8px，Box 仍为 10px。在 Box 需要另一套反馈时，必须创建该地址的定义或显式条件 modify。

Value、普通 Expression 和 Name 引用不复制所引用 Variable 的 JS states，不自动枚举多个来源的 state 交集。表达式保留 CSS 引用，让浏览器在实际求值位置响应适用 state。

# 多个条件同时成立

同一主体同时 hover、active 时，需要稳定、可说明的选择规则。当前快捷约定 active 在 hover 后，disabled 排除快捷 hover/active 的交互反馈，因此同等适用情况下上述 Button 的 active 为 12px，禁用为 0px，不依赖 states 对象字段碰巧怎么排列。

直接 CSS 条件仍遵循自身特异度和源序；快捷 state 的排序不能变成忽略任意选择器权重的总开关。普通 Rules 中的 hover 字符串也不暗中解释成 state 快捷名。

原生 disabled 和项目的禁用标记都应阻止快捷交互外观；普通 &:hover 仍是原生 CSS，不自动加禁用过滤。样式 state 标记不替 DOM 承担事件禁用。快捷名登记、完整顺序及 focus 映射属于 [当前接口约定](../当前接口与扩展协议.md#状态快捷名与交互约定)。
