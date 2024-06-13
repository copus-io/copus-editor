/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {SharedAutocompleteContext} from './context/SharedAutocompleteContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {FlashMessageContext} from './context/FlashMessageContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import {TableContext} from './plugins/TablePlugin';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import styles from './style.module.less';
import {useEffect} from 'react';
import getEditorPortal from './utils/getEditorPortal';
import {EditorState, SerializedEditorState} from 'lexical';
import {ToolbarConfig} from './plugins/ToolbarPlugin';

export interface EditorProps {
  readOnly?: boolean;
  onChange?: (editorState: EditorState, html: string) => void;
  initialValue?: string;
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
}

function App(props: EditorProps): JSX.Element {
  const initialConfig = {
    editorState: props.initialValue ?? null,
    namespace: 'CopusEditor',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
    editable: false,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <div className={styles['copus-editor-shell']}>
              <Editor
                onChange={props.onChange}
                readOnly={props.readOnly}
                toolbar={props.toolbar}
                showLabel={props.showLabel}
              />
            </div>
          </SharedAutocompleteContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function Main(props: EditorProps): JSX.Element {
  useEffect(() => {
    getEditorPortal();
  }, []);

  return (
    <FlashMessageContext>
      <App {...props} />
    </FlashMessageContext>
  );
}
