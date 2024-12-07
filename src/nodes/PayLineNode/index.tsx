/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import { useCallback, useEffect } from 'react';

export type SerializedPayLineNode = SerializedLexicalNode;

function PayLineComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      if (isSelected && $isNodeSelection($getSelection())) {
        const node = $getNodeByKey(nodeKey);
        if ($isPayLineNode(node)) {
          node.remove();
          return true;
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const pbElem = editor.getElementByKey(nodeKey);

          if (event.target === pbElem) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    );
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected]);

  useEffect(() => {
    const pbElem = editor.getElementByKey(nodeKey);
    if (pbElem !== null) {
      pbElem.className = isSelected ? 'selected' : '';
    }
  }, [editor, isSelected, nodeKey]);

  return null;
}

export class PayLineNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'pay-line';
  }

  static clone(node: PayLineNode): PayLineNode {
    return new PayLineNode(node.__key);
  }

  static importJSON(serializedNode: SerializedPayLineNode): PayLineNode {
    return $createPayLineNode();
  }

  static importDOM(): DOMConversionMap | null {
    return {
      fieldset: (domNode: HTMLElement) => {
        const tp = domNode.getAttribute('type');
        if (tp !== this.getType()) {
          return null;
        }

        return {
          conversion: $convertPayLineElement,
          priority: COMMAND_PRIORITY_HIGH,
        };
      },
    };
  }

  exportJSON(): SerializedLexicalNode {
    return {
      type: this.getType(),
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const el = document.createElement('fieldset');
    el.setAttribute('type', this.getType());
    el.innerHTML = '<legend>Pay to unlock the rest of the content</legend>';
    return el;
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): false {
    return false;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <PayLineComponent nodeKey={this.__key} />;
  }
}

function $convertPayLineElement(): DOMConversionOutput {
  return { node: $createPayLineNode() };
}

export function $createPayLineNode(): PayLineNode {
  return new PayLineNode();
}

export function $isPayLineNode(node: LexicalNode | null | undefined): node is PayLineNode {
  return node instanceof PayLineNode;
}
