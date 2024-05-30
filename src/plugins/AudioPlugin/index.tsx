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
  $createAudioNode,
  $isAudioNode,
  AudioNode,
  AudioPayload,
} from '../../nodes/AudioNode';
import Button from '../../ui/Button';
import {DialogActions, DialogButtonsList} from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import editorUploadFiles from '../../utils/editorUploadFiles';
import useFlashMessage from '../../hooks/useFlashMessage';
import {useSharedHistoryContext} from '../../context/SharedHistoryContext';
import {clearTempHistory} from '../../utils/clearTempHistory';
import {mineTypeMap} from '../../utils/constant';

export type InsertAudioPayload = Readonly<AudioPayload> & {
  file?: File;
};

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

export const INSERT_AUDIO_COMMAND: LexicalCommand<InsertAudioPayload> =
  createCommand('INSERT_AUDIO_COMMAND');

export function InsertAudioUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertAudioPayload) => void;
}) {
  const [src, setSrc] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label="Audio URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={setSrc}
        value={src}
        data-test-id="audio-modal-url-input"
      />
      {/* <TextInput
        label="Alt Text"
        placeholder="Random unsplash audio"
        onChange={setAltText}
        value={altText}
        data-test-id="audio-modal-alt-text-input"
      /> */}

      <DialogActions>
        <Button
          data-test-id="audio-modal-confirm-btn"
          disabled={isDisabled}
          onClick={() => onClick({src, controls: true})}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertAudioUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertAudioPayload) => void;
}) {
  const [audiofile, setAudiofile] = useState<File>();
  const showFlashMessage = useFlashMessage();

  const loadFiles = (files: FileList | null) => {
    if (files === null) {
      return;
    }
    setAudiofile(files[0]);
  };

  return (
    <>
      <FileInput
        label="Audio Upload"
        onChange={loadFiles}
        accept="audio/*"
        data-test-id="audio-modal-file-upload"
      />
      <DialogActions>
        <Button
          data-test-id="audio-modal-file-upload-btn"
          onClick={() => {
            if (audiofile) {
              if (audiofile.size > mineTypeMap.audio.limitSize) {
                showFlashMessage(mineTypeMap.audio.limitMessage);
                return;
              }
              onClick({src: URL.createObjectURL(audiofile), file: audiofile});
            }
          }}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertAudioDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>();
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const onClick = (payload: InsertAudioPayload) => {
    activeEditor.dispatchCommand(INSERT_AUDIO_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="audio-modal-option-url"
            onClick={() => setMode('url')}>
            URL
          </Button>
          <Button
            data-test-id="audio-modal-option-file"
            onClick={() => setMode('file')}>
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertAudioUriDialogBody onClick={onClick} />}
      {mode === 'file' && <InsertAudioUploadedDialogBody onClick={onClick} />}
    </>
  );
}

export default function AudioPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {historyState} = useSharedHistoryContext();

  useEffect(() => {
    if (!editor.hasNodes([AudioNode])) {
      throw new Error('AudioPlugin: AudioNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertAudioPayload>(
        INSERT_AUDIO_COMMAND,
        (payload) => {
          const {file, ...otherPayload} = payload;
          const audioNode = $createAudioNode({
            ...otherPayload,
            uploading: !!file,
          });
          $insertNodes([audioNode]);
          if ($isRootOrShadowRoot(audioNode.getParentOrThrow())) {
            $wrapNodeInElement(audioNode, $createParagraphNode).selectEnd();
          }

          if (file) {
            editorUploadFiles(file).then((res) => {
              if (res.status === 1) {
                editor.update(() => {
                  const _node = editor
                    .getEditorState()
                    ._nodeMap.get(audioNode.getKey());
                  if (!_node) return;
                  URL.revokeObjectURL(payload.src);
                  audioNode.setUploadState(false);
                  audioNode.setSrc(res.data);
                });
                clearTempHistory(audioNode, historyState);
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
const TRANSPARENT_AUDIO = '';
const audio = document.createElement('audio');
audio.src = TRANSPARENT_AUDIO;

function onDragStart(event: DragEvent): boolean {
  const node = getAudioNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  // dataTransfer.setDragImage(audio, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        key: node.getKey(),
        autoplay: node.__autoplay,
        controls: node.__controls,
        src: node.__src,
      },
      type: 'audio',
    }),
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getAudioNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropAudio(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getAudioNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragAudioData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropAudio(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_AUDIO_COMMAND, data);
  }
  return true;
}

function getAudioNodeInSelection(): AudioNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isAudioNode(node) ? node : null;
}

function getDragAudioData(event: DragEvent): null | InsertAudioPayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const {type, data} = JSON.parse(dragData);
  if (type !== 'audio') {
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

function canDropAudio(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-audio') &&
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
