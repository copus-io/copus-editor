import { NodeKey, LexicalNode, EditorConfig } from 'lexical';
import { createUID } from '../utils/copus';
import { HeadingNode, HeadingTagType, SerializedHeadingNode } from '@lexical/rich-text';

type SerializedHeadingNodeX = SerializedHeadingNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class HeadingNodeX extends HeadingNode {
  __id: string = '';
  constructor({ key, id, tag }: { key?: NodeKey; id?: string; tag: HeadingTagType }) {
    super(tag, key);
    id = id ?? keyIdMap.get(this.__key);
    if (id) {
      this.__id = id;
    } else {
      this.__id = HeadingNodeX.generateUID();
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
    return 'heading-x';
  }

  static clone(node: HeadingNodeX): HeadingNodeX {
    return new HeadingNodeX({ key: node.__key, tag: node.__tag });
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: HeadingNodeX, dom: HTMLElement) {
    const updated = super.updateDOM(prevNode, dom);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importJSON(serializedNode: SerializedHeadingNodeX): HeadingNodeX {
    const node = new HeadingNodeX({ id: serializedNode.id, tag: serializedNode.tag });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedHeadingNodeX {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'heading-x',
    };
  }
}

export function $isHeadingNodeX(node: LexicalNode | null | undefined): node is HeadingNodeX {
  return node instanceof HeadingNodeX;
}
