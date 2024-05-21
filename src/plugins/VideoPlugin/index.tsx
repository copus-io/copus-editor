/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
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
import { useEffect, useRef, useState } from 'react';
import { CAN_USE_DOM } from '../../shared/canUseDOM';

import {
  $createVideoNode,
  $isVideoNode,
  VideoNode,
  VideoPayload,
} from '../../nodes/VideoNode';
import Button from '../../ui/Button';
import { DialogActions, DialogButtonsList } from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import EditorUploadFiles from '../../utils/editorUploadFiles';

export type InsertVideoPayload = Readonly<VideoPayload>;

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
        placeholder="i.e. https://source.unsplash.com/random"
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
          }
        >
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
  // const [src, setSrc] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);

  const [altText, setAltText] = useState('');
  const [Videofiles, setVideofiles] = useState<any>();
  const [uploading, setUploading] = useState(false);

  // console.log('imagefiles ===========', imagefiles);

  // const isDisabled = src === '';
  // const isDisabled = imagefiles === null;

  const loadFiles = async (files: FileList | null) => {
    if (files !== null) {
      setVideofiles(files);
      setIsDisabled(false);
      // console.log('EditorUploadFiles loadFiles', files[0]);
    } else {
      setIsDisabled(true);
    }

    // const reader = new FileReader();
    // reader.onload = function () {
    //   console.log('EditorUploadImage reader', reader);

    //   if (typeof reader.result === 'string') {
    //     setSrc(reader.result);
    //   }
    //   return '';
    // };
    // if (files !== null) {
    //   reader.readAsBinaryString(files[0]);
    // }
    // const res = await EditorUploadImage(files);
    // console.log('EditorUploadImage', res);
    // return '';
  };

  const onConfirm = () => {
    if (Videofiles !== null) {
      setIsDisabled(true);

      setUploading(true);

      EditorUploadFiles(Videofiles![0], 1).then((res) => {
        console.log('EditorUploadFiles', res);
        if (res.data.data) {
          // setSrc(res.data.data);
          onClick({
            src: res.data.data,
            // controls:true
          });
        }
        // return '';
        setIsDisabled(false);
      });
    }
  };

  return (
    <>
      <FileInput
        label="Video Upload"
        onChange={loadFiles}
        // accept="image/*"
        accept="Video/*"
        data-test-id="Video-modal-file-upload"
      />
      {/* <TextInput
        label="Alt Text"
        placeholder="Descriptive alternative text"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      /> */}
      <DialogActions>
        <Button
          data-test-id="Video-modal-file-upload-btn"
          disabled={isDisabled}
          // onClick={() => onClick({ altText, src })}
          onClick={onConfirm}
        >
          {uploading && (
            <span className="mr-2">
              <i className="fa fa-circle-o-notch fa-spin " />
            </span>
          )}
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
    console.log('payload', payload, activeEditor);
    activeEditor.dispatchCommand(INSERT_VIDEO_COMMAND, {
      ...payload,
    });
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          {/* <Button
            data-test-id="image-modal-option-sample"
            onClick={() => {
              onClick({
                src: 'https://cascads31.s3.ca-central-1.amazonaws.com/images/client/202309/prod/4bf6b25c0c6947b48115653c58a084af.m4a',
                autoplay: false,
                controls: true,
              });
            }}
          >
            Sample
          </Button> */}
          <Button
            data-test-id="Video-modal-option-url"
            onClick={() => setMode('url')}
          >
            URL
          </Button>
          <Button
            data-test-id="Video-modal-option-file"
            onClick={() => setMode('file')}
          >
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

  useEffect(() => {
    if (!editor.hasNodes([VideoNode])) {
      throw new Error('VideoPlugin: VideoNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertVideoPayload>(
        INSERT_VIDEO_COMMAND,
        (payload) => {
          const VideoNode = $createVideoNode(payload);
          $insertNodes([VideoNode]);
          if ($isRootOrShadowRoot(VideoNode.getParentOrThrow())) {
            $wrapNodeInElement(VideoNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH
      )
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
    })
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
  const { type, data } = JSON.parse(dragData);
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
