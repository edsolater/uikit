export type ScrollDivFlavorProps = {
  noDefaultThumbFlavor?: boolean
  thumbFlavor?: {}

  noDefaultSlotFlavor?: boolean
  slotFlavor?: {}
}
export type ScrollDivReturnedFlavorBlock = {
  slot:
    | string
    | ((status: {
        isThumbHovered: boolean
        isThumbActive: boolean
        isSlotHovered: boolean
        isContainerHovered: boolean
      }) => string)
  thumb:
    | string
    | ((status: {
        isThumbHovered: boolean
        isThumbActive: boolean
        isSlotHovered: boolean
        isContainerHovered: boolean
      }) => string)
}

export const scrollDivFlavor = (
  thumbFlavorOptions: ScrollDivFlavorProps['thumbFlavor'] = {},
  slotFlavorOptions: ScrollDivFlavorProps['slotFlavor'] = {}
): ScrollDivReturnedFlavorBlock => {
  return {
    'slot': ({ isSlotHovered }) => `transition ${isSlotHovered ? 'w-4' : 'w-2'}`,
    'thumb': ({ isContainerHovered }) =>
      `h-8 transition active:bg-opacity-100 hover:bg-opacity-80  ${
        isContainerHovered ? 'bg-opacity-60' : 'bg-opacity-20'
      } bg-block-primary`
  }
}
