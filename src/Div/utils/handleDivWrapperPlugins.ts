import { ReactElement } from 'react';
import { WrapperNodeFn } from '../../plugins/type';

export function handleDivWrapperPlugins(utils: { innerNode: ReactElement; plugin: WrapperNodeFn[]; }): ReactElement {
  return utils.plugin.reduce((prevNode, getWrappedNode) => getWrappedNode(prevNode), utils.innerNode);
}
