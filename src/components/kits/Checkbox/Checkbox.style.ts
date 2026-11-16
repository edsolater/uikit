/**
 * Checkbox 的二态选项排列样式。
 *
 * 将原生勾选框与可点击标题沿行轴对齐，并提供统一间隔。
 *
 * 使选项组合直接具备可读的默认形态，标题和控件仍保留各自语义。
 */
import { componentName } from './Checkbox.prop'
import { rules } from '@/style-system'
rules(`.${componentName}`, {
  'display': 'flex',
  'gap': '.5rem',
  'align-items': 'center',
  'cursor': 'pointer',
})
