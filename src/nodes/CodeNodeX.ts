import { NodeKey, LexicalNode, EditorConfig } from 'lexical';
import { createUID } from '../utils/copus';
import { CodeNode, SerializedCodeNode } from '@lexical/code';

type SerializedCodeNodeX = SerializedCodeNode & { id: string };

const keyIdMap = new Map<NodeKey, string>();
const idList = new Set<string>();

export class CodeNodeX extends CodeNode {
  __id: string = '';
  constructor({ language, key, id }: { language?: SerializedCodeNodeX['language']; key?: NodeKey; id?: string }) {
    super(language, key);
    id = id ?? keyIdMap.get(this.__key);
    if (id) {
      this.__id = id;
    } else {
      this.__id = CodeNodeX.generateUID();
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
    return 'code-x';
  }

  static clone(node: CodeNodeX): CodeNodeX {
    return new CodeNodeX({ language: node.__language, key: node.__key });
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.dataset.id = this.__id;
    return dom;
  }

  updateDOM(prevNode: CodeNodeX, dom: HTMLElement, config: EditorConfig) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__id !== prevNode.__id) {
      dom.setAttribute('data-id', this.__id);
    }
    return updated;
  }

  static importJSON(serializedNode: SerializedCodeNodeX): CodeNodeX {
    const node = new CodeNodeX({
      id: serializedNode.id,
      language: serializedNode.language,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedCodeNodeX {
    return {
      ...super.exportJSON(),
      id: this.__id,
      type: 'code-x',
    };
  }
}

export function $isCodeNodeX(node: LexicalNode | null | undefined): node is CodeNodeX {
  return node instanceof CodeNodeX;
}
