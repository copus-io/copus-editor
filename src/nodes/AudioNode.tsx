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

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import * as React from 'react';
import AudioComponent from './AudioComponent';

export interface AudioPayload {
  key?: NodeKey;
  src: string;
  controls?: boolean;
  autoplay?: boolean;
}

function convertAudioElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLAudioElement) {
    console.log('domNode', domNode);
    const { src, autoplay, controls } = domNode;
    const node = $createAudioNode({ src, autoplay, controls });
    return { node };
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

  static getType(): string {
    return 'audio';
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(
      node.__src,
      node.__autoplay,
      node.__controls,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedAudioNode): AudioNode {
    const { src, autoplay, controls } = serializedNode;
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
    return { element };
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
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__controls = controls || true;
    this.__autoplay = autoplay || false;
  }

  exportJSON(): SerializedAudioNode {
    return {
      // altText: this.getAltText(),
      // caption: this.__caption.toJSON(),
      // height: this.__height === 'inherit' ? 0 : this.__height,
      // maxWidth: this.__maxWidth,
      // showCaption: this.__showCaption,
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

  decorate(): JSX.Element {
    console.log('this.__src', this.__src, this.__autoplay, this.__controls);
    return (
      <AudioComponent
        src={this.__src}
        nodeKey={this.getKey()}
        autoplay={this.__autoplay}
        controls={this.__controls}
      />
    );
  }

  // decorate(): JSX.Element {
  //   console.log('decorate', this.getKey());
  //   return (
  //     <Suspense fallback={null}>
  //       <ImageComponent
  //         src={this.__src}
  //         altText={this.__altText}
  //         width={this.__width}
  //         height={this.__height}
  //         maxWidth={this.__maxWidth}
  //         nodeKey={this.getKey()}
  //         showCaption={this.__showCaption}
  //         caption={this.__caption}
  //         captionsEnabled={this.__captionsEnabled}
  //         resizable={true}
  //       />
  //     </Suspense>
  //   );
  // }
}
// function AudioComponent({
//   src,
//   nodeKey,
//   controls,
//   autoplay,
// }: {
//   nodeKey: NodeKey;
//   src: string;
//   controls: boolean;
//   autoplay: boolean;
// }): JSX.Element {
//   // const [suggestion] = useSharedAutocompleteContext();
//   // const userAgentData = window.navigator.userAgentData;
//   // const isMobile =
//   //   userAgentData !== undefined
//   //     ? userAgentData.mobile
//   //     : window.innerWidth <= 800 && window.innerHeight <= 600;
//   // TODO Move to theme
//   return (
//     <Suspense fallback={null}>
//       <div>
//         <audio src={src} autoPlay={false} controls={controls} />
//       </div>
//     </Suspense>
//     // <span style={{ color: '#ccc' }} spellCheck="false">
//     //   {/* {suggestion} {isMobile ? '(SWIPE \u2B95)' : '(TAB)'} */}
//     //   <audio src={src} controls autoPlay></audio>
//     // </span>
//   );
// }

export function $createAudioNode({
  src,
  autoplay,
  controls,
  key,
}: AudioPayload): AudioNode {
  return $applyNodeReplacement(new AudioNode(src, autoplay, controls, key));
}

export function $isAudioNode(
  node: LexicalNode | null | undefined
): node is AudioNode {
  return node instanceof AudioNode;
}
