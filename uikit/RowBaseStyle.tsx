export type RowBaseStyleProps = {
  /**
   * @cssProps
   * "横"盒子空隙的大小
   */
  gapSize?: 'small' | 'medium' | 'large'
}

export const rowBaseStyle = (styleProps: RowBaseStyleProps | 'none' = {}) => {
  if (styleProps === 'none') return ''
  const { gapSize = 'medium' } = styleProps
  return `Row flex ${{ small: 'gap-1', medium: 'gap-2', large: 'gap-4' }[gapSize]} items-center`
}
