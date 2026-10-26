# Token 的定义与消费

本文使用 [Token 设计](Token设计.md) 的目标接口；源码已完成迁移，示例使用当前源码接口，发布版本需另行发布。

## 从直接值到命名内容

```ts
const spacing = token('2px')
const themeColor = token('red', 'theme-color')
const feedbackColor = token({
  default: 'red',
  hover: 'pink',
  active: 'darkred',
}, { address: '.Feedback' })
```

spacing 没有名称、状态、地址、注册，也没有被 modify，消费时直接输出 2px。themeColor 有名称，输出命名 CSS 声明及引用。feedbackColor 有状态和地址，自动取得名称，在指定位置输出默认值与状态规则。

Token 对外都是可坍缩的内容，不要求调用者先区分直接值与 CSS variable 身份。最后的输出路径由内部 _kind 决定，_kind 可对外读取，调用方按约定不修改。

## 引用与复制定义

```ts
const spacing = token('2px')
const doubledSpacing = token(multiply(spacing, 2))
const sharedSpacing = token(spacing)
```

普通计算和嵌套 Token 通过同一内容消费过程引用输入。sharedSpacing 的基础内容是 spacing，不复制 spacing 的状态或其他字段；需要输出这份内容时，自然取得输入的坍缩结果。不能根据输入位于哪个参数位置，另外选择“复制来源定义”模式。

如果要让新材料复用某些状态、地址或其他配置，由普通函数读取来源的规范化信息并明确组合，最后返回新 Token。没有内置用途变体，也没有独立的定义调整操作。

## State 与组件地址

同一组状态可以独立定义，供多个 Token 使用；状态回调收到所属 Token 的基础值。固定状态值直接决定该状态下的结果。

```ts
const feedback = {
  hover: base => multiply(base, 2),
  active: 4,
}
const buttonStrength = token(2, {
  name: 'button-strength',
  address: ['@layer uikit', '.Button'],
  state: feedback,
})
```

组件地址说明这些规则在哪里建立。全局材料负责共享值和规则，组件选择来源、地址及自身差异，业务再在明确范围使用这些对象。各层都使用 Token，不增加组件专用创建框架。

CSS 变量身份不改变浏览器原生作用域：祖先声明中的计算不会因为后代覆盖某个输入就自动搬到后代重算。需要当地计算时，将相应定义放到当地 address。

## Modify 改变输出需求

modify 表达使用位置或条件下对同一个目标的修改。原本只是直接值的 Token，只要成为 modify 的目标，就需要 CSS variable 身份；没有名称则自动生成。

坍缩前，编译器必须读完能影响该 Token 的修改，包括 onFirstScan 后续返回的规则。不限定第几波激活，也不能在第一次遇到引用时就提前输出直接值。具体修改与坍缩规则见 [Token 的定义组合与 modify](behaviors/Token的定义组合与modify.md)。

## 声明与提交

Token 的 address 是定义位置，不是附带声明列表。命名声明、条件修改和普通 CSS 属性声明最终都进入样式 AST。输出时需要 CSS variable 的 Token 提供声明及引用，其余 Token 提供 CSS value。

规则登记和挂载保持各自职责：组件在自己的 .style.ts 中描述样式，应用统一提交 CSS。直接修改普通 JavaScript 配置不等于已经刷新页面；核心接口已通过本轮单元及浏览器验证；业务组件仅完成编译接入，不据此宣告抽象或视觉设计正确。
