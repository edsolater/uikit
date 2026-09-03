/** 定义 Button 的组件样式，并提供浏览器端注册入口。 */
import { createCSSStyleSheetText, cssRule, registerCSS, type CSSDeclarations } from '../../plugins/utils/cssRegisterer'

export const buttonStyleURL = import.meta.url

// 组件槽位承接全局 token，并由后续规则按交互状态和组件属性覆盖。
const buttonCSSVariables = {
  '--Button-neutral-bg': 'var(--dye-neutral-1)',
  '--Button-neutral-bg-hover': 'var(--dye-neutral-2)',
  '--Button-neutral-bg-active': 'var(--dye-neutral-3)',

  '--Button-bg-rest': 'color-mix(in oklab, var(--Button-neutral-bg) 82%, var(--color-accent-soft))',
  '--Button-bg-hover': 'color-mix(in oklab, var(--Button-neutral-bg-hover) 72%, var(--color-accent-soft))',
  '--Button-bg-active': 'color-mix(in oklab, var(--Button-neutral-bg-active) 62%, var(--color-accent-soft))',
  '--Button-bg': 'var(--Button-bg-rest)',
  '--Button-fg-rest': 'var(--color-fg)',
  '--Button-fg-hover': 'var(--color-fg-strong)',
  '--Button-fg-active': 'var(--color-fg-strong)',
  '--Button-fg': 'var(--Button-fg-rest)',
  '--Button-border': 'transparent',
  '--Button-border-hover': 'transparent',
  '--Button-border-active': 'transparent',
  '--Button-focus-ring': 'var(--color-accent-focus)',
  '--Button-shadow': 'var(--shadow-1)',
  '--Button-shadow-hover': 'var(--shadow-2)',
  '--Button-shadow-active': 'var(--shadow-0)',

  '--Button-border-width': 'var(--boundary-1)',
  '--Button-min-height': 'var(--size-5)',
  '--Button-padding-x': 'var(--space-6)',
  '--Button-padding-y': 'var(--space-3)',
  '--Button-gap': 'var(--space-3)',
  '--Button-font-size': 'var(--font-size-lg)',
  '--Button-active-offset': 'var(--boundary-1)',
  '--Button-focus-width': 'var(--boundary-2)',
  '--Button-focus-offset': 'var(--boundary-2)',
} satisfies CSSDeclarations

const baseRules = [
  cssRule('.Button', {
    ...buttonCSSVariables,
    'display': 'inline-flex',
    'align-items': 'center',
    'align-self': 'center',
    'justify-content': 'center',
    'gap': 'var(--Button-gap)',
    'min-height': 'var(--Button-min-height)',
    'border': 'var(--Button-border-width) solid var(--Button-border)',
    'box-shadow': 'var(--Button-shadow)',
    'border-radius': '999px',
    'corner-shape': 'squircle',
    'padding': 'var(--Button-padding-y) var(--Button-padding-x)',
    'color': 'var(--Button-fg)',
    'font': 'inherit',
    'font-size': 'var(--Button-font-size)',
    'font-weight': 'bold',
    'line-height': '1',
    'background-color': 'var(--Button-bg)',
    'cursor': 'pointer',
    'user-select': 'none',
    'transition': `background-color var(--motion-duration-fast) var(--motion-ease-standard),
      box-shadow var(--motion-duration-fast) var(--motion-ease-standard),
      transform var(--motion-duration-fast) var(--motion-ease-standard),
      border-color var(--motion-duration-fast) var(--motion-ease-standard),
      color var(--motion-duration-fast) var(--motion-ease-standard),
      opacity var(--motion-duration-fast) var(--motion-ease-standard)`,
  }),
]

const interactionRules = [
  cssRule('.Button:hover:not(:disabled)', {
    'background-color': 'var(--Button-bg-hover)',
    'color': 'var(--Button-fg-hover)',
    '--Button-border': 'var(--Button-border-hover)',
    '--Button-shadow': 'var(--Button-shadow-hover)',
  }),

  cssRule('.Button:active:not(:disabled)', {
    'background-color': 'var(--Button-bg-active)',
    'color': 'var(--Button-fg-active)',
    '--Button-border': 'var(--Button-border-active)',
    '--Button-shadow': 'var(--Button-shadow-active)',
    'transform': 'translateY(var(--Button-active-offset))',
  }),

  cssRule('.Button:focus-visible', {
    'outline': 'var(--Button-focus-width) solid var(--Button-focus-ring)',
    'outline-offset': 'var(--Button-focus-offset)',
  }),
]

