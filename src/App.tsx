/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {SettingsContext, useSettings} from './context/SettingsContext';
import {SharedAutocompleteContext} from './context/SharedAutocompleteContext';
import {SharedHistoryContext} from './context/SharedHistoryContext';
import {FlashMessageContext} from './context/FlashMessageContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import {TableContext} from './plugins/TablePlugin';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

import './style.less';
import {useEffect} from 'react';
import getEditorPortal from './utils/getEditorPortal';

function App(): JSX.Element {
  const initialConfig = {
    editorState: null,
    namespace: 'S31Editor',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };

  console.log('S31Editor');

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <div className="s31-editor-shell">
              <Editor />
            </div>
          </SharedAutocompleteContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function Main(): JSX.Element {
  useEffect(() => {
    getEditorPortal()
  }, []);

  return (
    <FlashMessageContext>
      <App />
    </FlashMessageContext>
  );
}

// export default function PlaygroundApp(): JSX.Element {
//     return (
//         <SettingsContext>
//             <FlashMessageContext>
//                 <App />
//             </FlashMessageContext>
//         </SettingsContext>
//     );
// }
