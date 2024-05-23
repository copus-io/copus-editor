/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import {$applyNodeReplacement, DecoratorNode} from 'lexical';
import AudioComponent from './AudioComponent';

export interface AudioPayload {
  key?: NodeKey;
  src: string;
  controls?: boolean;
  autoplay?: boolean;
  uploading?: boolean;
}

function convertAudioElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLAudioElement) {
    const {src, autoplay, controls} = domNode;
    const node = $createAudioNode({src, autoplay, controls});
    return {node};
  }
  return null;
}

export type SerializedAudioNode = Spread<
  {
    src: string;
    controls: boolean;
    autoplay: boolean;
  },
  SerializedLexicalNode
>;

export class AudioNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __controls: boolean = true;
  __autoplay: boolean = false;
  __uploading: boolean = false;

  static getType(): string {
    return 'audio';
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(
      node.__src,
      node.__autoplay,
      node.__controls,
      node.__key,
      node.__uploading,
    );
  }

  static importJSON(serializedNode: SerializedAudioNode): AudioNode {
    const {src, autoplay, controls} = serializedNode;
    const node = $createAudioNode({
      src,
      autoplay,
      controls,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('audio');
    element.setAttribute('src', this.__src);
    // element.setAttribute('alt', this.__altText);
    element.setAttribute('controls', this.__controls.toString());
    // element.setAttribute('autoplay', this.__autoplay.toString());
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      audio: (node: Node) => ({
        conversion: convertAudioElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,

    autoplay?: boolean,
    controls?: boolean,
    key?: NodeKey,
    uploading?: boolean,
  ) {
    super(key);
    this.__src = src;
    this.__controls = controls || true;
    this.__autoplay = autoplay || false;
    this.__uploading = uploading || false;
  }

  exportJSON(): SerializedAudioNode {
    return {
      src: this.getSrc(),
      type: 'audio',
      autoplay: this.__autoplay,
      controls: this.__controls,
      version: 1,
    };
  }

  setAutoplay(autoplay: boolean): void {
    const writable = this.getWritable();
    writable.__autoplay = autoplay;
  }
  setControls(controls: boolean): void {
    const writable = this.getWritable();
    writable.__controls = controls;
  }

  setUploadState(uploading: boolean): void {
    const writable = this.getWritable();
    writable.__uploading = uploading;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.audio;
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
      <AudioComponent
        src={this.__src}
        nodeKey={this.getKey()}
        autoplay={this.__autoplay}
        controls={this.__controls}
        uploading={this.__uploading}
      />
    );
  }
}

export function $createAudioNode({
  src,
  autoplay,
  controls,
  key,
  uploading,
}: AudioPayload): AudioNode {
  return $applyNodeReplacement(
    new AudioNode(src, autoplay, controls, key, uploading),
  );
}

export function $isAudioNode(
  node: LexicalNode | null | undefined,
): node is AudioNode {
  return node instanceof AudioNode;
}
