export type PivPlugin<Params=any> = ((element: Element, assess: Params) => void) | ((element: Element) => void)
