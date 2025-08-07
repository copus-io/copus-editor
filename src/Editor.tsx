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
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
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
import PayLinePlugin from './plugins/PayLinePlugin';
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
import {
  $createRangeSelection,
  $getRoot,
  $getSelection,
  EditorState,
  LexicalEditor,
  SerializedEditorState,
  SerializedLexicalNode,
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { debounce, set } from 'lodash-es';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import CopusPlugin from './plugins/CopusPlugin';
import { $wrapSelectionInMarkNode } from '@lexical/mark';
import FilePlugin from './plugins/FilePlugin';
import { MarkNodeX, MarkXType } from './nodes/MarkNodeX';
import { EditorShellProps } from './EditorShell';

// import 'react-photo-view/dist/react-photo-view.css';
// import { PhotoProvider } from 'react-photo-view';

export interface EditorProps {
  readOnly?: boolean;
  onChange?: (
    editorState: EditorState,
    opts: { html: string; publicContent: SerializedEditorState<SerializedLexicalNode> },
  ) => void;
  toolbar?: ToolbarConfig;
  showLabel?: boolean;
  copus?: EditorShellProps['copus'];
  maxLength?: number; // 1. 确保在这里添加了 maxLength 属性
}

export default function Editor({
  onChange,
  readOnly,
  toolbar,
  showLabel,
  copus = {},
  maxLength, // 2. 确保在这里从 props 中解构了 maxLength
}: EditorProps): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const [editor] = useLexicalComposerContext();
  const {
    settings: {
      // isCollab,
      isAutocomplete,
      // isMaxLength, // 不再需要此项
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
  const text = 'Paste URLs in the text to attribute an inspiration source';
  const placeholder = <Placeholder>{text}</Placeholder>;
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false);

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const onChangeDebounce = useCallback(
    debounce((editorState: EditorState, editor: LexicalEditor) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);
        const stateJSON = editorState.toJSON();
        const payLineIndex = stateJSON.root.children.findIndex((child: any) => child.type === 'pay-line');
        const truncatedChildren =
          payLineIndex !== -1 ? stateJSON.root.children.slice(0, payLineIndex) : stateJSON.root.children;
        stateJSON.root.children = truncatedChildren;
        onChange?.(editorState, {
          html,
          publicContent: stateJSON,
        });
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

  if (readOnly) {
    return (
      <div className="editor-container plain-text editor-read-only">
        {/* <PhotoProvider maskOpacity={0.5}> */}
        <PlainTextPlugin
          contentEditable={
            <div ref={onRef}>
              <ContentEditable />
            </div>
          }
          // placeholder={placeholder}
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* </PhotoProvider> */}
        {/* {floatingAnchorElem && (
          <>
            <FloatingCopusToolbarPlugin copus={copus} anchorElem={floatingAnchorElem} />
            <CopusPlugin copus={copus} />
          </>
        )} */}
      </div>
    );
  }

  return (
    <>
      {isRichText && toolbar && toolbar.length > 0 && (
        <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} toolbarConfig={toolbar} showLabel={showLabel} />
      )}
      <div className={`editor-container ${!isRichText ? 'plain-text' : ''}`}>
        {/* 3. 在这里使用 maxLength 变量 */}
        {typeof maxLength === 'number' && maxLength > 0 && <MaxLengthPlugin maxLength={maxLength} />}
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
            <TwitterPlugin />
            <YouTubePlugin />
            {/* <FigmaPlugin /> */}
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            {/* <EquationsPlugin /> */}
            <TabFocusPlugin />
            <TabIndentationPlugin />
            <CollapsiblePlugin />
            <PageBreakPlugin />
            <PayLinePlugin />
            <LayoutPlugin />
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin anchorElem={floatingAnchorElem} cellMerge={true} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                {/* <FloatingCopusToolbarPlugin
                  copus={copus}
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                /> */}
                {/* <CopusPlugin copus={copus} /> */}
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
      </div>
    </>
  );
}
