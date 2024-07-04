import { NodeKey, LexicalNode, EditorConfig, $applyNodeReplacement, $getNodeByKey } from 'lexical';
import { createUID } from '../utils/copus';
import { MarkNode, SerializedMarkNode } from '@lexical/mark';

export type MarkXType = {
  startNodeId: string;
  startNodeAt: number;
  endNodeId: string;
  endNodeAt: number;
};

type SerializedMarkNodeX = SerializedMarkNode & {};

export class MarkNodeX extends MarkNode {
  constructor(ids: Array<string>, key?: NodeKey) {
    super(ids, key);
  }

  static getType(): string {
    return 'mark-x';
  }

  static clone(node: MarkNodeX): MarkNodeX {
    return new MarkNodeX(node.__ids, node.__key);
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    // dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: MarkNodeX, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    // if (this.__id !== prevNode.__id) {
    //   dom.setAttribute('data-id', this.__id);
    // }
    return updated;
  }

  static importJSON(serializedNode: SerializedMarkNodeX): MarkNodeX {
    const node = new MarkNodeX(serializedNode.ids, undefined);
    return node;
  }

  exportJSON(): SerializedMarkNodeX {
    return {
      ...super.exportJSON(),
      type: 'mark-x',
      version: 1,
    };
  }
}

export function $createMarkNodeX(ids: string[]): MarkNodeX {
  return new MarkNodeX(ids);
}

export function $isMarkNodeX(node: LexicalNode | null | undefined): node is MarkNodeX {
  return node instanceof MarkNodeX;
}
