/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalCommand, NodeKey, RangeSelection } from 'lexical';
import { $getMarkIDs, $wrapSelectionInMarkNode } from '@lexical/mark';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { $createMarkNodeX, $isMarkNodeX, MarkNodeX } from '../../nodes/MarkNodeX';
import { SourceInputBox } from './SourceInputBox';
import './index.css';

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand('INSERT_INLINE_COMMAND');

export default function CopusPlugin({}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const markNodeXMap = useMemo<Map<string, Set<NodeKey>>>(() => {
    return new Map();
  }, []);
  const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>();
  const [activeIDs, setActiveIDs] = useState<Array<string>>([]);
  const [showSourceInput, setShowSourceInput] = useState(false);
  // const [showComments, setShowComments] = useState(false);

  const cancelAddSource = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection !== null) {
        selection.dirty = true;
      }
    });
    setShowSourceInput(false);
  }, [editor]);

  const submitAddSource = useCallback(
    (sourceLink: string, selection?: RangeSelection | null) => {
      editor.update(() => {
        if ($isRangeSelection(selection)) {
          const isBackward = selection.isBackward();
          // const id = commentOrThread.id;

          // Wrap content in a MarkNodeX
          $wrapSelectionInMarkNode(selection, isBackward, Date.now().toString(), (ids) => {
            return new MarkNodeX({ ids, source: true });
          });
        }
      });
      setShowSourceInput(false);
    },
    [editor],
  );

  useEffect(() => {
    const changedElems: Array<HTMLElement> = [];
    console.log('activeIDs', activeIDs, markNodeXMap);
    for (let i = 0; i < activeIDs.length; i++) {
      const id = activeIDs[i];
      const keys = markNodeXMap.get(id);
      if (keys !== undefined) {
        for (const key of keys) {
          const elem = editor.getElementByKey(key);
          if (elem !== null) {
            elem.classList.add('selected');
            changedElems.push(elem);
            // setShowSourceInput(true);
          }
        }
      }
    }
    return () => {
      for (let i = 0; i < changedElems.length; i++) {
        const changedElem = changedElems[i];
        changedElem.classList.remove('selected');
      }
    };
  }, [activeIDs, editor, markNodeXMap]);

  useEffect(() => {
    const markNodeXKeysToIDs: Map<NodeKey, Array<string>> = new Map();

    return mergeRegister(
      registerNestedElementResolver<MarkNodeX>(
        editor,
        MarkNodeX,
        (from: MarkNodeX) => {
          return $createMarkNodeX(from.getIDs());
        },
        (from: MarkNodeX, to: MarkNodeX) => {
          // Merge the IDs
          const ids = from.getIDs();
          ids.forEach((id) => {
            to.addID(id);
          });
        },
      ),
      editor.registerMutationListener(MarkNodeX, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            const node: null | MarkNodeX = $getNodeByKey(key);
            let ids: NodeKey[] = [];

            if (mutation === 'destroyed') {
              ids = markNodeXKeysToIDs.get(key) || [];
            } else if ($isMarkNodeX(node)) {
              ids = node.getIDs();
            }

            for (let i = 0; i < ids.length; i++) {
              const id = ids[i];
              let markNodeXKeys = markNodeXMap.get(id);
              markNodeXKeysToIDs.set(key, ids);

              if (mutation === 'destroyed') {
                if (markNodeXKeys !== undefined) {
                  markNodeXKeys.delete(key);
                  if (markNodeXKeys.size === 0) {
                    markNodeXMap.delete(id);
                  }
                }
              } else {
                if (markNodeXKeys === undefined) {
                  markNodeXKeys = new Set();
                  markNodeXMap.set(id, markNodeXKeys);
                }
                if (!markNodeXKeys.has(key)) {
                  markNodeXKeys.add(key);
                }
              }
            }
          }
        });
      }),
      editor.registerUpdateListener(({ editorState, tags }) => {
        editorState.read(() => {
          const selection = $getSelection();
          let hasActiveIds = false;
          let hasAnchorKey = false;

          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              const ids = $getMarkIDs(anchorNode, selection.anchor.offset);
              if (ids !== null) {
                setActiveIDs(ids);
                hasActiveIds = true;
              }
              if (!selection.isCollapsed()) {
                setActiveAnchorKey(anchorNode.getKey());
                hasAnchorKey = true;
              }
            }
          }
          if (!hasActiveIds) {
            setActiveIDs((_activeIds) => (_activeIds.length === 0 ? _activeIds : []));
          }
          if (!hasAnchorKey) {
            setActiveAnchorKey(null);
          }
          if (!tags.has('collaboration') && $isRangeSelection(selection)) {
            setShowSourceInput(false);
          }
        });
      }),
      editor.registerCommand(
        INSERT_INLINE_COMMAND,
        () => {
          const domSelection = window.getSelection();
          if (domSelection !== null) {
            domSelection.removeAllRanges();
          }
          setShowSourceInput(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor, markNodeXMap]);

  return (
    <>
      {showSourceInput &&
        createPortal(
          <SourceInputBox editor={editor} cancelAddSource={cancelAddSource} submitAddSource={submitAddSource} />,
          document.body,
        )}
    </>
  );
}
