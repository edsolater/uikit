import { isHTMLElement, isRefObject, MayRef } from '..'

export function getSiblings(self: MayRef<HTMLElement | undefined | null>) {
  const el = isRefObject(self) ? self.current : self
  return el ? getOtherSublingsFromEl(el) : []
}

function getOtherSublingsFromEl(el: HTMLElement) {
  return Array.from(el.parentElement?.querySelectorAll(':scope>*') ?? [])
    .filter((i) => isHTMLElement(i))
    .filter((i) => i !== el) as HTMLElement[]
}