const variantRules = [
  // variant="bare"：低权重的退场动作。
  cssRule(".Button[data-variant='bare']", {
    '--Button-bg-rest': 'transparent',
    '--Button-bg': 'var(--Button-bg-rest)',
    '--Button-bg-hover': 'color-mix(in oklab, var(--Button-neutral-bg) 88%, var(--color-accent-soft))',
    '--Button-bg-active': 'color-mix(in oklab, var(--Button-neutral-bg-hover) 82%, var(--color-accent-soft))',
    '--Button-fg-rest': 'var(--color-fg)',
    '--Button-fg': 'var(--Button-fg-rest)',
    '--Button-fg-hover': 'var(--color-fg-strong)',
    '--Button-fg-active': 'var(--color-fg-strong)',
    '--Button-border': 'transparent',
    '--Button-border-hover': 'transparent',
    '--Button-border-active': 'transparent',
    '--Button-shadow': 'none',
    '--Button-shadow-hover': 'none',
    '--Button-shadow-active': 'none',
  }),

  // variant="solid"：需要优先被看见的强调动作。
  cssRule(".Button[data-variant='solid']", {
    '--Button-bg-rest': 'var(--color-action)',
    '--Button-bg': 'var(--Button-bg-rest)',
    '--Button-bg-hover': 'var(--color-action-hover)',
    '--Button-bg-active': 'var(--color-action-active)',
    '--Button-fg-rest': 'color-mix(in oklab, var(--color-action-fg) 90%, var(--Button-bg-rest))',
    '--Button-fg': 'var(--Button-fg-rest)',
    '--Button-fg-hover': 'var(--color-action-fg)',
    '--Button-fg-active': 'var(--color-action-fg)',
    '--Button-border': 'transparent',
    '--Button-border-hover': 'transparent',
    '--Button-border-active': 'transparent',
    '--Button-focus-ring': 'var(--color-action-line)',
    '--Button-shadow': 'var(--shadow-2)',
    '--Button-shadow-hover': 'var(--shadow-3)',
    '--Button-shadow-active': 'var(--shadow-0)',
  }),
]

const toneRules = [
  // tone="accent"：当前流程推荐执行的动作。
  cssRule(".Button[data-tone='accent']", {
    '--Button-tone-color': 'var(--color-accent)',
    '--Button-tone-soft': 'var(--color-accent-soft)',
    '--Button-tone-strong': 'var(--color-accent-strong)',
    '--Button-tone-fg': 'var(--color-accent-fg)',
    '--Button-tone-line': 'var(--color-accent-focus)',
  }),

  // tone="danger"：删除、重置等破坏性动作。
  cssRule(".Button[data-tone='danger']", {
    '--Button-tone-color': 'var(--color-bad)',
    '--Button-tone-soft': 'var(--color-bad-soft)',
    '--Button-tone-strong': 'var(--color-bad)',
    '--Button-tone-fg': 'var(--color-bad-fg)',
    '--Button-tone-line': 'var(--color-bad-line)',
  }),

  // tone 只替换语义颜色，variant 继续决定动作声量。
  cssRule('.Button[data-tone]', {
    '--Button-bg-rest': 'color-mix(in oklab, var(--Button-neutral-bg) 76%, var(--Button-tone-soft))',
    '--Button-bg': 'var(--Button-bg-rest)',
    '--Button-bg-hover': 'color-mix(in oklab, var(--Button-neutral-bg-hover) 68%, var(--Button-tone-soft))',
    '--Button-bg-active': 'color-mix(in oklab, var(--Button-neutral-bg-active) 58%, var(--Button-tone-soft))',
    '--Button-fg-rest': 'var(--Button-tone-strong)',
    '--Button-fg': 'var(--Button-fg-rest)',
    '--Button-fg-hover': 'var(--Button-tone-strong)',
    '--Button-fg-active': 'var(--Button-tone-strong)',
    '--Button-focus-ring': 'var(--Button-tone-line)',
  }),

  // bare 与 tone 组合时仍保持退场形态。
  cssRule(".Button[data-variant='bare'][data-tone]", {
    '--Button-bg-rest': 'transparent',
    '--Button-bg': 'var(--Button-bg-rest)',
    '--Button-bg-hover': 'color-mix(in oklab, var(--Button-neutral-bg) 82%, var(--Button-tone-soft))',
    '--Button-bg-active': 'color-mix(in oklab, var(--Button-neutral-bg-hover) 74%, var(--Button-tone-soft))',
  }),

  // solid 与 tone 组合时仍保持强调形态。
  cssRule(".Button[data-variant='solid'][data-tone]", {
    '--Button-bg-rest': 'var(--Button-tone-color)',
    '--Button-bg': 'var(--Button-bg-rest)',
    '--Button-bg-hover': 'color-mix(in oklab, var(--Button-tone-color) 88%, var(--color-fg-strong))',
    '--Button-bg-active': 'color-mix(in oklab, var(--Button-tone-color) 78%, var(--color-fg-strong))',
    '--Button-fg-rest': 'color-mix(in oklab, var(--Button-tone-fg) 90%, var(--Button-bg-rest))',
    '--Button-fg': 'var(--Button-fg-rest)',
    '--Button-fg-hover': 'var(--Button-tone-fg)',
    '--Button-fg-active': 'var(--Button-tone-fg)',
  }),
]

