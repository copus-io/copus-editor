import { NodeKey, LexicalNode, EditorConfig } from 'lexical';
import { createUID } from '../utils/copus';
import { QuoteNode, SerializedQuoteNode } from '@lexical/rich-text';

type SerializedQuoteNodeX = SerializedQuoteNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class QuoteNodeX extends QuoteNode {
  __id: string = '';
  constructor({ key, id }: { key?: NodeKey; id?: string }) {
    super(key);
    id = id ?? keyIdMap.get(this.__key);
    if (id) {
      this.__id = id;
    } else {
      this.__id = QuoteNodeX.generateUID();
    }
    idList.add(this.__id);
    keyIdMap.set(this.__key, this.__id);
  }
  static generateUID(): string {
    const uid = createUID();
    if (idList.has(uid)) {
      return this.generateUID();
    }
    return uid;
  }

  getId() {
    return this.__id;
  }

  static getType(): string {
    return 'quote-x';
  }

  static clone(node: QuoteNodeX): QuoteNodeX {
    return new QuoteNodeX({ key: node.__key });
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: QuoteNodeX, dom: HTMLElement) {
    const updated = super.updateDOM(prevNode, dom);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importJSON(serializedNode: SerializedQuoteNodeX): QuoteNodeX {
    const node = new QuoteNodeX({
      id: serializedNode.id,
    });
    return node;
  }

  exportJSON(): SerializedQuoteNodeX {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'quote-x',
    };
  }
}

export function $isQuoteNodeX(node: LexicalNode | null | undefined): node is QuoteNodeX {
  return node instanceof QuoteNodeX;
}
