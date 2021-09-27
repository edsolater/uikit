export type ScrollDivTintProps = {
  noDefaultThumbTint?: boolean
  thumbTint?: {}

  noDefaultSlotTint?: boolean
  slotTint?: {}
}
export type ScrollDivReturnedTintBlock = {
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

export const scrollDivTint = (
  thumbTintOptions: ScrollDivTintProps['thumbTint'] = {},
  slotTintOptions: ScrollDivTintProps['slotTint'] = {}
): ScrollDivReturnedTintBlock => {
  return {
    'slot': ({ isSlotHovered }) => `transition ${isSlotHovered ? 'w-4' : 'w-2'}`,
    'thumb': ({ isContainerHovered }) =>
      `h-8 transition active:bg-opacity-100 hover:bg-opacity-80  ${
        isContainerHovered ? 'bg-opacity-60' : 'bg-opacity-20'
      } bg-block-primary`
  }
}
