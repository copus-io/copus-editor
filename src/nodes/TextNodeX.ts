import {
  DOMConversionMap,
  NodeKey,
  TextNode,
  SerializedTextNode,
  LexicalNode,
  EditorConfig,
  $applyNodeReplacement,
  $getNodeByKey,
} from 'lexical';
import { createUID } from '../utils/copus';

type SerializedTextNodeX = SerializedTextNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class TextNodeX extends TextNode {
  __id: string = '';
  constructor(text: string, key?: NodeKey, id?: string) {
    super(text, key);
    id = id ?? keyIdMap.get(this.__key);
    if (id) {
      this.__id = id;
    } else {
      this.__id = TextNodeX.generateUID();
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

  static getNodeById(id: string): TextNodeX | null {
    let node = null;
    for (const key of keyIdMap.keys()) {
      if (keyIdMap.get(key) === id) {
        const _node = $getNodeByKey(key) as TextNodeX;
        if (_node) {
          node = _node;
        }
      }
    }
    return node;
  }

  static getType(): string {
    return 'text-x';
  }

  static clone(node: TextNodeX): TextNodeX {
    return new TextNodeX(node.__text, node.__key);
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: TextNodeX, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importDOM(): DOMConversionMap | null {
    return TextNode.importDOM();
  }

  static importJSON(serializedNode: SerializedTextNodeX): TextNodeX {
    const node = new TextNodeX(serializedNode.text, undefined, serializedNode.id);
    return node;
  }

  isSimpleText() {
    return (this.__type === 'text' || this.__type === 'text-x') && this.__mode === 0;
  }

  exportJSON(): SerializedTextNodeX {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'text-x',
      version: 1,
    };
  }
}

export function $createTextNodeX(text: string): TextNodeX {
  return new TextNodeX(text);
}

export function $isTextNodeX(node: LexicalNode | null | undefined): node is TextNodeX {
  return node instanceof TextNodeX;
}
