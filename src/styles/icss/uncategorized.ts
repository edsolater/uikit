import { cssSelectedStateColor, cssColors, cssSize } from '../cssValues'
import { ICSSObject, createICSS } from '../parseCSS'
import { CSSStyle } from '../type'

export const icssGridTemplate = ({ itemMinWidth = '0' }: { itemMinWidth: string }) => ({
  gridTemplateColumns: `repeat(auto-fit, minmax(${itemMinWidth}, 1fr))`
})

export const icssStateRecipes = (state?: 'selected') => ({
  backgroundColor: state ? cssSelectedStateColor : undefined
})

export const icssSelected: ICSSObject = {
  backgroundColor: cssColors.cardSelected,
  cursor: 'default'
}

export const icssSelectable: ICSSObject = {
  cursor: 'pointer',
  ':hover': { backdropFilter: 'brightness(.95)' }
}

export const icssClickable: ICSSObject = {
  cursor: 'pointer',
  ':hover': { backdropFilter: 'brightness(.95)' }
}

export const icssNotClickable: ICSSObject = {
  cursor: undefined,
  ':hover': { backdropFilter: undefined }
}

export const icssRecipeCol = (options: {
  innerCenter?: boolean

  justify?: CSSStyle['justifyContent']
  justifyItems?: CSSStyle['justifyItems']
  items?: CSSStyle['alignItems']
  gap?: CSSStyle['gap']
}) =>
  createICSS({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: options.justify,
    justifyItems: options.justifyItems,
    alignItems: options.innerCenter ? 'center' : options.items,
    gap: options.gap
  })

export const icssFlexChildGrow = createICSS({
  '& > * ': {
    flexGrow: 1
  }
})

export const icssCenterByFixed = createICSS({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
})

//#region ------------------- component style -------------------
export const icssItemBaseStyle = createICSS({
  paddingInline: 16,
  paddingBlock: 12,
  marginBlock: 4,
  color: cssColors.textColor,
  borderRadius: cssSize.roundedSmall
})

export const icssClickableItem = createICSS([icssItemBaseStyle, icssClickable])

export const icssSelectedItem = createICSS([icssItemBaseStyle, icssSelected])

//#endregion

export const icssStratchableHeight: ICSSObject = {
  // for stretch can have effect
  contain: 'size',
  overflow: 'hidden auto'
}
