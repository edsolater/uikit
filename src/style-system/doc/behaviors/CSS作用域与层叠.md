作用范围和计算结果最终由CSS决定。Style System需要保留这些含义，让业务能根据选择器、声明位置和引用关系判断变化会影响谁，而不用猜测编译器额外搬运了哪些公式。

# 局部换值只影响相应范围

普通Condition路径描述样式何时、何地生效。下面给.Local设置红色，让独立.Other继续读取根上的黑色：

```ts
const tone = variable('black', 'scope-color')
rules('.Local', [declare(tone, 'red'), [key('color'), tone]])
rules('.Other', [[key('color'), tone]])
```

局部显式赋值影响匹配主体及正常继承者，不修改JS定义，也不污染外层或兄弟：根上的scope-color为black，.Local声明red并消费，同一.Local及后代取得red，独立.Other仍black。撤销Local声明后恢复适用的剩余值；根据地的自动保障不能把显式值顶回创建内容。

根变量默认4px、`states: { '&[data-phase]': '8px' }`时，在.Box显式赋10px并消费width；只给.Box加data-phase，宽度仍为10px。给根加标记后，无局部覆盖的消费者为8px，.Box仍为10px。需要.Box自己的反馈，应把.Box设为根据地，或在那里显式使用条件modify。

# 保留浏览器看到的层叠顺序

业务书写的覆盖关系需要保留到浏览器中。原生简写、详细属性、重复声明和条件块的相对顺序都是结果的一部分，不能为了分组重排它们，让浏览器得到不同值。

```ts
const css = compileRules([
  [[condition('.Probe'), condition('@media (min-width: 0px)')], 'padding', '1px'],
  [[condition('.Probe')], 'padding-left', '2px'],
  [[condition('.Probe'), condition('@media (min-width: 0px)')], 'padding', '3px'],
])
const first = css.indexOf('padding: 1px;')
const middle = css.indexOf('padding-left: 2px;')
const last = css.indexOf('padding: 3px;')
expect(first).toBeGreaterThanOrEqual(0)
expect(middle).toBeGreaterThan(first)
expect(last).toBeGreaterThan(middle)
```

把CSS挂载到.Probe后，匹配的媒体条件下padding-left应为3px。若将第三条移到第一条旁边，便会误成2px。无媒体条件的`padding:2px 4px → padding-left:8px → padding:10px`也保留顺序，最终左内边距10px。案例不固定换行、缩进或内部容器。

不同选择器地址的结果仍取决于浏览器层叠与特异度；同址priority只用于[贡献选择](声明登记与贡献撤销.md)，不能跨地址改写CSS。根地址已有声明时同样保留`:root`与`:where(:root)`原生权重差别。

# 公式在声明处求值并继承

根上的输入适合全局控制，但局部声明同名输入，不会让祖先已经计算的公式重新绑定。保留这个边界，业务才能明确选择“继承已有结果”或“在新地址创建另一份公式”。

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

Button宽度为8px。它继承已经基于根base求出的width；当地同名base不使祖先公式重新绑定，也不触发系统把width搬到Button求14px。真正把根base改为9px时，根公式正常响应，Button宽18px。

需要另一处求值时显式创建相应address的Variable；局部完整加工使用modify。这里保留CSS现有动态引用，不提供跨作用域隐式公式投影。[根据地声明](变量创建与定义复用.md)仅保障指定位置有定义。

# 环境变化由已提交CSS响应

主题、媒体及减少动效偏好可能在页面运行期间改变。将它们保留为CSS条件，浏览器才能直接切换适用结果；不能在编译时提前选成唯一值。只配置普通值的材料不凭空加入主题或减少动效分支。

例如按需规则在`:where(:root)`提供8px、暗色属性条件下提供12px、prefers-reduced-motion:reduce条件下提供0px：实际挂载后切暗色应12px，切回应8px，减少动效匹配时应0px；独立区域显式20px仍按其范围生效。自动声明不能另加更强选择器使环境条件始终失效。

已提交CSS保留引用时，CSS值、状态、主题与媒体改变无需重构建JS。修改JS创建配置则需重新构建及提交，不能承诺普通对象修改自动更新DOM。真实组件的全局主题与局部控制见[共享主题与组件颜色控制](共享主题与组件颜色控制.md)。

# 嵌套路径保持原来每一层

保留作用范围也意味着不能只因条件文字相同就删一层。这个边界可用重复嵌套条件验证：

```ts
const handle = rule(undefined, undefined, [
  [[condition('.Probe'), condition('&:hover')], 'color', [
    [[condition('&:hover')], undefined, 'blue'],
  ]],
])
try {
  expect(compileCSS()).toMatch(
    /\.Probe\s*\{\s*&:hover\s*\{\s*&:hover\s*\{\s*color:\s*blue;\s*\}\s*\}\s*\}/
  )
} finally { handle.remove() }
```

这里两层&:hover都是显式普通地址，不按快捷状态名去重。Rules中的`'hover'`是字面标签选择器，`'&:hover'`是原生条件；只有Variable的states输入查询[状态快捷名](状态反馈与条件选择.md)。编译保留每层条件、重复条件和原有顺序，局部内容不能逃到外层。
