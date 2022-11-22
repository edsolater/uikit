import { ICSS, ICSSObject } from '../../styles'

// export const cssCol = () => createICSS({ display: 'flex', flexDirection: 'column' });

type CSSColOptions = {
  gap?: ICSSObject['gap']
  justify?: ICSSObject['justifyContent']
  justifyItems?: ICSSObject['justifyItems']
  content?: ICSSObject['alignContent']
  items?: ICSSObject['alignItems']
}

export function cssCol(options?: CSSColOptions): ICSS {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: options?.gap,
    justifyContent: options?.justify,
    justifyItems: options?.justifyItems,
    alignContent: options?.content,
    alignItems: options?.items
  }
}
