import { createICSS, ICSSObject } from '../parseCSS'

export const icssMargin = (options: {
  m?: ICSSObject['margin']
  mx?: ICSSObject['marginInline']
  my?: ICSSObject['marginBlock']
  mt?: ICSSObject['marginTop']
  mb?: ICSSObject['marginBottom']
  ml?: ICSSObject['marginLeft']
  mr?: ICSSObject['marginRight']
}) =>
  createICSS({
    margin: options.m,
    marginInline: options.mx,
    marginBlock: options.my,
    marginTop: options.mt,
    marginBottom: options.mb,
    marginLeft: options.ml,
    marginRight: options.mr
  })

export const icssSpaceY = (value: ICSSObject['marginBottom']) =>
  createICSS({
    '& > *:not(:last-child)': {
      marginBottom: value
    }
  })
export const icssSpaceX = (value: ICSSObject['marginRight']) =>
  createICSS({
    '& > *:not(:last-child)': {
      marginRight: value
    }
  })
