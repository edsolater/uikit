import type { JSX } from 'solid-js/jsx-runtime'

const createDivElement: createPivElement<'div'> = (props) => (
  <div class={props.class} ref={props.ref}>
    {props.children}
  </div>
)
const createSpanElement: createPivElement<'span'> = (props) => (
  <span class={props.class} ref={props.ref}>
    {props.children}
  </span>
)
const createPElement: createPivElement<'p'> = (props) => (
  <p class={props.class} ref={props.ref}>
    {props.children}
  </p>
)
const createButtonElement: createPivElement<'button'> = (props) => (
  <button class={props.class} ref={props.ref}>
    {props.children}
  </button>
)
const createInputElement: createPivElement<'input'> = (props) => <input class={props.class} ref={props.ref} />
const createTextareaElement: createPivElement<'textarea'> = (props) => <textarea class={props.class} ref={props.ref} />
const createSelectElement: createPivElement<'select'> = (props) => (
  <select class={props.class} ref={props.ref}>
    {props.children}
  </select>
)
const createFormElement: createPivElement<'form'> = (props) => (
  <form class={props.class} ref={props.ref}>
    {props.children}
  </form>
)
const createSectionElement: createPivElement<'section'> = (props) => (
  <section class={props.class} ref={props.ref}>
    {props.children}
  </section>
)
const createArticleElement: createPivElement<'article'> = (props) => (
  <article class={props.class} ref={props.ref}>
    {props.children}
  </article>
)
const createHeaderElement: createPivElement<'header'> = (props) => (
  <header class={props.class} ref={props.ref}>
    {props.children}
  </header>
)
const createFooterElement: createPivElement<'footer'> = (props) => (
  <footer class={props.class} ref={props.ref}>
    {props.children}
  </footer>
)
const createMainElement: createPivElement<'main'> = (props) => (
  <main class={props.class} ref={props.ref}>
    {props.children}
  </main>
)
const createAsideElement: createPivElement<'aside'> = (props) => (
  <aside class={props.class} ref={props.ref}>
    {props.children}
  </aside>
)
const createLabelElement: createPivElement<'label'> = (props) => (
  <label class={props.class} ref={props.ref}>
    {props.children}
  </label>
)
const createH1Element: createPivElement<'h1'> = (props) => (
  <h1 class={props.class} ref={props.ref}>
    {props.children}
  </h1>
)
const createH2Element: createPivElement<'h2'> = (props) => (
  <h2 class={props.class} ref={props.ref}>
    {props.children}
  </h2>
)
const createH3Element: createPivElement<'h3'> = (props) => (
  <h3 class={props.class} ref={props.ref}>
    {props.children}
  </h3>
)
const createH4Element: createPivElement<'h4'> = (props) => (
  <h4 class={props.class} ref={props.ref}>
    {props.children}
  </h4>
)
const createH5Element: createPivElement<'h5'> = (props) => (
  <h5 class={props.class} ref={props.ref}>
    {props.children}
  </h5>
)
const createH6Element: createPivElement<'h6'> = (props) => (
  <h6 class={props.class} ref={props.ref}>
    {props.children}
  </h6>
)
const createNavElement: createPivElement<'nav'> = (props) => (
  <nav class={props.class} ref={props.ref}>
    {props.children}
  </nav>
)
const createUlElement: createPivElement<'ul'> = (props) => (
  <ul class={props.class} ref={props.ref}>
    {props.children}
  </ul>
)
const createLiElement: createPivElement<'li'> = (props) => (
  <li class={props.class} ref={props.ref}>
    {props.children}
  </li>
)
const createImgElement: createPivElement<'img'> = (props) => <img class={props.class} ref={props.ref} />
const createAElement: createPivElement<'a'> = (props) => (
  <a class={props.class} ref={props.ref}>
    {props.children}
  </a>
)
const createIframeElement: createPivElement<'iframe'> = (props) => <iframe class={props.class} ref={props.ref} />
const createSummaryElement: createPivElement<'summary'> = (props) => (
  <summary class={props.class} ref={props.ref}>
    {props.children}
  </summary>
)
const createDetailsElement: createPivElement<'details'> = (props) => (
  <details class={props.class} ref={props.ref}>
    {props.children}
  </details>
)
const createDialogElement: createPivElement<'dialog'> = (props) => (
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
export type createPivElement<Tag extends PivTag> = (props: Record<string, any>) => JSX.Element
export type PivElement<Tag extends PivTag> = HTMLElementTagNameMap[Tag]
export type PivTag = keyof HTMLElementTagNameMap
