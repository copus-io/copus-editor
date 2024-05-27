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
import {useEffect, useState} from 'react';

import {$createPageBreakNode, PageBreakNode} from '../../nodes/PageBreakNode';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import {DialogActions} from '../../ui/Dialog';
import Button from '../../ui/Button';
import useFlashMessage from '../../hooks/useFlashMessage';
import mammoth from 'mammoth/mammoth.browser';
import {$generateNodesFromDOM} from '@lexical/html';

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

  const showFlashMessage = useFlashMessage();

  const loadDocx = (files: FileList | null) => {
    if (files === null) {
      return;
    }

    setFile(files[0]);
  };

  return (
    <>
      <FileInput
        label="Word Upload"
        onChange={loadDocx}
        accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
      />
      <DialogActions>
        <Button
          disabled={!file || isConverting}
          onClick={() => {
            if (file) {
              if (file.size > 500000000) {
                showFlashMessage('Word file size should be less than 10MB');
                return;
              }

              setConverting(true);
              mammoth
                .convertToHtml({arrayBuffer: file})
                .then(function (result) {
                  const html = result.value;
                  const parser = new DOMParser();
                  const dom = parser.parseFromString(html, 'text/html');
                  activeEditor.update(() => {
                    const nodes = $generateNodesFromDOM(activeEditor, dom);
                    $insertNodes(nodes);
                  });
                  onClose();
                })
                .catch(function (error) {
                  console.error(error);
                })
                .finally(() => {
                  setConverting(false);
                });

              // var reader = new FileReader();

              // reader.onload = function (loadEvent) {
              //   var arrayBuffer = loadEvent.target.result;
              //   mammoth
              //     .convertToHtml({arrayBuffer: arrayBuffer})
              //     .then(function (result) {
              //       console.log(result);
              //       var html = result.value; // The generated HTML
              //       var messages = result.messages; // Any messages, such as warnings during conversion
              //     })
              //     .catch(function (error) {
              //       console.error(error);
              //     });
              // };

              // reader.readAsArrayBuffer(file);

              // activeEditor.dispatchCommand(INSERT_IMPORT_DOCX, {file});
            }
          }}>
          {isConverting ? 'Converting...' : 'Confirm'}
        </Button>
      </DialogActions>
    </>
  );
}
