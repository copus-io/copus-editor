import { EditorState, ParagraphNode } from 'lexical';
import { ParagraphNodeX } from '../nodes/ParagraphNodeX';
import { HeadingNodeX } from '../nodes/HeadingNodeX';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode } from '@lexical/list';
import { ListNodeX } from '../nodes/ListNodeX';
import { QuoteNodeX } from '../nodes/QuoteNodeX';
import { CodeNode } from '@lexical/code';
import { CodeNodeX } from '../nodes/CodeNodeX';
import PlaygroundNodes from './PlaygroundNodes';
import { MarkNodeX } from './MarkNodeX';
import { MarkNode } from '@lexical/mark';

export default [
  ...PlaygroundNodes,
  ParagraphNodeX,
  {
    replace: ParagraphNode,
    with: (node: ParagraphNode) => {
      return new ParagraphNodeX();
    },
  },
  HeadingNodeX,
  {
    replace: HeadingNode,
    with: (node: HeadingNode) => {
      return new HeadingNodeX({ tag: node.__tag });
    },
  },
  ListNodeX,
  {
    replace: ListNode,
    with: (node: ListNode) => {
      return new ListNodeX({ listType: node.__listType, start: node.__start });
    },
  },
  QuoteNodeX,
  {
    replace: QuoteNode,
    with: (node: QuoteNode) => {
      return new QuoteNodeX({});
    },
  },
  // CodeNodeX,
  // {
  //   replace: CodeNode,
  //   with: (node: CodeNode) => {
  //     console.log('node.__language', node.__language);
  //     return new CodeNodeX({ language: node.__language });
  //   },
  // },
  MarkNodeX,
  {
    replace: MarkNode,
    with: (node: MarkNode) => {
      return new MarkNodeX({ ids: node.__ids });
    },
  },
];
