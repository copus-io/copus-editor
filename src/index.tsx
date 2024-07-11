/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { SharedAutocompleteContext } from './context/SharedAutocompleteContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { FlashMessageContext } from './context/FlashMessageContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import { TableContext } from './plugins/TablePlugin';
import CopusEditorTheme from './themes/CopusEditorTheme';
import styles from './style.module.less';
import { useCallback, useEffect } from 'react';
import getEditorPortal from './utils/getEditorPortal';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createRangeSelectionFromDom,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  EditorState,
  LexicalEditor,
  SerializedEditorState,
  TextNode,
} from 'lexical';
import { ToolbarConfig } from './plugins/ToolbarPlugin';
import { $createTextNodeX, TextNodeX } from './nodes/TextNodeX';
import { MarkNodeX, MarkXType } from './nodes/MarkNodeX';
import { $wrapSelectionInMarkNode, MarkNode } from '@lexical/mark';
import { createUUID } from './utils/copus';

function handleCopusSource(initialCopusSource: string, createMark?: (params: MarkXType) => Promise<MarkXType>) {
  return (editor: LexicalEditor) => {
    const root = $getRoot();
    initialCopusSource.split('\n').forEach((line) => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNodeX(line));
      root.append(paragraph);
    });

    const allTextNodes = root.getAllTextNodes() as TextNodeX[];
    const anchor = allTextNodes[0];
    const focus = allTextNodes.length > 1 ? allTextNodes[allTextNodes.length - 1] : anchor;
    const rangeSelection = $createRangeSelection();
    rangeSelection.setTextNodeRange(anchor, 0, focus, focus.getTextContentSize());
    if (!$isRangeSelection(rangeSelection)) {
      return;
    }

    createMark?.({
      opusUuid: createUUID(),
      startNodeId: anchor.getId(),
      startNodeAt: 0,
      endNodeId: focus.getId(),
      endNodeAt: focus.getTextContentSize(),
    }).then((mark) => {
      editor.update(() => {
        if (mark?.id) {
          $wrapSelectionInMarkNode(rangeSelection, false, mark.id, (ids) => {
            return new MarkNodeX({ ids, source: true });
          });
        }
      });
    });
  };
}

export interface EditorProps {
  readOnly?: boolean;
  onChange?: (editorState: EditorState, html: string) => void;
  initialValue?: InitialConfigType['editorState'];
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
  copus?: {
    markList?: MarkXType[];
    copusCopy?: (params: MarkXType) => void;
    initialSource?: string;
    createMark?: (params: MarkXType) => Promise<MarkXType>;
  };
}

function App(props: EditorProps): JSX.Element {
  const { copus } = props;

  const initialConfig = {
    editorState:
      props.initialValue ?? (copus?.initialSource ? handleCopusSource(copus.initialSource, copus.createMark) : null),
    namespace: 'CopusEditor',
    nodes: [
      ...PlaygroundNodes,
      TextNodeX,
      {
        replace: TextNode,
        with: (node: TextNode) => {
          return new TextNodeX(node.__text);
        },
      },
      MarkNodeX,
      {
        replace: MarkNode,
        with: (node: MarkNode) => {
          return new MarkNodeX({ ids: node.__ids });
        },
      },
    ],
    onError: (error: Error) => {
      throw error;
    },
    theme: CopusEditorTheme,
    editable: false,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <div className={styles['copus-editor-shell']}>
              <Editor
                onChange={props.onChange}
                readOnly={props.readOnly}
                toolbar={props.toolbar}
                showLabel={props.showLabel}
                copus={props.copus}
              />
            </div>
          </SharedAutocompleteContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function Main(props: EditorProps): JSX.Element {
  useEffect(() => {
    getEditorPortal();
  }, []);

  return (
    <FlashMessageContext>
      <App {...props} />
    </FlashMessageContext>
  );
}
