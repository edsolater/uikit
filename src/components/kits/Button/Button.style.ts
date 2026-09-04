/** 定义 Button 的组件样式，并提供浏览器端注册入口。 */
import { cssColorMix } from '../../plugins/utils/css-web-utils'
import { registCssVariable } from '../../plugins/utils/css-variable'
import { createCSSStyleSheetText, registerCSS } from '../../plugins/utils/css-stylesheet'
import { cssRule } from '../../plugins/utils/css-rule'
import { type CSSDeclarations } from '../../plugins/utils/css-declararion'

export const buttonStyleURL = import.meta.url

// 组件槽位承接全局 token，并由后续规则按交互状态和组件属性覆盖。
const buttonCSSVariables = {
  '--surface-color': 'var(--dye-neutral-1)',
  '--surface-color-hover': 'var(--dye-neutral-2)',
  '--surface-color-active': 'var(--dye-neutral-3)',

  // '--bg-default': 'color-mix(in oklab, var(--surface-color) 82%, var(--color-accent-soft))',
  // '--bg-hover': 'color-mix(in oklab, var(--surface-color-hover) 72%, var(--color-accent-soft))',
  // '--bg-active': 'color-mix(in oklab, var(--surface-color-active) 62%, var(--color-accent-soft))',

  
  '--border': 'transparent',
  '--border-hover': 'transparent',
  '--border-active': 'transparent',
  '--focus-ring': 'var(--color-accent-focus)',
  '--shadow': 'var(--shadow-1)',
  '--shadow-hover': 'var(--shadow-2)',
  '--shadow-active': 'var(--shadow-0)',

  '--border-width': 'var(--boundary-1)',
  '--min-height': 'var(--size-5)',
  '--padding-x': 'var(--space-6)',
  '--padding-y': 'var(--space-3)',
  '--gap': 'var(--space-3)',
  '--font-size': 'var(--font-size-lg)',
  '--active-offset': 'var(--boundary-1)',
  '--focus-width': 'var(--boundary-2)',
  '--focus-offset': 'var(--boundary-2)',
} as const

const baseRules = [
  cssRule('.Button', {
    'display': 'inline-flex',
    'align-items': 'center',
    'align-self': 'center',
    'justify-content': 'center',
    'gap': 'var(--gap)',
    'min-height': 'var(--min-height)',
    'border': 'var(--border-width) solid var(--border)',
    'box-shadow': 'var(--shadow)',
    'border-radius': '999px',
    'corner-shape': 'squircle',
    'padding': 'var(--padding-y) var(--padding-x)',
    'color': 'var(--fg)',
    'font': 'inherit',
    'font-size': 'var(--font-size)',
    'font-weight': 'bold',
    'line-height': '1',
    'background-color': 'var(--bg)',
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
    'background-color': 'var(--bg-hover)',
    'color': 'var(--fg-hover)',
    '--border': 'var(--border-hover)',
    '--shadow': 'var(--shadow-hover)',
  }),

  cssRule('.Button:active:not(:disabled)', {
    'background-color': 'var(--bg-active)',
    'color': 'var(--fg-active)',
    '--border': 'var(--border-active)',
    '--shadow': 'var(--shadow-active)',
    'transform': 'translateY(var(--active-offset))',
  }),

  cssRule('.Button:focus-visible', {
    'outline': 'var(--focus-width) solid var(--focus-ring)',
    'outline-offset': 'var(--focus-offset)',
  }),
]

const variantRules = [
  // variant="bare"：低权重的退场动作。
  cssRule(".Button[data-variant='bare']", {
    '--bg': 'transparent',
    '--bg': 'var(--bg)',
    '--bg-hover': 'color-mix(in oklab, var(--surface-color) 88%, var(--color-accent-soft))',
    '--bg-active': 'color-mix(in oklab, var(--surface-color-hover) 82%, var(--color-accent-soft))',
    '--fg-rest': 'var(--color-fg)',
    '--fg': 'var(--fg-rest)',
    '--fg-hover': 'var(--color-fg-strong)',
    '--fg-active': 'var(--color-fg-strong)',
    '--border': 'transparent',
    '--border-hover': 'transparent',
    '--border-active': 'transparent',
    '--shadow': 'none',
    '--shadow-hover': 'none',
    '--shadow-active': 'none',
  }),

  // variant="solid"：需要优先被看见的强调动作。
  cssRule(".Button[data-variant='solid']", {
    '--bg': 'var(--color-action)',
    '--bg': 'var(--bg)',
    '--bg-hover': 'var(--color-action-hover)',
    '--bg-active': 'var(--color-action-active)',
    '--fg-rest': 'color-mix(in oklab, var(--color-action-fg) 90%, var(--bg))',
    '--fg': 'var(--fg-rest)',
    '--fg-hover': 'var(--color-action-fg)',
    '--fg-active': 'var(--color-action-fg)',
    '--border': 'transparent',
    '--border-hover': 'transparent',
    '--border-active': 'transparent',
    '--focus-ring': 'var(--color-action-line)',
    '--shadow': 'var(--shadow-2)',
    '--shadow-hover': 'var(--shadow-3)',
    '--shadow-active': 'var(--shadow-0)',
  }),
]

