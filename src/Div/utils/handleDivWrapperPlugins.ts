import { ReactElement } from 'react';
import { WrapperNodeFn } from '../../plugins/type';

export function handleDivWrapperPlugins(utils: { innerNode: ReactElement; plugins: WrapperNodeFn[]; }): ReactElement {
  return utils.plugins.reduce((prevNode, getWrappedNode) => getWrappedNode(prevNode), utils.innerNode);
}
