/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalCommand, LexicalEditor, NodeKey, RangeSelection } from 'lexical';

import './index.css';

import { $createMarkNode, $getMarkIDs, $isMarkNode, $wrapSelectionInMarkNode, MarkNode } from '@lexical/mark';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import useLayoutEffect from '../../shared/useLayoutEffect';
import { $createMarkNodeX, $isMarkNodeX, MarkNodeX } from '../../nodes/MarkNodeX';

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand('INSERT_INLINE_COMMAND');

function SourceInputBox({
  editor,
  cancelAddSource,
  submitAddSource,
}: {
  cancelAddSource: () => void;
  editor: LexicalEditor;
  submitAddSource: (sourceLink: string, selection?: RangeSelection | null) => void;
}) {
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    [],
  );
  const selectionRef = useRef<RangeSelection | null>(null);

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(editor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const { left, bottom, width } = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft = selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `${correctedLeft}px`;
          boxElem.style.top = `${bottom + 10 + (window.pageYOffset || document.documentElement.scrollTop)}px`;
          const selectionRectsLength = selectionRects.length;
          const { container } = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color = '255, 212, 0';
            const style = `position:absolute;top:${
              selectionRect.top + (window.pageYOffset || document.documentElement.scrollTop)
            }px;left:${selectionRect.left}px;height:${selectionRect.height}px;width:${
              selectionRect.width
            }px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  useLayoutEffect(() => {
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [selectionState.container, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation]);

  const submitSource = () => {
    if (canSubmit) {
      submitAddSource(content, selectionRef.current);
      selectionRef.current = null;
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const monitorInputInteraction = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelAddSource();
    }
  };

  return (
    <div className="CopusPlugin_SourceInputBox" ref={boxRef}>
      <div className="link-title">Add Sources</div>
      <div className="link-main">
        <input
          ref={inputRef}
          className="link-input"
          // value={editedLinkUrl}
          onChange={(event) => {
            setContent(event.target.value);
            setCanSubmit(event.target.value.length > 0);
          }}
          onKeyDown={(event) => {
            monitorInputInteraction(event);
          }}
        />
        <div
          className="link-cancel"
          role="button"
          tabIndex={0}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            cancelAddSource();
          }}
        />
        <div
          className="link-confirm"
          role="button"
          tabIndex={0}
          onMouseDown={(event) => event.preventDefault()}
          onClick={submitSource}
        />
      </div>
    </div>
  );
}

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
          $wrapSelectionInMarkNode(selection, isBackward, '123', (ids) => {
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
            // setShowComments(true);
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
            console.log('=======', key, mutation);
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
