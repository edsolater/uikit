import { createElement } from 'react'
import { DivProps } from '../../Div'
import { Component } from '../../typings/tools'
import { createDangerousRenderWrapperNodePlugx } from '../createPlugin'

/** render self node as first child of Wrapper */
export const WrappedBy = createDangerousRenderWrapperNodePlugx<DivProps>
