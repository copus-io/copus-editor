/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';

import { $createPayLineNode, PayLineNode } from '../../nodes/PayLineNode';
import useFlashMessage from '../../hooks/useFlashMessage';

export const INSERT_PAY_LINE: LexicalCommand<undefined> = createCommand();

export default function PayLinePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const showFlashMessage = useFlashMessage();

  useEffect(() => {
    if (!editor.hasNodes([PayLineNode])) {
      throw new Error('PayLinePlugin: PayLineNode is not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_PAY_LINE,
        () => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          const editorState = editor.getEditorState();
          let hasPayLineNode = false;
          editorState._nodeMap.forEach((node) => {
            if (node instanceof PayLineNode) {
              hasPayLineNode = true;
            }
          });
          if (hasPayLineNode) {
            showFlashMessage('Only one PayLine can be inserted');
            return false;
          }

          const focusNode = selection.focus.getNode();
          if (focusNode !== null) {
            const plBreak = $createPayLineNode();
            $insertNodeToNearestRoot(plBreak);
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
