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
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
  createCommand,
} from 'lexical';
import {useEffect, useRef, useState} from 'react';
import {CAN_USE_DOM} from '../../shared/canUseDOM';

import {
  $createVideoNode,
  $isVideoNode,
  VideoNode,
  VideoPayload,
} from '../../nodes/VideoNode';
import Button from '../../ui/Button';
import {DialogActions, DialogButtonsList} from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import editorUploadFiles from '../../utils/editorUploadFiles';
import useFlashMessage from '../../hooks/useFlashMessage';
import {useSharedHistoryContext} from '../../context/SharedHistoryContext';
import {clearTempHistory} from '../../utils/clearTempHistory';
import {mineTypeMap} from '../../utils/constant';

export type InsertVideoPayload = Readonly<VideoPayload> & {
  file?: File;
};

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

export const INSERT_VIDEO_COMMAND: LexicalCommand<InsertVideoPayload> =
  createCommand('INSERT_VIDEO_COMMAND');

export function InsertVideoUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertVideoPayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label="Video URL"
        placeholder="https://example.com/video.mp4"
        onChange={setSrc}
        value={src}
        data-test-id="Video-modal-url-input"
      />
      <TextInput
        label="Width"
        placeholder="300"
        onChange={(val) => {
          setWidth(parseInt(val) || 0);
        }}
        value={width?.toString() || ''}
        data-test-id="Video-modal-alt-text-input"
      />
      <TextInput
        label="Height"
        placeholder="200"
        onChange={(val) => {
          setHeight(parseInt(val) || 0);
        }}
        value={height?.toString() || ''}
        data-test-id="Video-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="Video-modal-confirm-btn"
          disabled={isDisabled}
          onClick={() =>
            onClick({
              src,
              controls: true,
              width: width ?? 300,
              height: height ?? 200,
            })
          }>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertVideoUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertVideoPayload) => void;
}) {
  const [videofile, setVideofile] = useState<File>();
  const showFlashMessage = useFlashMessage();

  const loadFiles = (files: FileList | null) => {
    if (files === null) {
      return;
    }
    setVideofile(files[0]);
  };

  return (
    <>
      <FileInput
        label="Video Upload"
        onChange={loadFiles}
        accept="video/*"
        data-test-id="Video-modal-file-upload"
      />
      <DialogActions>
        <Button
          data-test-id="Video-modal-file-upload-btn"
          onClick={() => {
            if (videofile) {
              if (videofile.size > mineTypeMap.video.limitSize) {
                showFlashMessage(mineTypeMap.video.limitMessage);
                return;
              }
              onClick({src: URL.createObjectURL(videofile), file: videofile});
            }
          }}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertVideoDialog({
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

  const onClick = (payload: InsertVideoPayload) => {
    activeEditor.dispatchCommand(INSERT_VIDEO_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="Video-modal-option-url"
            onClick={() => setMode('url')}>
            URL
          </Button>
          <Button
            data-test-id="Video-modal-option-file"
            onClick={() => setMode('file')}>
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertVideoUriDialogBody onClick={onClick} />}
      {mode === 'file' && <InsertVideoUploadedDialogBody onClick={onClick} />}
    </>
  );
}

export default function VideoPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {historyState} = useSharedHistoryContext();

  useEffect(() => {
    if (!editor.hasNodes([VideoNode])) {
      throw new Error('VideoPlugin: VideoNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertVideoPayload>(
        INSERT_VIDEO_COMMAND,
        (payload) => {
          const {file, ...otherPayload} = payload;
          const videoNode = $createVideoNode({
            ...otherPayload,
            uploading: !!file,
          });
          $insertNodes([videoNode]);
          if ($isRootOrShadowRoot(videoNode.getParentOrThrow())) {
            $wrapNodeInElement(videoNode, $createParagraphNode).selectEnd();
          }

          if (file) {
            editorUploadFiles(file).then((res) => {
              if (res.status === 1) {
                editor.update(() => {
                  const _node = editor
                    .getEditorState()
                    ._nodeMap.get(videoNode.getKey());
                  if (!_node) return;
                  URL.revokeObjectURL(payload.src);
                  videoNode.setUploadState(false);
                  videoNode.setSrc(res.data);
                });
                clearTempHistory(videoNode, historyState);
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
const TRANSPARENT_VIDEO = '';
const video = document.createElement('video');
video.src = TRANSPARENT_VIDEO;

function onDragStart(event: DragEvent): boolean {
  const node = getVideoNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  // dataTransfer.setDragImage(Video, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        // altText: node.__altText,
        key: node.getKey(),
        autoplay: node.__autoplay,
        controls: node.__controls,
        src: node.__src,
        height: node.__height,
        width: node.__width,
      },
      type: 'video',
    }),
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getVideoNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropVideo(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getVideoNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragVideoData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropVideo(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_VIDEO_COMMAND, data);
  }
  return true;
}

function getVideoNodeInSelection(): VideoNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isVideoNode(node) ? node : null;
}

function getDragVideoData(event: DragEvent): null | InsertVideoPayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const {type, data} = JSON.parse(dragData);
  if (type !== 'Video') {
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

function canDropVideo(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-video') &&
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
