/**
 * @file spaw style for props:style
 */

export const genGridTemplate = ({ itemMinWidth = '0' }: { itemMinWidth: string }) => ({
  gridTemplateColumns: `repeat(auto-fit, minmax(${itemMinWidth}, 1fr))`
})
