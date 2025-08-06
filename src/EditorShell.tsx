import {
  $createParagraphNode,
  $createRangeSelection,
  $getRoot,
  $isRangeSelection,
  EditorState,
  LexicalEditor,
  SerializedEditorState,
  SerializedLexicalNode,
} from 'lexical';
import { InitialConfigType } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $unwrapMarkNode, $wrapSelectionInMarkNode } from '@lexical/mark';
import Editor from './Editor';
import { ToolbarConfig } from './plugins/ToolbarPlugin';
import { $isMarkNodeX, MarkNodeX, MarkXType } from './nodes/MarkNodeX';
import styles from './style.module.less';
import { forwardRef, Ref, RefObject, useImperativeHandle, useRef } from 'react';
import { ParagraphNodeX } from './nodes/ParagraphNodeX';

export const copusEditorEhellStyle = styles['copus-editor-shell'];

export interface EditorShellProps {
  readOnly?: boolean;
  onChange?: (
    editorState: EditorState,
    opts: { html: string; publicContent: SerializedEditorState<SerializedLexicalNode> },
  ) => void;
  initialValue?: InitialConfigType['editorState'];
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
  copus?: {
    opusUuid?: string;
    opusId?: number;
    createMark?: (params: MarkXType) => Promise<MarkXType>;
    getMarkInfo?: (ids: string[]) => Promise<any[]>;
  };
  maxLength?: number;
}

export type EditorShellRef = {
  attachMarkList: (markList: MarkXType[]) => void;
  clearMarkList: () => void;
  removeMark: (id: string) => void;
};

export default forwardRef(function EditorShell(props: EditorShellProps, ref: Ref<EditorShellRef>) {
  const [editor] = useLexicalComposerContext();

  const markMap = useRef<Map<string, { source: number; branch: number }>>(new Map());

  const updateSourceBranchCount = () => {
    editor.update(() => {
      const editorState = editor.getEditorState();
      editorState._nodeMap.forEach((node) => {
        if ($isMarkNodeX(node)) {
          const ids = node.getIDs();
          const count = {
            source: 0,
            branch: 0,
          };
          ids.forEach((id) => {
            const mark = markMap.current.get(id);
            if (mark) {
              count.source += mark.source;
              count.branch += mark.branch;
            }
          });
          node.setSourceCount(count.source);
          node.setBranchCount(count.branch);
        }
      });
    });
  };

  const attachMarkList = (markList?: MarkXType[]) => {
    if (!markList) {
      return;
    }

    markList.forEach((mark) => {
      if (mark.id) {
        markMap.current.set(mark.id, { source: mark.sourceCount ?? 0, branch: mark.downstreamCount ?? 0 });
      }
    });

    editor.update(
      () => {
        markList.forEach((mark) => {
          if (mark.id) {
            const root = $getRoot();
            const allTopNodes = root.getChildren() as ParagraphNodeX[];
            const anchorP = allTopNodes.find((p) => p.__id === mark.startNodeId);
            const focusP = allTopNodes.find((p) => p.__id === mark.endNodeId);
            if (anchorP && focusP) {
              const anchorTextNodeList = anchorP.getAllTextNodes();
              if (anchorTextNodeList.length === 0) {
                return;
              }
              let anchorT = anchorTextNodeList[0];
              let anchorTOffset = mark.startNodeAt;
              for (let i = 0; i < anchorTextNodeList.length; i++) {
                const textSize = anchorTextNodeList[i].getTextContentSize();
                if (textSize >= anchorTOffset) {
                  anchorT = anchorTextNodeList[i];
                  break;
                } else {
                  anchorTOffset -= textSize;
                }
              }

              const focusTextNodeList = focusP.getAllTextNodes();
              if (focusTextNodeList.length === 0) {
                return;
              }
              let focusT = focusTextNodeList[0];
              let focusTOffset = mark.endNodeAt;
              for (let i = 0; i < focusTextNodeList.length; i++) {
                const textSize = focusTextNodeList[i].getTextContentSize();
                if (textSize >= focusTOffset) {
                  focusT = focusTextNodeList[i];
                  break;
                } else {
                  focusTOffset -= textSize;
                }
              }

              const rangeSelection = $createRangeSelection();
              rangeSelection.setTextNodeRange(anchorT, anchorTOffset, focusT, focusTOffset);
              $wrapSelectionInMarkNode(rangeSelection, false, mark.id);
            }
          }
        });
      },
      {
        onUpdate: updateSourceBranchCount,
      },
    );
  };

  const removeMark = (id: string) => {
    editor.update(
      () => {
        const editorState = editor.getEditorState();
        editorState._nodeMap.forEach((node) => {
          if ($isMarkNodeX(node) && node.hasID(id)) {
            node.deleteID(id);
            markMap.current.delete(id);
            if (node.getIDs().length === 0) {
              $unwrapMarkNode(node);
            }
          }
        });
      },
      { onUpdate: updateSourceBranchCount },
    );
  };

  const clearMarkList = () => {
    editor.update(() => {
      const editorState = editor.getEditorState();
      editorState._nodeMap.forEach((node) => {
        if ($isMarkNodeX(node)) {
          $unwrapMarkNode(node);
        }
      });
    });
  };

  useImperativeHandle(ref, () => ({
    attachMarkList,
    clearMarkList,
    removeMark,
  }));

  return (
    <div className={styles['copus-editor-shell']}>
      <Editor
        onChange={props.onChange}
        readOnly={props.readOnly}
        toolbar={props.toolbar}
        showLabel={props.showLabel}
        copus={props.copus}
        maxLength={props.maxLength}
      />
    </div>
  );
});
