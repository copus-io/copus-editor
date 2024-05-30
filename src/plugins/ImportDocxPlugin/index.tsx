/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot, mergeRegister} from '@lexical/utils';
import {
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import {useCallback, useEffect, useState} from 'react';

import {$createPageBreakNode, PageBreakNode} from '../../nodes/PageBreakNode';
import FileInput from '../../ui/FileInput';
import {DialogActions} from '../../ui/Dialog';
import Button from '../../ui/Button';
import useFlashMessage from '../../hooks/useFlashMessage';
// @ts-ignore
import mammoth from 'mammoth/mammoth.browser';
import {$generateNodesFromDOM} from '@lexical/html';
import editorUploadFiles from '../../utils/editorUploadFiles';

export type ImportDocxPayload = {
  file?: File;
};

export const INSERT_IMPORT_DOCX: LexicalCommand<ImportDocxPayload> =
  createCommand();

export default function ImportDocxPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<ImportDocxPayload>(
        INSERT_IMPORT_DOCX,
        () => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          const focusNode = selection.focus.getNode();
          if (focusNode !== null) {
            const pgBreak = $createPageBreakNode();
            $insertNodeToNearestRoot(pgBreak);
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}

export function ImportDocxDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File>();
  const [isConverting, setConverting] = useState(false);
  const [convertImageCount, setConvertImageCount] = useState(0);

  const showFlashMessage = useFlashMessage();

  const loadDocx = (files: FileList | null) => {
    if (files === null) {
      return;
    }

    setFile(files[0]);
  };

  const handleConvert = useCallback(async () => {
    if (file) {
      if (file.size > 500000000) {
        showFlashMessage('Word file size should be less than 10MB');
        return;
      }

      setConverting(true);
      let count = 0;
      try {
        const result = await mammoth.convertToHtml(
          {arrayBuffer: file},
          {
            convertImage: mammoth.images.imgElement(async (image: any) => {
              count++;
              setConvertImageCount(count);

              const imageBuffer = await image.read();
              const imageFile = new File(
                [imageBuffer],
                `image.${image.contentType.split('/')[1]}`,
                {type: image.contentType},
              );

              const res = await editorUploadFiles(imageFile, true);
              if (res.status === 1) {
                return {
                  src: res.data,
                };
              }
              return null;
            }),
          },
        );

        const html = result.value;
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');

        dom.querySelectorAll('table').forEach((table) => {
          const tds = table.querySelectorAll('td');
          tds.forEach((td) => {
            // 不支持百分比，这里简单处理
            const root = activeEditor._rootElement;
            if (root) {
              const style = root.computedStyleMap();
              const width =
                root.clientWidth -
                // @ts-ignore
                style?.get('padding-left')?.value -
                // @ts-ignore
                style?.get('padding-right')?.value;
              td.style.width = `${width / tds.length}px`;
            }
          });
        });

        activeEditor.update(() => {
          const nodes = $generateNodesFromDOM(activeEditor, dom);
          $insertNodes(nodes);
        });
      } catch (error) {
        showFlashMessage('Error converting Word file');
        console.error(error);
      }

      onClose();
    }
  }, [file, activeEditor, onClose, showFlashMessage]);

  return (
    <>
      <FileInput
        label="Word Upload"
        onChange={loadDocx}
        accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
      />
      <DialogActions>
        {convertImageCount > 0 && (
          <span>Convert Image {convertImageCount} ...</span>
        )}
        <Button disabled={!file || isConverting} onClick={handleConvert}>
          {isConverting ? 'Converting...' : 'Confirm'}
        </Button>
      </DialogActions>
    </>
  );
}
