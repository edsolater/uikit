import { style } from '@vanilla-extract/css'

export const cssCalendarGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)'
})
export const cssCalendarMonthGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)'
})
export const cssCalendarItem = style({
  aspectRatio: '1',
  display: 'grid',
  placeItems: 'center'
})
export const cssCalendarItemActive = style({
  color: 'dodgerblue'
})
export const cssCalendarItemMute = style({
  opacity: 0.3
})
export const cssCalendarItemMonday = style({ gridColumn: '1 / span 1' })
export const cssCalendarItemTuesday = style({ gridColumn: '2 / span 1' })
export const cssCalendarItemWednesday = style({ gridColumn: '3 / span 1' })
export const cssCalendarItemThursday = style({ gridColumn: '4 / span 1' })
export const cssCalendarItemFriday = style({ gridColumn: '5 / span 1' })
export const cssCalendarItemSaturday = style({ gridColumn: '6 / span 1' })
export const cssCalendarItemSunday = style({ gridColumn: '7 / span 1' })
