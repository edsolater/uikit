# OKLCH 层级颜色函数设计草案

## 结论

这套颜色函数不是传统平面设计里的 `tint / shade`，而是面向前端主题系统的 **perceptual layer functions**。

核心目标：

> 在 light / dark / 智能颜色环境下，用统一词汇表达“颜色视觉层级的上升、下降、设定”，而不是固定趋白或趋黑。

---

## 核心函数

计划先设计三个函数：

```css
--raise(color, level)
--sink(color, level)
--layer(color, level)
```

| 函数          | 语义              | 类型       |
| ----------- | --------------- | -------- |
| `--raise()` | 基于当前颜色，让视觉层级上升  | 相对移动     |
| `--sink()`  | 基于当前颜色，让视觉层级下降  | 相对移动     |
| `--layer()` | 基于当前颜色，设定目标视觉层级 | 绝对/半绝对设定 |

---

## OKLCH 通道分工

内部只使用浏览器原生 OKLCH relative color syntax：

```css
oklch(from var(--color) l c h / alpha)
```

| 通道              | 作用        | 是否修改 |
| --------------- | --------- | ---- |
| `L` / lightness | 明度、视觉层级主轴 | 修改   |
| `C` / chroma    | 彩度、表达强度辅轴 | 小幅修改 |
| `H` / hue       | 色相、颜色身份   | 不修改  |
| `alpha`         | 透明度       | 不修改  |

核心纪律：

```text
L 是主轴。
C 是辅轴。
H 和 alpha 保持不变。
```

---

## level 语义

`level` 允许正数、负数和 0。

```text
-3 = strongly recessed
-2 = recessed
-1 = slightly recessed
 0 = original
 1 = slightly raised
 2 = raised
 3 = strongly raised
```

重要点：

```text
level 不是数学线性数值。
level 是 UI 感知层级。
```

---

## 明度变化规则

不推荐：

```css
l + amount
l - amount
```

更推荐：

```css
/* raise */
l + (1 - l) * step

/* sink */
l - l * step
```

含义：

```text
raise:
  离白越远，上升越明显。
  越接近白，上升越克制。

sink:
  离黑越远，下降越明显。
  越接近黑，下降越克制。
```

---

## 推荐 lightness 层级

```css
--l-0:  0.06; /* near black */
--l-1:  0.10;
--l-2:  0.14;
--l-3:  0.18;
--l-4:  0.24;
--l-5:  0.32;
--l-6:  0.42;
--l-7:  0.54;
--l-8:  0.66;
--l-9:  0.76;
--l-10: 0.84;
--l-11: 0.90;
--l-12: 0.94; /* near white */
```

压缩记忆：

```text
L = 0.10 暗背景
L = 0.14 暗表面
L = 0.18 暗浮层
L = 0.50 中性中点
L = 0.84 浅填充
L = 0.90 浅表面
L = 0.94 浅背景
```

---

## chroma 典型值

```css
--c-neutral: 0.00;
--c-soft:    0.02;
--c-tint:    0.04;
--c-weak:    0.06;
--c-normal:  0.10;
--c-strong:  0.15;
--c-vivid:   0.20;
--c-hot:     0.24;
```

粗略理解：

```text
0.00 = 灰
0.04 = 很轻
0.08 = 有颜色
0.12 = 正常 UI 色
0.16 = 明确语义色
0.20 = 很鲜艳
0.24+ = 强视觉强调
0.30+ = 谨慎
```

---

## raise/sink 中的 chroma 规则

层级变化主要由 `L` 完成，`C` 只做小幅补偿。

```text
raise:
  L 上升
  C 小幅上升或保持

sink:
  L 下降
  C 小幅下降
```

更具体：

```text
raise:
  deltaC = deltaL * 0.08 ~ 0.12

sink:
  deltaC = deltaL * 0.06 ~ 0.10
```

不要让 `C` 成为第二个主轴。

---

## 第一版伪代码

### raise

```css
@function --raise(
  --color <color>,
  --level <number>: 1
) returns <color> {
  --step: calc(0.06 * var(--level));

  result: oklch(
    from var(--color)
    clamp(0.06, calc(l + (1 - l) * var(--step)), 0.94)
    clamp(0, calc(c + (1 - l) * var(--step) * 0.10), 0.28)
    h
    / alpha
  );
}
```

### sink

```css
@function --sink(
  --color <color>,
  --level <number>: 1
) returns <color> {
  --step: calc(0.06 * var(--level));

  result: oklch(
    from var(--color)
    clamp(0.06, calc(l - l * var(--step)), 0.94)
    clamp(0, calc(c - l * var(--step) * 0.08), 0.28)
    h
    / alpha
  );
}
```

### layer

```css
@function --layer(
  --color <color>,
  --level <number>: 0
) returns <color> {
  --up: max(var(--level), 0);
  --down: max(calc(var(--level) * -1), 0);

  --up-step: calc(0.06 * var(--up));
  --down-step: calc(0.06 * var(--down));

  result: oklch(
    from var(--color)
    clamp(0.06, calc(
      l
      + (1 - l) * var(--up-step)
      - l * var(--down-step)
    ), 0.94)
    clamp(0, calc(
      c
      + (1 - l) * var(--up-step) * 0.10
      - l * var(--down-step) * 0.08
    ), 0.28)
    h
    / alpha
  );
}
```

注意：这是设计草案，不是最终代码实现。

---

## 暂定原则

```text
1. 不使用 tint / shade 作为主语义。
2. 使用 raise / sink / layer 表达视觉层级。
3. 内部只操作 OKLCH 的 L 和 C。
4. H 和 alpha 保持不变。
5. L 是层级主轴。
6. C 是表达强度辅轴。
7. level 是感知层级，不是线性数学值。
8. L 的变化要靠近边界时自然衰减。
9. C 的变化必须小于 L 的变化。
10. 第一版不处理复杂 gamut-aware 逻辑。
```

---

## 后续待讨论

```text
1. --layer() 是否应该是真正绝对层级，还是相对当前色的半绝对层级。
2. level 是否只允许整数，还是允许小数。
3. step 是否使用 token 表，而不是连续公式。
4. chroma 是否拆出独立 vivid/mute 函数。
5. raise/sink 是否应该允许只改 L，不自动补 C。
6. light/dark 下是否需要不同 step。
7. C 上限是否统一为 0.28，还是按 token 类型区分。
8. 是否需要 surface/content/line 三类不同 layer 曲线。
9. `--raise()` 用于 hover 时，是否应该比 selected 更克制。
10. `--sink()` 用于 active 时，是否应该同时轻微降低 alpha 或只动 L/C。
```

## 当前一句话版本

```text
raise / sink / layer 是基于 OKLCH 的前端视觉层级函数：
用 L 控制层级，用 C 轻微补偿表达强度，保持 H 与 alpha 不变；
它们替代传统 tint / shade，适配 light / dark / 智能颜色环境。
```

::: 
