import {
  DOMConversionMap,
  NodeKey,
  ParagraphNode,
  SerializedParagraphNode,
  LexicalNode,
  EditorConfig,
  $applyNodeReplacement,
  $getNodeByKey,
} from 'lexical';
import { createUID } from '../utils/copus';

type SerializedParagraphNodeX = SerializedParagraphNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class ParagraphNodeX extends ParagraphNode {
  __id: string = '';
  constructor({ key, id }: { key?: NodeKey; id?: string } = {}) {
    super(key);
    id = id ?? keyIdMap.get(this.__key);
    if (id) {
      this.__id = id;
    } else {
      this.__id = ParagraphNodeX.generateUID();
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
    return 'paragraph-x';
  }

  static clone(node: ParagraphNodeX): ParagraphNodeX {
    return new ParagraphNodeX({ key: node.__key });
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: ParagraphNodeX, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importDOM(): DOMConversionMap | null {
    return ParagraphNode.importDOM();
  }

  static importJSON(serializedNode: SerializedParagraphNodeX): ParagraphNodeX {
    const node = new ParagraphNodeX({ id: serializedNode.id });
    return node;
  }

  exportJSON(): SerializedParagraphNodeX {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'paragraph-x',
    };
  }
}

export function $createParagraphNodeX(): ParagraphNodeX {
  return new ParagraphNodeX();
}

export function $isParagraphNodeX(node: LexicalNode | null | undefined): node is ParagraphNodeX {
  return node instanceof ParagraphNodeX;
}
