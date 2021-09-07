/**
 * @file spaw style for props:style
 */

export const spawnAutoFitGridTemplate = (min: string = '0') => ({
  gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`
})
