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

type SerializedExtendedTextNode = SerializedTextNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class ExtendedTextNode extends TextNode {
  __id: string = '';
  constructor(text: string, key?: NodeKey) {
    super(text, key);
    if (key) {
      const id = keyIdMap.get(key);
      if (id) {
        this.__id = id;
      } else {
        this.__id = ExtendedTextNode.generateUID();
        idList.add(this.__id);
        keyIdMap.set(key, this.__id);
      }
    } else {
      this.__id = ExtendedTextNode.generateUID();
      idList.add(this.__id);
    }
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

  static getNodeById(id: string): ExtendedTextNode | null {
    let node = null;
    for (const key of keyIdMap.keys()) {
      if (keyIdMap.get(key) === id) {
        const _node = $getNodeByKey(key) as ExtendedTextNode;
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

  static clone(node: ExtendedTextNode): ExtendedTextNode {
    return new ExtendedTextNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: ExtendedTextNode, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importDOM(): DOMConversionMap | null {
    return TextNode.importDOM();
  }

  static importJSON(serializedNode: SerializedExtendedTextNode): ExtendedTextNode {
    const node = new ExtendedTextNode(serializedNode.text);
    let id = serializedNode.id;
    if (idList.has(id)) {
      id = this.generateUID();
    }
    idList.add(id);
    keyIdMap.set(node.__key, serializedNode.id);

    return node;
  }

  isSimpleText() {
    return (this.__type === 'text' || this.__type === 'text-x') && this.__mode === 0;
  }

  exportJSON(): SerializedExtendedTextNode {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'text-x',
      version: 1,
    };
  }
}

export function $createExtendedTextNode(text: string): ExtendedTextNode {
  return new ExtendedTextNode(text);
}

export function $isExtendedTextNode(node: LexicalNode | null | undefined): node is ExtendedTextNode {
  return node instanceof ExtendedTextNode;
}