const toneRules = [
  // tone="accent"：当前流程推荐执行的动作。
  cssRule(".Button[data-tone='accent']", {
    '--tone-color': 'var(--color-accent)',
    '--tone-soft': 'var(--color-accent-soft)',
    '--tone-strong': 'var(--color-accent-strong)',
    '--tone-fg': 'var(--color-accent-fg)',
    '--tone-line': 'var(--color-accent-focus)',
  }),

  // tone="danger"：删除、重置等破坏性动作。
  cssRule(".Button[data-tone='danger']", {
    '--tone-color': 'var(--color-bad)',
    '--tone-soft': 'var(--color-bad-soft)',
    '--tone-strong': 'var(--color-bad)',
    '--tone-fg': 'var(--color-bad-fg)',
    '--tone-line': 'var(--color-bad-line)',
  }),

  // tone 只替换语义颜色，variant 继续决定动作声量。
  cssRule('.Button[data-tone]', {
    '--bg': 'color-mix(in oklab, var(--surface-color) 76%, var(--tone-soft))',
    '--bg': 'var(--bg)',
    '--bg-hover': 'color-mix(in oklab, var(--surface-color-hover) 68%, var(--tone-soft))',
    '--bg-active': 'color-mix(in oklab, var(--surface-color-active) 58%, var(--tone-soft))',
    '--fg-rest': 'var(--tone-strong)',
    '--fg': 'var(--fg-rest)',
    '--fg-hover': 'var(--tone-strong)',
    '--fg-active': 'var(--tone-strong)',
    '--focus-ring': 'var(--tone-line)',
  }),

  // bare 与 tone 组合时仍保持退场形态。
  cssRule(".Button[data-variant='bare'][data-tone]", {
    '--bg': 'transparent',
    '--bg': 'var(--bg)',
    '--bg-hover': 'color-mix(in oklab, var(--surface-color) 82%, var(--tone-soft))',
    '--bg-active': 'color-mix(in oklab, var(--surface-color-hover) 74%, var(--tone-soft))',
  }),

  // solid 与 tone 组合时仍保持强调形态。
  cssRule(".Button[data-variant='solid'][data-tone]", {
    '--bg': 'var(--tone-color)',
    '--bg': 'var(--bg)',
    '--bg-hover': 'color-mix(in oklab, var(--tone-color) 88%, var(--color-fg-strong))',
    '--bg-active': 'color-mix(in oklab, var(--tone-color) 78%, var(--color-fg-strong))',
    '--fg-rest': 'color-mix(in oklab, var(--tone-fg) 90%, var(--bg))',
    '--fg': 'var(--fg-rest)',
    '--fg-hover': 'var(--tone-fg)',
    '--fg-active': 'var(--tone-fg)',
  }),
]

const sizeRules = [
  // size="small"：工具栏、表格行等高密度区域。
  cssRule(".Button[data-size='small']", {
    '--min-height': 'var(--size-3)',
    '--padding-x': 'var(--space-4)',
    '--padding-y': 'var(--space-2)',
    '--gap': 'var(--space-2)',
    '--font-size': 'var(--font-size-md)',
  }),

  // size="large"：主行动区和触控优先区域。
  cssRule(".Button[data-size='large']", {
    '--min-height': 'var(--size-7)',
    '--padding-x': 'var(--space-7)',
    '--padding-y': 'var(--space-3)',
    '--gap': 'var(--space-4)',
    '--font-size': 'var(--font-size-xl)',
  }),

  // size="xlarge"：需要更大命中面积的主入口。
  cssRule(".Button[data-size='xlarge']", {
    '--min-height': 'var(--size-8)',
    '--padding-x': 'var(--space-8)',
    '--padding-y': 'var(--space-4)',
    '--gap': 'var(--space-5)',
    '--font-size': 'var(--font-size-2xl)',
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
      '--bg': 'color-mix(in oklab, var(--bg) 48%, var(--dye-neutral-2))',
      '--bg-hover': 'var(--bg)',
      '--bg-active': 'var(--bg)',
      '--fg': 'color-mix(in oklab, var(--fg-rest) 48%, transparent)',
      '--fg-hover': 'var(--fg)',
      '--fg-active': 'var(--fg)',
      '--border': 'transparent',
      '--shadow': 'none',
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
