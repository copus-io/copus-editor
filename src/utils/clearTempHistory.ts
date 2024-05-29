import {HistoryState} from '@lexical/react/LexicalHistoryPlugin';

// 清除历史纪录
export function clearTempHistory(node: any, historyState?: HistoryState) {
  if (historyState) {
    setTimeout(() => {
      const historyIndex = historyState.undoStack.findIndex((item) =>
        item.editorState._nodeMap.has(node.getKey()),
      );
      if (historyIndex !== -1) {
        historyState.undoStack.splice(historyIndex, 1);
      }
    });
  }
}
