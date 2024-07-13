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
import { $wrapSelectionInMarkNode } from '@lexical/mark';
import Editor from './Editor';
import { ToolbarConfig } from './plugins/ToolbarPlugin';
import { MarkNodeX, MarkXType } from './nodes/MarkNodeX';
import { $createTextNodeX, TextNodeX } from './nodes/TextNodeX';
import styles from './style.module.less';
import { forwardRef, Ref, RefObject, useImperativeHandle } from 'react';

export interface EditorShellProps {
  readOnly?: boolean;
  onChange?: (editorState: EditorState, html: string) => void;
  initialValue?: InitialConfigType['editorState'];
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
  copus?: {
    copusCopy?: (params: MarkXType) => void;
    createMark?: (params: MarkXType) => Promise<MarkXType>;
    getMarkInfo?: (ids: string[]) => Promise<any[]>;
  };
}

export type EditorShellRef = {
  attachCopySource: (initialCopusSource: string, createMark?: (params: MarkXType) => Promise<MarkXType>) => void;
  attachMarkList: (markList: MarkXType[]) => void;
};

export default forwardRef(function EditorShell(props: EditorShellProps, ref: Ref<EditorShellRef>) {
  const [editor] = useLexicalComposerContext();

  const attachCopySource = (initialCopusSource: string, createMark?: (params: MarkXType) => Promise<MarkXType>) => {
    editor.update(() => {
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
    });
  };

  const attachMarkList = (markList: MarkXType[]) => {
    markList?.forEach((mark) => {
      editor.update(() => {
        if (mark.id) {
          const root = $getRoot();
          const allTextNodes = root.getAllTextNodes() as TextNodeX[];
          let anchor = TextNodeX.getNodeById(mark.startNodeId);
          let focus = TextNodeX.getNodeById(mark.endNodeId);
          if (anchor && focus) {
            const anchorIndex = allTextNodes.indexOf(anchor);
            let anchorOffset = mark.startNodeAt;
            for (let i = anchorIndex; i < allTextNodes.length; i++) {
              const textSize = allTextNodes[i].getTextContentSize();
              if (textSize >= anchorOffset) {
                anchor = allTextNodes[i];
                break;
              } else {
                anchorOffset -= textSize;
              }
            }

            const focusIndex = allTextNodes.indexOf(focus);
            let focusOffset = mark.endNodeAt;
            for (let i = focusIndex; i < allTextNodes.length; i++) {
              const textSize = allTextNodes[i].getTextContentSize();
              if (textSize >= focusOffset) {
                focus = allTextNodes[i];
                break;
              } else {
                focusOffset -= textSize;
              }
            }

            const rangeSelection = $createRangeSelection();
            rangeSelection.setTextNodeRange(anchor, anchorOffset, focus, focusOffset);
            $wrapSelectionInMarkNode(rangeSelection, false, mark.id, (ids) => {
              return new MarkNodeX({ ids, source: Boolean(mark.sourceCount), branch: Boolean(mark.downstreamCount) });
            });
          }
        }
      });
    });
  };

  useImperativeHandle(ref, () => ({
    attachCopySource,
    attachMarkList,
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
