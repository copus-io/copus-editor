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
  source: number;
  branch: number;
};

export class MarkNodeX extends MarkNode {
  __sourceCount: number;
  __branchCount: number;
  constructor(props: { ids: Array<string>; key?: NodeKey; source?: number; branch?: number }) {
    const { ids, key, source, branch } = props;
    super(ids, key);
    this.__sourceCount = source ?? 0;
    this.__branchCount = branch ?? 0;
  }

  static getType(): string {
    return 'mark-x';
  }

  static clone(node: MarkNodeX): MarkNodeX {
    return new MarkNodeX({ ids: node.__ids, key: node.__key });
  }

  getSourceCount(): number {
    return this.__sourceCount;
  }

  getBranchCount(): number {
    return this.__branchCount;
  }

  setSourceCount(count: number) {
    const writable = this.getWritable();
    writable.__sourceCount = count;
  }

  setBranchCount(count: number) {
    const writable = this.getWritable();
    writable.__branchCount = count;
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    if (this.__sourceCount) {
      dom.dataset.source = this.__sourceCount.toString();
    }
    if (this.__branchCount) {
      dom.dataset.branch = this.__branchCount.toString();
    }
    dom.dataset.ids = this.__ids.join(',');
    return dom;
  }

  updateDOM(prevNode: MarkNodeX, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__sourceCount) {
      dom.dataset.source = this.__sourceCount.toString();
    } else {
      delete dom.dataset.source;
    }
    if (this.__branchCount) {
      dom.dataset.branch = this.__branchCount.toString();
    } else {
      delete dom.dataset.branch;
    }
    dom.dataset.ids = this.__ids.join(',');
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
      source: this.__sourceCount,
      branch: this.__branchCount,
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
