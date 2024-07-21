import { NodeKey, LexicalNode, EditorConfig, $applyNodeReplacement, $getNodeByKey } from 'lexical';
import { MarkNode, SerializedMarkNode } from '@lexical/mark';

export type MarkXType = {
  opusUuid?: string;
  opusId?: number;
  id?: string;
  startNodeId: string;
  startNodeAt: number;
  endNodeId: string;
  endNodeAt: number;
  downstreamCount?: number;
  sourceCount?: number;
  textContent?: string;
  sourceLink?: string;
};

type SerializedMarkNodeX = SerializedMarkNode & {
  source: boolean;
  branch: boolean;
};

export class MarkNodeX extends MarkNode {
  private __hasSource: boolean;
  private __hasBranch: boolean;
  constructor(props: { ids: Array<string>; key?: NodeKey; source?: boolean; branch?: boolean }) {
    const { ids, key, source, branch } = props;
    super(ids, key);
    this.__hasSource = source ?? false;
    this.__hasBranch = branch ?? false;
  }

  static getType(): string {
    return 'mark-x';
  }

  static clone(node: MarkNodeX): MarkNodeX {
    return new MarkNodeX({ ids: node.__ids, key: node.__key });
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    if (this.__hasSource) {
      dom.dataset.source = '1';
    }
    if (this.__hasBranch) {
      dom.dataset.branch = '1';
    }
    dom.dataset.ids = this.__ids.join(',');
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
    const node = new MarkNodeX({
      ids: serializedNode.ids,
      branch: serializedNode.branch,
      source: serializedNode.source,
    });
    return node;
  }

  exportJSON(): SerializedMarkNodeX {
    return {
      ...super.exportJSON(),
      type: 'mark-x',
      source: this.__hasSource,
      branch: this.__hasBranch,
      version: 1,
    };
  }
}

export function $createMarkNodeX(ids: string[]): MarkNodeX {
  return new MarkNodeX({ ids });
}

export function $isMarkNodeX(node: LexicalNode | null | undefined): node is MarkNodeX {
  return node instanceof MarkNodeX;
}
