import type { Accessor } from 'solid-js'
import type { JSX } from 'solid-js/jsx-runtime'

const createDivElement: CreatePivElement<'div'> = (props) => (
  <div class={props.class} ref={props.ref}>
    {props.children}
  </div>
)
const createSpanElement: CreatePivElement<'span'> = (props) => (
  <span class={props.class} ref={props.ref}>
    {props.children}
  </span>
)
const createPElement: CreatePivElement<'p'> = (props) => (
  <p class={props.class} ref={props.ref}>
    {props.children}
  </p>
)
const createButtonElement: CreatePivElement<'button'> = (props) => (
  <button class={props.class} ref={props.ref}>
    {props.children}
  </button>
)
const createInputElement: CreatePivElement<'input'> = (props) => <input class={props.class} ref={props.ref} />
const createTextareaElement: CreatePivElement<'textarea'> = (props) => <textarea class={props.class} ref={props.ref} />
const createSelectElement: CreatePivElement<'select'> = (props) => (
  <select class={props.class} ref={props.ref}>
    {props.children}
  </select>
)
const createFormElement: CreatePivElement<'form'> = (props) => (
  <form class={props.class} ref={props.ref}>
    {props.children}
  </form>
)
const createSectionElement: CreatePivElement<'section'> = (props) => (
  <section class={props.class} ref={props.ref}>
    {props.children}
  </section>
)
const createArticleElement: CreatePivElement<'article'> = (props) => (
  <article class={props.class} ref={props.ref}>
    {props.children}
  </article>
)
const createHeaderElement: CreatePivElement<'header'> = (props) => (
  <header class={props.class} ref={props.ref}>
    {props.children}
  </header>
)
const createFooterElement: CreatePivElement<'footer'> = (props) => (
  <footer class={props.class} ref={props.ref}>
    {props.children}
  </footer>
)
const createMainElement: CreatePivElement<'main'> = (props) => (
  <main class={props.class} ref={props.ref}>
    {props.children}
  </main>
)
const createAsideElement: CreatePivElement<'aside'> = (props) => (
  <aside class={props.class} ref={props.ref}>
    {props.children}
  </aside>
)
const createLabelElement: CreatePivElement<'label'> = (props) => (
  <label class={props.class} ref={props.ref}>
    {props.children}
  </label>
)
const createH1Element: CreatePivElement<'h1'> = (props) => (
  <h1 class={props.class} ref={props.ref}>
    {props.children}
  </h1>
)
const createH2Element: CreatePivElement<'h2'> = (props) => (
  <h2 class={props.class} ref={props.ref}>
    {props.children}
  </h2>
)
const createH3Element: CreatePivElement<'h3'> = (props) => (
  <h3 class={props.class} ref={props.ref}>
    {props.children}
  </h3>
)
const createH4Element: CreatePivElement<'h4'> = (props) => (
  <h4 class={props.class} ref={props.ref}>
    {props.children}
  </h4>
)
const createH5Element: CreatePivElement<'h5'> = (props) => (
  <h5 class={props.class} ref={props.ref}>
    {props.children}
  </h5>
)
const createH6Element: CreatePivElement<'h6'> = (props) => (
  <h6 class={props.class} ref={props.ref}>
    {props.children}
  </h6>
)
const createNavElement: CreatePivElement<'nav'> = (props) => (
  <nav class={props.class} ref={props.ref}>
    {props.children}
  </nav>
)
const createUlElement: CreatePivElement<'ul'> = (props) => (
  <ul class={props.class} ref={props.ref}>
    {props.children}
  </ul>
)
const createLiElement: CreatePivElement<'li'> = (props) => (
  <li class={props.class} ref={props.ref}>
    {props.children}
  </li>
)
const createImgElement: CreatePivElement<'img'> = (props) => <img class={props.class} ref={props.ref} />
const createAElement: CreatePivElement<'a'> = (props) => (
  <a class={props.class} ref={props.ref}>
    {props.children}
  </a>
)
const createIframeElement: CreatePivElement<'iframe'> = (props) => <iframe class={props.class} ref={props.ref} />
const createSummaryElement: CreatePivElement<'summary'> = (props) => (
  <summary class={props.class} ref={props.ref}>
    {props.children}
  </summary>
)
const createDetailsElement: CreatePivElement<'details'> = (props) => (
  <details class={props.class} ref={props.ref}>
    {props.children}
  </details>
)
const createDialogElement: CreatePivElement<'dialog'> = (props) => (
  <dialog class={props.class} ref={props.ref}>
    {props.children}
  </dialog>
)
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
} as const
export type PivSupportedElementTag = keyof typeof domMap
export type CreatePivElement<Tag extends PivTag> = (props: Record<string, any>) => JSX.Element
export type PivElement<Tag extends PivTag> = HTMLElementTagNameMap[Tag]
export type PivTag = keyof HTMLElementTagNameMap
/** 只给 domMap */
export type ParsedPivProps<Tag extends PivTag> =  {
  class:Accessor<string> | undefined
  ref: (element: PivElement<Tag>) => void
  children: JSX.Element | undefined
}

