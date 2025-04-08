/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import {$applyNodeReplacement, DecoratorNode} from 'lexical';
import FileComponent from './FileComponent';

export interface FilePayload {
  key?: NodeKey;
  name: string;
  src: string;
  uploading?: boolean;
  isAsync?: boolean;
}

export type SerializedFileNode = Spread<
  {
    name: string;
    src: string;
    isAsync?: boolean;
  },
  SerializedLexicalNode
>;

export class FileNode extends DecoratorNode<JSX.Element> {
  __name: string;
  __src: string;
  __uploading: boolean = false;
  __isAsync: boolean = false;

  static getType(): string {
    return 'file';
  }

  static clone(node: FileNode): FileNode {
    return new FileNode({
      src: node.__src,
      name: node.__name,
      key: node.__key,
      uploading: node.__uploading,
      isAsync: node.__isAsync,
    });
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const {src, name, isAsync} = serializedNode;
    const node = $createFileNode({
      name,
      src,
      isAsync,
    });
    return node;
  }

  constructor({src, name, key, uploading, isAsync}: FilePayload) {
    super(key);
    this.__name = name;
    this.__src = src;
    this.__uploading = uploading || false;
    this.__isAsync = isAsync || false;
  }

  exportJSON(): SerializedFileNode {
    const data: SerializedFileNode = {
      name: this.__name,
      src: this.__src,
      type: 'file',
      version: 1,
    };
    if (this.__isAsync) {
      data.isAsync = true;
    }
    return data;
  }

  setUploadState(uploading: boolean): void {
    const writable = this.getWritable();
    writable.__uploading = uploading;
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.file;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  decorate(): JSX.Element {
    return (
      <FileComponent
        name={this.__name}
        src={this.__src}
        nodeKey={this.getKey()}
        uploading={this.__uploading}
        isAsync={this.__isAsync}
      />
    );
  }
}

export function $createFileNode(props: FilePayload): FileNode {
  return $applyNodeReplacement(new FileNode(props));
}

export function $isFileNode(
  node: LexicalNode | null | undefined,
): node is FileNode {
  return node instanceof FileNode;
}
