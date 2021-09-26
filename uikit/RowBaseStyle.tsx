export type RowFlavorProps = {
  noDefaultFlavor?: boolean
  flavor?: {
    /**
     * @cssProps
     * "横"盒子空隙的大小
     */
    gapSize?: 'small' | 'medium' | 'large'
  }
}

export const rowFlavor = (flavorOptions: RowFlavorProps['flavor']) => {
  const { gapSize = 'medium' } = flavorOptions ?? {}
  return `Row flex ${{ small: 'gap-1', medium: 'gap-2', large: 'gap-4' }[gapSize]} items-center`
}
