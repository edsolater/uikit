/** 标题与问号在行内排布；原生浮层独立定位，不占用字段高度。 */
import { key, rules } from '@/style-system'

rules(['.Label'], [
  [key('display'), 'inline-flex'],
  [key('align-items'), 'center'],
  [key('gap'), '4px'],
  [key('font-size'), '13px'],
  [key('line-height'), 1.2],
  [key('min-block-size'), '1lh'],
  [key('color'), '#64748b'],
  [key('min-width'), 0],
])
rules(['.Label', '> label'], [[key('cursor'), 'pointer']])
rules(['.Label', '> .help'], [
  [key('display'), 'inline-grid'], [key('place-items'), 'center'],
  [key('flex'), '0 0 auto'], [key('width'), '15px'], [key('height'), '15px'],
  [key('padding'), 0], [key('border'), '1px solid currentColor'],
  [key('border-radius'), '50%'], [key('background'), 'transparent'],
  [key('color'), 'inherit'], [key('font'), '11px system-ui'],
  [key('cursor'), 'help'],
])
rules(['.Label', '> .help:focus-visible'], [[key('outline'), '2px solid #93c5fd'], [key('outline-offset'), '2px']])
rules(['.Label', '> .help-content'], [
  [key('position'), 'fixed'], [key('inset'), 'auto'],
  [key('position-area'), 'top'], [key('position-try-fallbacks'), 'flip-block, flip-inline'],
  [key('margin'), '0 0 8px'], [key('width'), 'max-content'],
  [key('max-width'), 'min(320px, calc(100vw - 24px))'],
  [key('padding'), '10px 12px'], [key('border'), '1px solid #334155'],
  [key('border-radius'), '8px'], [key('background'), '#1e293b'],
  [key('color'), '#f8fafc'], [key('font'), '13px/1.6 system-ui'],
  [key('white-space'), 'normal'], [key('box-shadow'), '0 6px 20px #0f172a26'],
])
rules(['body:has(.StructureViewOverlay:popover-open) .Label > label'], [[key('visibility'), 'hidden']])
