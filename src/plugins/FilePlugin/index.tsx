/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement, mergeRegister} from '@lexical/utils';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import {useEffect, useRef, useState} from 'react';
import * as React from 'react';
import {CAN_USE_DOM} from '../../shared/canUseDOM';

import {
  $createFileNode,
  $isFileNode,
  FileNode,
  FilePayload,
} from '../../nodes/FileNode';
import Button from '../../ui/Button';
import {DialogActions, DialogButtonsList} from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import editorUploadFiles from '../../utils/editorUploadFiles';
import useFlashMessage from '../../hooks/useFlashMessage';
import {useSharedHistoryContext} from '../../context/SharedHistoryContext';
import {clearTempHistory} from '../../utils/clearTempHistory';
import {mineTypeMap} from '../../utils/constant';

export type InsertFilePayload = Readonly<FilePayload> & {
  file?: File;
};

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

export const INSERT_FILE_COMMAND: LexicalCommand<InsertFilePayload> =
  createCommand('INSERT_FILE_COMMAND');

export default function FilePlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {historyState} = useSharedHistoryContext();

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertFilePayload>(
        INSERT_FILE_COMMAND,
        (payload) => {
          const {file, ...otherPayload} = payload;
          const fileNode = $createFileNode({
            ...otherPayload,
            uploading: !!file,
          });
          $insertNodes([fileNode]);
          if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
            $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd();
          }

          if (file) {
            editorUploadFiles(file).then((res) => {
              if (res.status === 1) {
                editor.update(() => {
                  const _node = editor
                    .getEditorState()
                    ._nodeMap.get(fileNode.getKey());
                  if (!_node) return;
                  URL.revokeObjectURL(payload.src);
                  fileNode.setUploadState(false);
                  fileNode.setSrc(res.data);
                });
                clearTempHistory(fileNode, historyState);
              }
            });
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [captionsEnabled, editor]);

  return null;
}

function onDragStart(event: DragEvent): boolean {
  const node = getFileNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  // dataTransfer.setDragImage(file, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        key: node.getKey(),
        src: node.__src,
      },
      type: 'file',
    }),
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getFileNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropFile(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getFileNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragFileData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropFile(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_FILE_COMMAND, data);
  }
  return true;
}

function getFileNodeInSelection(): FileNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isFileNode(node) ? node : null;
}

function getDragFileData(event: DragEvent): null | InsertFilePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const {type, data} = JSON.parse(dragData);
  if (type !== 'file') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropFile(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-file') &&
    target.parentElement &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const target = event.target as null | Element | Document;
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
        ? (target as Document).defaultView
        : (target as Element).ownerDocument.defaultView;
  const domSelection = getDOMSelection(targetWindow);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}
