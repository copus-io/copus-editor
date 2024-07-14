/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { SharedAutocompleteContext } from './context/SharedAutocompleteContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { FlashMessageContext } from './context/FlashMessageContext';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import { TableContext } from './plugins/TablePlugin';
import CopusEditorTheme from './themes/CopusEditorTheme';
import { forwardRef, Ref, useEffect } from 'react';
import getEditorPortal from './utils/getEditorPortal';
import { TextNode } from 'lexical';
import { TextNodeX } from './nodes/TextNodeX';
import { MarkNodeX } from './nodes/MarkNodeX';
import { MarkNode } from '@lexical/mark';
import EditorShell from './EditorShell';
import type { EditorShellProps, EditorShellRef } from './EditorShell';

export { EditorShellRef, EditorShellProps };

export default forwardRef(function App(props: EditorShellProps, ref: Ref<EditorShellRef>): JSX.Element {
  const initialConfig = {
    editorState: props.initialValue,
    namespace: 'CopusEditor',
    nodes: [
      ...PlaygroundNodes,
      TextNodeX,
      {
        replace: TextNode,
        with: (node: TextNode) => {
          return new TextNodeX(node.__text);
        },
      },
      MarkNodeX,
      {
        replace: MarkNode,
        with: (node: MarkNode) => {
          return new MarkNodeX({ ids: node.__ids });
        },
      },
    ],
    onError: (error: Error) => {
      throw error;
    },
    theme: CopusEditorTheme,
    editable: false,
  };

  useEffect(() => {
    getEditorPortal();
  }, []);

  return (
    <FlashMessageContext>
      <LexicalComposer initialConfig={initialConfig}>
        <SharedHistoryContext>
          <TableContext>
            <SharedAutocompleteContext>
              <EditorShell {...props} ref={ref} />
            </SharedAutocompleteContext>
          </TableContext>
        </SharedHistoryContext>
      </LexicalComposer>
    </FlashMessageContext>
  );
});
