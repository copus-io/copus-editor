/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Klass, LexicalNode} from 'lexical';

import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {HashtagNode} from '@lexical/hashtag';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {MarkNode} from '@lexical/mark';
import {OverflowNode} from '@lexical/overflow';
import {HorizontalRuleNode} from '@lexical/react/LexicalHorizontalRuleNode';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';

import {CollapsibleContainerNode} from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import {CollapsibleContentNode} from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import {CollapsibleTitleNode} from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import {ImageNode} from './ImageNode';
import {AudioNode} from './AudioNode';
import {VideoNode} from './VideoNode';
import {InlineImageNode} from './InlineImageNode';
import {KeywordNode} from './KeywordNode';
import {LayoutContainerNode} from './LayoutContainerNode';
import {LayoutItemNode} from './LayoutItemNode';
import {PageBreakNode} from './PageBreakNode';
import {PayLineNode} from './PayLineNode';
import {TweetNode} from './TweetNode';
import {YouTubeNode} from './YouTubeNode';
import { EmojiNode } from './EmojiNode';
import { FileNode } from './FileNode';

const PlaygroundNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  // PollNode,
  // StickyNode,
  ImageNode,
  AudioNode,
  VideoNode,
  FileNode,
  // InlineImageNode,
  // MentionNode,
  EmojiNode,
  // EquationNode,
  // AutocompleteNode,
  KeywordNode,
  HorizontalRuleNode,
  // TweetNode,
  YouTubeNode,
  // FigmaNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  PageBreakNode,
  PayLineNode,
  LayoutContainerNode,
  LayoutItemNode,
];

export default PlaygroundNodes;
