import { ICSS, ICSSObject } from '../../styles/parseCSS'

type CSSRowOptions = {
  gap?: ICSSObject['gap']
  justifyContent?: ICSSObject['justifyContent']
  justifyItems?: ICSSObject['justifyItems']
  content?: ICSSObject['alignContent']
  items?: ICSSObject['alignItems']
}
export function cssRow(options?: CSSRowOptions): ICSS {
  return {
    display: 'flex',
    gap: options?.gap,
    justifyContent: options?.justifyContent,
    justifyItems: options?.justifyItems,
    alignContent: options?.content,
    alignItems: options?.items
  }
}
