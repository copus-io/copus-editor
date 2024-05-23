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
import * as React from 'react';
import VideoComponent from './VideoComponent';

export interface VideoPayload {
  key?: NodeKey;
  src: string;
  controls?: boolean;
  autoplay?: boolean;
  height?: number;
  width?: number;
  uploading?: boolean;
}

function convertVideoElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLVideoElement) {
    console.log('domNode', domNode);
    const {src, autoplay, controls, width, height} = domNode;
    const node = $createVideoNode({src, autoplay, controls, width, height});
    return {node};
  }
  return null;
}

export type SerializedVideoNode = Spread<
  {
    src: string;

    controls: boolean;

    autoplay: boolean;

    height?: number;
    width?: number;
  },
  SerializedLexicalNode
>;

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __controls: boolean = true;
  __autoplay: boolean = false;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __uploading: boolean = false;
  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(
      node.__src,
      node.__autoplay,
      node.__controls,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const {src, autoplay, controls, width, height} = serializedNode;
    const node = $createVideoNode({
      src,
      autoplay,
      controls,
      width,
      height,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('video');
    element.setAttribute('src', this.__src);
    // element.setAttribute('alt', this.__altText);
    element.setAttribute('controls', this.__controls.toString());
    element.setAttribute('autoplay', this.__autoplay.toString());
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
    return {element};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      video: (node: Node) => ({
        conversion: convertVideoElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    autoplay?: boolean,
    controls?: boolean,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    key?: NodeKey,
    uploading?: boolean,
  ) {
    super(key);
    this.__src = src;
    this.__controls = controls || true;
    this.__autoplay = autoplay || false;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__uploading = uploading || false;
  }

  exportJSON(): SerializedVideoNode {
    return {
      // altText: this.getAltText(),
      // caption: this.__caption.toJSON(),
      // showCaption: this.__showCaption,
      src: this.getSrc(),
      type: 'video',
      autoplay: this.__autoplay,
      controls: this.__controls,
      height: this.__height === 'inherit' ? 0 : this.__height,
      width: this.__width === 'inherit' ? 0 : this.__width,

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
  // View
  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setUploadState(uploading: boolean): void {
    const writable = this.getWritable();
    writable.__uploading = uploading;
  }

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
      <VideoComponent
        src={this.__src}
        nodeKey={this.getKey()}
        autoplay={this.__autoplay}
        controls={this.__controls}
        width={this.__width}
        height={this.__height}
        uploading={this.__uploading}
      />
    );
  }
}

export function $createVideoNode({
  src,
  autoplay,
  controls,
  width,
  height,
  key,
  uploading,
}: VideoPayload): VideoNode {
  return $applyNodeReplacement(
    new VideoNode(src, autoplay, controls, width, height, key, uploading),
  );
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}