const sizeRules = [
  // size="small"：工具栏、表格行等高密度区域。
  cssRule(".Button[data-size='small']", {
    '--Button-min-height': 'var(--size-3)',
    '--Button-padding-x': 'var(--space-4)',
    '--Button-padding-y': 'var(--space-2)',
    '--Button-gap': 'var(--space-2)',
    '--Button-font-size': 'var(--font-size-md)',
  }),

  // size="large"：主行动区和触控优先区域。
  cssRule(".Button[data-size='large']", {
    '--Button-min-height': 'var(--size-7)',
    '--Button-padding-x': 'var(--space-7)',
    '--Button-padding-y': 'var(--space-3)',
    '--Button-gap': 'var(--space-4)',
    '--Button-font-size': 'var(--font-size-xl)',
  }),

  // size="xlarge"：需要更大命中面积的主入口。
  cssRule(".Button[data-size='xlarge']", {
    '--Button-min-height': 'var(--size-8)',
    '--Button-padding-x': 'var(--space-8)',
    '--Button-padding-y': 'var(--space-4)',
    '--Button-gap': 'var(--space-5)',
    '--Button-font-size': 'var(--font-size-2xl)',
  }),
]

const statusRules = [
  // status="loading"：动作已触发，正在等待结果。
  cssRule(".Button[data-status~='loading']", {
    cursor: 'progress',
  }),

  // disabled 最终覆盖所有 variant 与 tone 组合，避免组合样式恢复可交互外观。
  cssRule(
    [
      '.Button:disabled',
      ".Button[data-status~='disabled']",
      '.Button[data-variant]:disabled',
      ".Button[data-variant][data-status~='disabled']",
      '.Button[data-tone]:disabled',
      ".Button[data-tone][data-status~='disabled']",
      '.Button[data-variant][data-tone]:disabled',
      ".Button[data-variant][data-tone][data-status~='disabled']",
    ].join(',\n'),
    {
      '--Button-bg': 'color-mix(in oklab, var(--Button-bg-rest) 48%, var(--dye-neutral-2))',
      '--Button-bg-hover': 'var(--Button-bg)',
      '--Button-bg-active': 'var(--Button-bg)',
      '--Button-fg': 'color-mix(in oklab, var(--Button-fg-rest) 48%, transparent)',
      '--Button-fg-hover': 'var(--Button-fg)',
      '--Button-fg-active': 'var(--Button-fg)',
      '--Button-border': 'transparent',
      '--Button-shadow': 'none',
      'cursor': 'not-allowed',
    },
  ),
]

const buttonStyleText = createCSSStyleSheetText({
  layer: 'uikit',
  // 数组顺序就是样式覆盖顺序，新增规则时不要按名称重新排序。
  rules: [...baseRules, ...interactionRules, ...variantRules, ...toneRules, ...sizeRules, ...statusRules],
})

/** 在浏览器端注册 Button 样式；SSR 时跳过，重复调用仍只保留一份。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  registerCSS(document, buttonStyleURL, buttonStyleText)
}
