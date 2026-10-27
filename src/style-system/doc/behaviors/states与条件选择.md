本文按 Token 模型描述状态行为，源码已完成 Token 迁移。

state 将一份定义的反馈保存起来，使业务换基础时无需重写每个 hover、active。state 属于明确主体，不因为 Token 被谁读取就自动改变归属。输入条件只接受静态预置快捷名或 StateCondition：字符串对象简写使用预置名称，对象条件使用 entry 或 Map，解析后统一为 Map。State 可以独立存在，也可在创建 Token 时内联书写。

# 规则读取基础，固定值保持固定

```ts
const size = token('4px', {
  name: 'feedback-size',
  address: '.Button',
  state: [
    [whenHover, (base) => add(base, '2px')],
    [whenActive, '12px'],
    [whenDisabled, '0px'],
  ],
})
rules('.Button', [[key('width'), size]])
```

Button 普通为 4px、hover 为 6px、active 为 12px、disabled 为 0px。规则接收根据地的基础内容，生成 CSS 表达式，不先读取浏览器算好的数值。合法 0 必须保留。

将基础改成 10px 时，hover 为 12px，固定 active 仍为 12px。普通函数组合新定义时，状态规则基于新 Token 的基础内容；Token 不内置用途变体，见 [Token的创建与复用.md](Token的创建与复用.md)。state 彼此不是累计修改：不能先应用 hover，再拿 hover 结果计算 active。

# 状态只随根据地展开

若根据地为根，state 也属于根；要让每颗 Button 响应自身交互，就显式指定 Button 地址。后代仅消费这份变量，得到的是 CSS 继承结果，而不是属于后代的一套新 state。

危险重声明的反例：根定义普通 4px，标记对应的 state 为 8px；Box 在其他地址明确赋 10px。仅给 Box 加同名标记，Box 仍为 10px；给根加标记，无局部覆盖的消费者变为 8px，Box 仍为 10px。这条低层能力仍允许，但不作为正常定义方式；Box 需要独立反馈时，创建该地址的新 Token 并接入属性，表达式加工仍可使用 modify。

Token 嵌入其他 Token 或表达式时按普通可坍缩内容消费，不复制来源 state，不自动枚举多个来源的状态交集。表达式保留 CSS 引用，让浏览器在实际求值位置响应适用 state。

# 多个条件同时成立

同一主体同时 hover、active 时，各状态按定义条目的 Map 插入顺序生成 CSS，条件保留自身特异度，不另设中央排序。上例的 active 定义在 hover 后，两者条件同权重，所以 active 覆盖 hover；disabled 保留自身选择器权重，其 0px 覆盖二者。

快捷名只在参数入口换成 stateConditionRegistry 中的原条件对象，不改写 CSS 或添加 :where()；后续直接编译 Token.state，不重复解析或排序。state 中未定义的字符串立即报错，原始 CSS 必须先创建 stateCondition 对象。普通 Rules 中的 hover 字符串仍是 CSS 地址，不暗中解释成 state 快捷名。

whenHover/whenActive 和同义字符串只判断交互状态，不过滤禁用。多个条件可以同时命中：不同属性共同生效，同一属性按 CSS 层叠决定结果。样式状态不替 DOM 承担事件禁用。预置快捷名在所属 Pieces 条件文件的静态映射中维护，临时自定义使用 stateCondition 对象；输入边界及 focus 映射见 [当前接口约定](../当前接口与扩展协议.md#状态快捷名与交互约定)。
