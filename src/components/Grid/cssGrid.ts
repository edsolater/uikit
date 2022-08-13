import { ICSS, ICSSObject } from '../../styles'

type CSSGridOptions = {
  gap?: ICSSObject['gap']
  justifyContent?: ICSSObject['justifyContent']
  justifyItems?: ICSSObject['justifyItems']
  alignContent?: ICSSObject['alignContent']
  alignItems?: ICSSObject['alignItems']
  placeContent?: ICSSObject['placeContent']
  placeItem?: ICSSObject['placeItems']
  gridTemplate?: ICSSObject['gridTemplate']
  gridTemplateRow?: ICSSObject['gridTemplateRows']
  gridTemplateColumns?: ICSSObject['gridTemplateColumns']
}

export function cssGrid(options?: CSSGridOptions): ICSS {
  return {
    display: 'grid',
    gap: options?.gap,
    justifyContent: options?.justifyContent,
    justifyItems: options?.justifyItems,
    alignContent: options?.alignContent,
    alignItems: options?.alignItems,
    placeContent: options?.placeContent,
    placeItems: options?.placeItem,
    gridTemplate: options?.gridTemplate,
    gridTemplateRow: options?.gridTemplateRow,
    gridTemplateColumns: options?.gridTemplateColumns
  }
}
