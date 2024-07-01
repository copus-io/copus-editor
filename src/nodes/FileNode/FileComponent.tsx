/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalEditor, NodeKey} from 'lexical';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';

import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {Suspense, useCallback, useEffect, useRef} from 'react';

import {$isFileNode} from './index';
import styles from './style.module.less';

export default function FileComponent({
  src,
  name = 'file',
  nodeKey,
  uploading,
}: {
  nodeKey: NodeKey;
  name: string;
  src: string;
  uploading: boolean;
}): JSX.Element {
  const divRef = useRef<null | HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();
  // const [selection, setSelection] = useState<BaseSelection | null>(null);

  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      console.log('onDelete');

      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isFileNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      const buttonElem = buttonRef.current;
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault();
          buttonElem.focus();
          return true;
        }
      }
      return false;
    },
    [isSelected],
  );

  useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        if (isMounted) {
          // setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;
          if (event.target === divRef.current) {
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === divRef.current) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isSelected,
    nodeKey,
    onDelete,
    onEnter,
    setSelected,
  ]);

  const handleDownLoad = useCallback(() => {
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    a.click();
  }, [src, name]);

  return (
    <Suspense fallback={null}>
      <div draggable={false} className="uploading-wrap editor-file">
        <div
          className={`${styles['file-block']} ${isSelected ? `focused` : ''}`}
          ref={divRef}>
          <div className="file-icon"></div>
          <div className="file-name">{name}</div>
          <div className="file-download" onClick={handleDownLoad}></div>
        </div>
        {uploading && <div className="uploading-text">Uploading...</div>}
      </div>
    </Suspense>
  );
}
