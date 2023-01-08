import { ICSSObject } from '../parseCSS'

export const icssHoverScrollbar: ICSSObject = {
  '::-webkit-scrollbar': {
    backgroundColor: 'transparent',
    width: 7
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: 'transparent',
    borderRadius: 8,
    transition: '1s'
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  ':active': {
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    },
    scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent' // for mozilla firefox
  },
  ':hover': {
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    },
    scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent' // for mozilla firefox
  },
  scrollbarGutter: 'stable'
}

export const icssScrollOverflow = (cssOptions?: { haveX?: boolean; cssValue?: ICSSObject['overflow'] }) => {
  const { haveX = false, cssValue = 'auto' } = cssOptions ?? {}
  return {
    overflowY: cssValue,
    overflowX: haveX ? cssValue : 'hidden'
  } as ICSSObject
}

export const icssFloatScrollbar:ICSSObject= {
  overflow:'overlay',
  '::-webkit-scrollbar': {
    backgroundColor: 'transparent',
    width: 7
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: '#46464647',
    borderRadius: 8,
    transition: '500ms'
  },
  ':hover::-webkit-scrollbar-thumb': {
    backgroundColor: '#464646b8',
  },
}

export const icssScrollSmooth: ICSSObject = {
  scrollBehavior: 'smooth'
}

export const icssNoScrollbar: ICSSObject = {
  '::-webkit-scrollbar': {
    display: 'none'
  },
  scrollbarWidth: 'none'
}
