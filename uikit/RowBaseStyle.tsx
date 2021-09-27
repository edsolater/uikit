export type RowTintProps = {
  noDefaultTint?: boolean
  tint?: {
    /**
     * @cssProps
     * "横"盒子空隙的大小
     */
    gapSize?: 'small' | 'medium' | 'large'
  }
}

export const rowTint = (tintOptions: RowTintProps['tint']) => {
  const { gapSize = 'medium' } = tintOptions ?? {}
  return `Row flex ${{ small: 'gap-1', medium: 'gap-2', large: 'gap-4' }[gapSize]} items-center`
}
