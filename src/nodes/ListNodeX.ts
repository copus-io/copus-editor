import { NodeKey, LexicalNode, EditorConfig } from 'lexical';
import { createUID } from '../utils/copus';
import { ListNode, ListType, SerializedListNode } from '@lexical/list';

type SerializedListNodeX = SerializedListNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class ListNodeX extends ListNode {
  __id: string = '';
  constructor({ listType, start, key, id }: { listType: ListType; start: number; key?: NodeKey; id?: string }) {
    super(listType, start, key);
    id = id ?? keyIdMap.get(this.__key);
    if (id) {
      this.__id = id;
    } else {
      this.__id = ListNodeX.generateUID();
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
    return 'list-x';
  }

  static clone(node: ListNodeX): ListNodeX {
    return new ListNodeX({ listType: node.__listType, start: node.__start, key: node.__key });
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: ListNodeX, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importJSON(serializedNode: SerializedListNodeX): ListNodeX {
    const node = new ListNodeX({
      listType: serializedNode.listType,
      start: serializedNode.start,
      id: serializedNode.id,
    });
    return node;
  }

  exportJSON(): SerializedListNodeX {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'list-x',
    };
  }
}

export function $isListNodeX(node: LexicalNode | null | undefined): node is ListNodeX {
  return node instanceof ListNodeX;
}
