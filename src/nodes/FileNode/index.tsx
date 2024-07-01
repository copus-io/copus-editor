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
}

export type SerializedFileNode = Spread<
  {
    name: string;
    src: string;
  },
  SerializedLexicalNode
>;

export class FileNode extends DecoratorNode<JSX.Element> {
  __name: string;
  __src: string;
  __uploading: boolean = false;

  static getType(): string {
    return 'file';
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__src, node.__name, node.__key, node.__uploading);
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const {src, name} = serializedNode;
    const node = $createFileNode({
      name,
      src,
    });
    return node;
  }

  constructor(src: string, name: string, key?: NodeKey, uploading?: boolean) {
    super(key);
    this.__name = name;
    this.__src = src;
    this.__uploading = uploading || false;
  }

  exportJSON(): SerializedFileNode {
    return {
      name: this.__name,
      src: this.__src,
      type: 'file',
      version: 1,
    };
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
      />
    );
  }
}

export function $createFileNode({
  src,
  name,
  key,
  uploading,
}: FilePayload): FileNode {
  return $applyNodeReplacement(new FileNode(src, name, key, uploading));
}

export function $isFileNode(
  node: LexicalNode | null | undefined,
): node is FileNode {
  return node instanceof FileNode;
}
