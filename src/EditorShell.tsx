import {
  $createParagraphNode,
  $createRangeSelection,
  $getRoot,
  $isRangeSelection,
  EditorState,
  LexicalEditor,
} from 'lexical';
import { InitialConfigType } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $unwrapMarkNode, $wrapSelectionInMarkNode } from '@lexical/mark';
import Editor from './Editor';
import { ToolbarConfig } from './plugins/ToolbarPlugin';
import { $isMarkNodeX, MarkNodeX, MarkXType } from './nodes/MarkNodeX';
import styles from './style.module.less';
import { forwardRef, Ref, RefObject, useImperativeHandle } from 'react';
import { ParagraphNodeX } from './nodes/ParagraphNodeX';

export interface EditorShellProps {
  readOnly?: boolean;
  onChange?: (editorState: EditorState, html: string) => void;
  initialValue?: InitialConfigType['editorState'];
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
  copus?: {
    createMark?: (params: MarkXType) => Promise<MarkXType>;
    getMarkInfo?: (ids: string[]) => Promise<any[]>;
  };
}

export type EditorShellRef = {
  attachMarkList: (markList: MarkXType[]) => void;
  clearMarkList: () => void;
};

export default forwardRef(function EditorShell(props: EditorShellProps, ref: Ref<EditorShellRef>) {
  const [editor] = useLexicalComposerContext();

  const attachMarkList = (markList: MarkXType[]) => {
    markList?.forEach((mark) => {
      editor.update(() => {
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
            $wrapSelectionInMarkNode(rangeSelection, false, mark.id, (ids) => {
              return new MarkNodeX({ ids, source: Boolean(mark.sourceCount), branch: Boolean(mark.downstreamCount) });
            });
          }
        }
      });
    });
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
  }));

  return (
    <div className={styles['copus-editor-shell']}>
      <Editor
        onChange={props.onChange}
        readOnly={props.readOnly}
        toolbar={props.toolbar}
        showLabel={props.showLabel}
        copus={props.copus}
      />
    </div>
  );
});
