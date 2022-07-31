import { ICSS, ICSSObject } from '../../styles'

type CSSGridOptions = {
  gap?: ICSSObject['gap']
  justify?: ICSSObject['justifyContent']
  justifyItems?: ICSSObject['justifyItems']
  content?: ICSSObject['alignContent']
  items?: ICSSObject['alignItems']
}

export function cssGrid(options?: CSSGridOptions): ICSS {
  return {
    display: 'grid',
    gap: options?.gap,
    justifyContent: options?.justify,
    justifyItems: options?.justifyItems,
    alignContent: options?.content,
    alignItems: options?.items
  }
}
