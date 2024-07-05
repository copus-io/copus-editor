/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useCallback, useEffect, useState } from 'react';
import { CAN_USE_DOM } from './shared/canUseDOM';

import { useSettings } from './context/SettingsContext';
import { useSharedHistoryContext } from './context/SharedHistoryContext';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import FloatingCopusToolbarPlugin from './plugins/FloatingCopusToolbarPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import InlineImagePlugin from './plugins/InlineImagePlugin';
import AudioPlugin from './plugins/AudioPlugin';
import VideoPlugin from './plugins/VideoPlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import { LayoutPlugin } from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import MarkdownShortcutPlugin from './plugins/MarkdownShortcutPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import ToolbarPlugin, { ToolbarConfig } from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import TwitterPlugin from './plugins/TwitterPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import Placeholder from './ui/Placeholder';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $createRangeSelection, EditorState, SerializedEditorState } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { debounce, set } from 'lodash-es';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import CopusPlugin from './plugins/CopusPlugin';
import { TextNodeX } from './nodes/TextNodeX';
import { $wrapSelectionInMarkNode } from '@lexical/mark';
import FilePlugin from './plugins/FilePlugin';
import { MarkNodeX, MarkXType } from './nodes/MarkNodeX';
import { createUID } from './utils/copus';

export interface EditorProps {
  readOnly?: boolean;
  onChange?: (editorState: EditorState, html: string) => void;
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
  markList?: MarkXType[];
  copusCopy?: (params: MarkXType) => void;
}

export default function Editor({
  onChange,
  readOnly,
  toolbar,
  showLabel,
  markList,
  copusCopy,
}: EditorProps): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const [editor] = useLexicalComposerContext();
  const {
    settings: {
      // isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      isCharLimitUtf8,
      isRichText,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      tableCellMerge,
      tableCellBackgroundColor,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const text = 'Enter some text...';
  const placeholder = <Placeholder>{text}</Placeholder>;
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const onChangeDebounce = useCallback(
    debounce((editorState, editor) => {
      editorState.read(() => {
        onChange?.(editorState, $generateHtmlFromNodes(editor));
      });
    }, 400),
    [onChange],
  );

  // 防止编辑器滚动到底部
  useEffect(() => {
    if (!readOnly) {
      editor.setEditable(true);
    }
  }, [editor]);

  // 附加 Mark
  useEffect(() => {
    editor.update(() => {
      markList?.forEach((mark) => {
        if (mark) {
          const anchor = TextNodeX.getNodeById(mark.startNodeId);
          const focus = TextNodeX.getNodeById(mark.endNodeId);
          if (anchor && focus) {
            const rangeSelection = $createRangeSelection();
            rangeSelection.setTextNodeRange(anchor, mark.startNodeAt, focus, mark.endNodeAt);
            $wrapSelectionInMarkNode(rangeSelection, false, createUID(), (ids) => {
              return new MarkNodeX({ ids, source: Boolean(mark.sourceCount), branch: Boolean(mark.downstreamCount) });
            });
          }
        }
      });
    });
  }, []);

  if (readOnly) {
    return (
      <div className="editor-container plain-text">
        <PlainTextPlugin
          contentEditable={
            <div ref={onRef}>
              <ContentEditable />
            </div>
          }
          placeholder={placeholder}
          ErrorBoundary={LexicalErrorBoundary}
        />
        {floatingAnchorElem && <FloatingCopusToolbarPlugin copusCopy={copusCopy} anchorElem={floatingAnchorElem} />}
      </div>
    );
  }

  return (
    <>
      {isRichText && (
        <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} toolbarConfig={toolbar} showLabel={showLabel} />
      )}
      <div className={`editor-container ${!isRichText ? 'plain-text' : ''}`}>
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        {/* <EmojiPickerPlugin /> */}
        <AutoEmbedPlugin />

        {/* <MentionsPlugin /> */}
        {/* <EmojisPlugin /> */}
        <HashtagPlugin />
        <KeywordsPlugin />
        {/* <SpeechToTextPlugin /> */}
        <AutoLinkPlugin />
        {isRichText ? (
          <>
            <HistoryPlugin externalHistoryState={historyState} />
            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div className="editor" ref={onRef}>
                    <ContentEditable />
                  </div>
                </div>
              }
              placeholder={placeholder}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <MarkdownShortcutPlugin />
            <CodeHighlightPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <TablePlugin hasCellMerge={tableCellMerge} hasCellBackgroundColor={tableCellBackgroundColor} />
            <TableCellResizer />
            <ImagesPlugin />
            <AudioPlugin />
            <VideoPlugin />
            <FilePlugin />
            {/* <InlineImagePlugin /> */}
            <LinkPlugin />
            {/* <PollPlugin /> */}
            {/* <TwitterPlugin /> */}
            <YouTubePlugin />
            {/* <FigmaPlugin /> */}
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            {/* <EquationsPlugin /> */}
            <TabFocusPlugin />
            <TabIndentationPlugin />
            <CollapsiblePlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            {floatingAnchorElem && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin anchorElem={floatingAnchorElem} cellMerge={true} />
                <FloatingCopusToolbarPlugin anchorElem={floatingAnchorElem} />
              </>
            )}
            <OnChangePlugin onChange={onChangeDebounce} ignoreSelectionChange />
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable />}
              placeholder={placeholder}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin charset={isCharLimit ? 'UTF-16' : 'UTF-8'} maxLength={5} />
        )}
        {/* {isAutocomplete && <AutocompletePlugin />} */}
        <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
        {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
        <CopusPlugin />
      </div>
    </>
  );
}
