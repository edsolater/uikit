/**
 * Piv 原生元素的 JSX 创建工厂；只创建裸元素，不执行初始化或插入 children。
 */
import type { JSX } from '@/foundation'

export const domMap = {
  div: () => (<div />) as PivHTMLElement<'div'>,
  span: () => (<span />) as PivHTMLElement<'span'>,
  p: () => (<p />) as PivHTMLElement<'p'>,
  button: () => (<button />) as PivHTMLElement<'button'>,
  input: () => (<input />) as PivHTMLElement<'input'>,
  textarea: () => (<textarea />) as PivHTMLElement<'textarea'>,
  select: () => (<select />) as PivHTMLElement<'select'>,
  option: () => (<option />) as PivHTMLElement<'option'>,
  form: () => (<form />) as PivHTMLElement<'form'>,
  section: () => (<section />) as PivHTMLElement<'section'>,
  article: () => (<article />) as PivHTMLElement<'article'>,
  header: () => (<header />) as PivHTMLElement<'header'>,
  footer: () => (<footer />) as PivHTMLElement<'footer'>,
  main: () => (<main />) as PivHTMLElement<'main'>,
  aside: () => (<aside />) as PivHTMLElement<'aside'>,
  label: () => (<label />) as PivHTMLElement<'label'>,
  h1: () => (<h1 />) as PivHTMLElement<'h1'>,
  h2: () => (<h2 />) as PivHTMLElement<'h2'>,
  h3: () => (<h3 />) as PivHTMLElement<'h3'>,
  h4: () => (<h4 />) as PivHTMLElement<'h4'>,
  h5: () => (<h5 />) as PivHTMLElement<'h5'>,
  h6: () => (<h6 />) as PivHTMLElement<'h6'>,
  nav: () => (<nav />) as PivHTMLElement<'nav'>,
  ul: () => (<ul />) as PivHTMLElement<'ul'>,
  li: () => (<li />) as PivHTMLElement<'li'>,
  table: () => (<table />) as PivHTMLElement<'table'>,
  thead: () => (<thead />) as PivHTMLElement<'thead'>,
  tbody: () => (<tbody />) as PivHTMLElement<'tbody'>,
  tr: () => (<tr />) as PivHTMLElement<'tr'>,
  th: () => (<th />) as PivHTMLElement<'th'>,
  td: () => (<td />) as PivHTMLElement<'td'>,
  img: () => (<img />) as PivHTMLElement<'img'>,
  a: () => (<a />) as PivHTMLElement<'a'>,
  iframe: () => (<iframe />) as PivHTMLElement<'iframe'>,
  summary: () => (<summary />) as PivHTMLElement<'summary'>,
  details: () => (<details />) as PivHTMLElement<'details'>,
  dialog: () => (<dialog />) as PivHTMLElement<'dialog'>,
  canvas: () => (<canvas />) as PivHTMLElement<'canvas'>,
  fieldset: () => (<fieldset />) as PivHTMLElement<'fieldset'>,
  legend: () => (<legend />) as PivHTMLElement<'legend'>,
  small: () => (<small />) as PivHTMLElement<'small'>,
  strong: () => (<strong />) as PivHTMLElement<'strong'>,
  dl: () => (<dl />) as PivHTMLElement<'dl'>,
  dt: () => (<dt />) as PivHTMLElement<'dt'>,
  dd: () => (<dd />) as PivHTMLElement<'dd'>,
  ol: () => (<ol />) as PivHTMLElement<'ol'>,
  br: () => (<br />) as PivHTMLElement<'br'>,
}

export type PivSupportedElementTag = keyof typeof domMap
export type PivTag = Extract<
  keyof JSX.IntrinsicElements,
  keyof HTMLElementTagNameMap
>
export type PivHTMLElement<Tag extends PivTag> = HTMLElementTagNameMap[Tag]
export type CreatePivElement<Tag extends PivTag> = () => PivHTMLElement<Tag>
