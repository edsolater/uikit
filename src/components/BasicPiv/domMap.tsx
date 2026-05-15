/**
 * 这个文件定义 Piv 支持的原生 tag 到 JSX 模板的映射。
 * 它只负责创建元素、绑定 richRef 和插入 children，不消费 class、style、HTML props、事件或 plugin。
 * 如果要新增 Piv 支持的 tag，应在这里补充模板，并让 PivSupportedElementTag 自动收敛。
 */
import type { JSX } from 'solid-js/jsx-runtime'

const createDivElement: CreatePivElement<'div'> = (props) => <div ref={props.richRef}>{props.children}</div>
const createSpanElement: CreatePivElement<'span'> = (props) => <span ref={props.richRef}>{props.children}</span>
const createPElement: CreatePivElement<'p'> = (props) => <p ref={props.richRef}>{props.children}</p>
const createButtonElement: CreatePivElement<'button'> = (props) => <button ref={props.richRef}>{props.children}</button>
const createInputElement: CreatePivElement<'input'> = (props) => <input ref={props.richRef} />
const createTextareaElement: CreatePivElement<'textarea'> = (props) => <textarea ref={props.richRef} />
const createSelectElement: CreatePivElement<'select'> = (props) => <select ref={props.richRef}>{props.children}</select>
const createFormElement: CreatePivElement<'form'> = (props) => <form ref={props.richRef}>{props.children}</form>
const createSectionElement: CreatePivElement<'section'> = (props) => (
  <section ref={props.richRef}>{props.children}</section>
)
const createArticleElement: CreatePivElement<'article'> = (props) => (
  <article ref={props.richRef}>{props.children}</article>
)
const createHeaderElement: CreatePivElement<'header'> = (props) => <header ref={props.richRef}>{props.children}</header>
const createFooterElement: CreatePivElement<'footer'> = (props) => <footer ref={props.richRef}>{props.children}</footer>
const createMainElement: CreatePivElement<'main'> = (props) => <main ref={props.richRef}>{props.children}</main>
const createAsideElement: CreatePivElement<'aside'> = (props) => <aside ref={props.richRef}>{props.children}</aside>
const createLabelElement: CreatePivElement<'label'> = (props) => <label ref={props.richRef}>{props.children}</label>
const createH1Element: CreatePivElement<'h1'> = (props) => <h1 ref={props.richRef}>{props.children}</h1>
const createH2Element: CreatePivElement<'h2'> = (props) => <h2 ref={props.richRef}>{props.children}</h2>
const createH3Element: CreatePivElement<'h3'> = (props) => <h3 ref={props.richRef}>{props.children}</h3>
const createH4Element: CreatePivElement<'h4'> = (props) => <h4 ref={props.richRef}>{props.children}</h4>
const createH5Element: CreatePivElement<'h5'> = (props) => <h5 ref={props.richRef}>{props.children}</h5>
const createH6Element: CreatePivElement<'h6'> = (props) => <h6 ref={props.richRef}>{props.children}</h6>
const createNavElement: CreatePivElement<'nav'> = (props) => <nav ref={props.richRef}>{props.children}</nav>
const createUlElement: CreatePivElement<'ul'> = (props) => <ul ref={props.richRef}>{props.children}</ul>
const createLiElement: CreatePivElement<'li'> = (props) => <li ref={props.richRef}>{props.children}</li>
const createImgElement: CreatePivElement<'img'> = (props) => <img ref={props.richRef} />
const createAElement: CreatePivElement<'a'> = (props) => <a ref={props.richRef}>{props.children}</a>
const createIframeElement: CreatePivElement<'iframe'> = (props) => <iframe ref={props.richRef} />
const createSummaryElement: CreatePivElement<'summary'> = (props) => (
  <summary ref={props.richRef}>{props.children}</summary>
)
const createDetailsElement: CreatePivElement<'details'> = (props) => (
  <details ref={props.richRef}>{props.children}</details>
)
const createDialogElement: CreatePivElement<'dialog'> = (props) => <dialog ref={props.richRef}>{props.children}</dialog>
export const domMap = {
  div: createDivElement,
  span: createSpanElement,
  p: createPElement,
  button: createButtonElement,
  input: createInputElement,
  textarea: createTextareaElement,
  select: createSelectElement,
  form: createFormElement,
  section: createSectionElement,
  article: createArticleElement,
  header: createHeaderElement,
  footer: createFooterElement,
  main: createMainElement,
  aside: createAsideElement,
  label: createLabelElement,
  h1: createH1Element,
  h2: createH2Element,
  h3: createH3Element,
  h4: createH4Element,
  h5: createH5Element,
  h6: createH6Element,
  nav: createNavElement,
  ul: createUlElement,
  li: createLiElement,
  img: createImgElement,
  a: createAElement,
  iframe: createIframeElement,
  summary: createSummaryElement,
  details: createDetailsElement,
  dialog: createDialogElement,
} satisfies Partial<Record<PivTag, CreatePivElement<any>>>
export type PivSupportedElementTag = keyof typeof domMap
export type CreatePivElement<Tag extends PivTag> = (props: ParsedPivProps<Tag>) => JSX.Element
export type PivHTMLElement<Tag extends PivTag> = HTMLElementTagNameMap[Tag]
export type PivTag = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements
/** 只给 domMap */
export type ParsedPivProps<Tag extends PivTag> = {
  richRef: (element: PivHTMLElement<Tag>) => void
  children: JSX.Element | undefined
}
