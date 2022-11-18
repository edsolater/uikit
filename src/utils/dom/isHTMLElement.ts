export function isHTMLElement(value: any): value is HTMLElement {
  return value !== null && typeof value === 'object' && Boolean((value as { tagName: string }).tagName)
}
export function isHTMLDivElement(value: any): value is HTMLDivElement {
  return isHTMLElement(value) && value.tagName === 'DIV'
}
