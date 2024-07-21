/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $isCodeHighlightNode } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createRangeSelection,
  $createRangeSelectionFromDom,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getDOMRangeRect } from '../../utils/getDOMRangeRect';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { setFloatingElemPosition } from '../../utils/setFloatingElemPosition';
import getEditorPortal from '../../utils/getEditorPortal';
import { INSERT_INLINE_COMMAND } from '../CopusPlugin';
import { MarkXType } from '../../nodes/MarkNodeX';
import { $wrapSelectionInMarkNode } from '@lexical/mark';
import { ParagraphNodeX } from '../../nodes/ParagraphNodeX';
import { EditorShellProps } from '../../EditorShell';

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isLink,
  copus,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isLink: boolean;
  copus: EditorShellProps['copus'];
}): JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

  const insertSource = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
  };

  function mouseMoveListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current && (e.buttons === 1 || e.buttons === 3)) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX;
        const y = e.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y);

        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          popupCharStylesEditorRef.current.style.pointerEvents = 'none';
        }
      }
    }
  }
  function mouseUpListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto';
      }
    }
  }

  useEffect(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener);

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('mouseup', mouseUpListener);
      };
    }
  }, [popupCharStylesEditorRef]);

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = window.getSelection();

    if (popupCharStylesEditorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem, isLink);
    }
  }, [editor, anchorElem, isLink]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };

    window.addEventListener('resize', update);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);

  const handleCopySource = useCallback(() => {
    let willCopyMark: MarkXType | null = null;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const startEndPoints = selection.getStartEndPoints();
        if (startEndPoints) {
          let [start, end] = startEndPoints;
          if (selection.isBackward()) [start, end] = [end, start];
          const startNode = start.getNode();
          const endNode = end.getNode();
          const startTopNode = startNode.getTopLevelElement() as ParagraphNodeX;
          const endTopNode = endNode.getTopLevelElement() as ParagraphNodeX;

          let startOffset = start.offset;
          startTopNode.getAllTextNodes().find((textNode) => {
            if (textNode === startNode) return true;
            startOffset += textNode.getTextContentSize();
            return false;
          });
          let endOffset = end.offset;
          endTopNode.getAllTextNodes().find((textNode) => {
            if (textNode === endNode) return true;
            endOffset += textNode.getTextContentSize();
            return false;
          });

          const _mark = {
            opusUuid: copus?.opusUuid,
            opusId: copus?.opusId,
            startNodeId: startTopNode.getId(),
            startNodeAt: startOffset,
            endNodeId: endTopNode.getId(),
            endNodeAt: endOffset,
            textContent: selection.getTextContent(),
          };
          willCopyMark = _mark;
        }
      }
    });
    return willCopyMark;
  }, [editor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        COPY_COMMAND,
        (e: ClipboardEvent) => {
          if (editor.isEditable()) {
            return false;
          }
          if (e?.clipboardData) {
            const willCopyMark = handleCopySource();
            e.clipboardData.setData('application/x-copus-copy', JSON.stringify(willCopyMark));
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateTextFormatFloatingToolbar, handleCopySource]);

  const isEditable = editor.isEditable();

  if (!isEditable) return <div />;

  return (
    <div ref={popupCharStylesEditorRef} className={`floating-toolbar-popup ${isEditable ? '' : 'view-popup'}`}>
      {
        isEditable ? (
          <button
            type="button"
            onClick={insertSource}
            className={'popup-item spaced insert-source'}
            aria-label="Insert Copus Source">
            <i className="format add-source" />
            Add Source
          </button>
        ) : null
        // <button
        //   type="button"
        //   onClick={handleCopySource}
        //   className={'popup-item spaced insert-source'}
        //   aria-label="Copy Copus Source">
        //   <i className="format add-source" />
        //   Copy
        // </button>
      }
    </div>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  copus: EditorShellProps['copus'],
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) || rootElement === null || !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      // Update links
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (!$isCodeHighlightNode(selection.anchor.getNode()) && selection.getTextContent() !== '') {
        setIsText($isTextNode(node) || $isParagraphNode(node));
      } else {
        setIsText(false);
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '');
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false);
        return;
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  return createPortal(
    <TextFormatFloatingToolbar editor={editor} copus={copus} anchorElem={anchorElem} isLink={isLink} />,
    anchorElem,
  );
}

export default function FloatingCopusToolbarPlugin({
  anchorElem = getEditorPortal(),
  copus,
}: {
  anchorElem?: HTMLElement;
  copus: EditorShellProps['copus'];
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(editor, anchorElem, copus);
}
