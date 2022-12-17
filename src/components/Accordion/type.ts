export type AccordionController = {
  open: () => void
  close: () => void
  toggle: () => void
  set(to: boolean): void
}
