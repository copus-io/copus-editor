import {HistoryState} from '@lexical/react/LexicalHistoryPlugin';

// 清除历史纪录
export function clearTempHistory(node: any, historyState?: HistoryState) {
  if (historyState) {
    setTimeout(() => {
      // console.log('historyState', historyState);
      const historyIndex = historyState.undoStack.findIndex((item) =>
        item.editorState._nodeMap.has(node.getKey()),
      );
      // console.log('historyIndex', historyIndex);
      if (historyIndex !== -1) {
        // 删除 loading 状态的记录
        historyState.undoStack.splice(historyIndex);

        // // 更新从 historyIndex 开始的记录
        // for (let i = historyIndex; i < historyState.undoStack.length; i++) {
        //   const stack = historyState.undoStack[i];
        //   stack.editorState._nodeMap.set(node.getKey(), node);
        // }
      }
      // console.log('historyState.undoStack2', historyState.undoStack);
    });
  }
}
