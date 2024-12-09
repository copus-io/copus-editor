/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $createCodeNode,
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
  getLanguageFriendlyName,
} from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, HeadingTagType } from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
  $setBlocksType,
} from '@lexical/selection';
import { $isTableNode, $isTableSelection } from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from '@lexical/utils';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  LexicalEditor,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import { IS_APPLE } from '../../shared/environment';

import useModal from '../../hooks/useModal';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../../utils/url';
import { EmbedConfigs, YoutubeEmbedConfig } from '../AutoEmbedPlugin';
import { INSERT_COLLAPSIBLE_COMMAND } from '../CollapsiblePlugin';
import { INSERT_IMAGE_COMMAND, InsertImageDialog, InsertImagePayload } from '../ImagesPlugin';
import { InsertInlineImageDialog } from '../InlineImagePlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import { INSERT_PAGE_BREAK } from '../PageBreakPlugin';
import { INSERT_PAY_LINE } from '../PayLinePlugin';
import { InsertTableDialog } from '../TablePlugin';
import FontSize from './fontSize';
import { InsertAudioDialog } from '../AudioPlugin';
import { InsertVideoDialog } from '../VideoPlugin';
import { ImportDocxDialog } from '../ImportDocxPlugin';

const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
};

const rootTypeToRootName = {
  root: 'Root',
  table: 'Table',
};

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP)) {
    options.push([lang, friendlyName]);
  }

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Maven Pro', 'Maven Pro'],
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
  ['Noto Sans SC', 'Noto Sans SC'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align',
  },
};

function dropDownActiveClass(active: boolean) {
  if (active) {
    return 'active dropdown-item-active';
  } else {
    return '';
  }
}

function BlockFormatDropDown({
  editor,
  blockType,
  rootType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatCheckList = () => {
    if (blockType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createQuoteNode());
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        let selection = $getSelection();

        if (selection !== null) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertRawText(textContent);
            }
          }
        }
      });
    }
  };

  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonAriaLabel="Formatting options for text style">
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'paragraph')} onClick={formatParagraph}>
        <i className="icon paragraph" />
        <span className="text">Normal</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'h1')} onClick={() => formatHeading('h1')}>
        <i className="icon h1" />
        <span className="text">Heading 1</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'h2')} onClick={() => formatHeading('h2')}>
        <i className="icon h2" />
        <span className="text">Heading 2</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'h3')} onClick={() => formatHeading('h3')}>
        <i className="icon h3" />
        <span className="text">Heading 3</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'bullet')} onClick={formatBulletList}>
        <i className="icon bullet-list" />
        <span className="text">Bullet List</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'number')} onClick={formatNumberedList}>
        <i className="icon numbered-list" />
        <span className="text">Numbered List</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'check')} onClick={formatCheckList}>
        <i className="icon check-list" />
        <span className="text">Check List</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'quote')} onClick={formatQuote}>
        <i className="icon quote" />
        <span className="text">Quote</span>
      </DropDownItem>
      <DropDownItem className={'item ' + dropDownActiveClass(blockType === 'code')} onClick={formatCode}>
        <i className="icon code" />
        <span className="text">Code Block</span>
      </DropDownItem>
    </DropDown>
  );
}

function Divider(): JSX.Element {
  return <div className="divider" />;
}

function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family' ? 'Formatting options for font family' : 'Formatting options for font size';

  return (
    <DropDown
      disabled={disabled}
      buttonClassName={'toolbar-item ' + style}
      buttonLabel={value}
      buttonIconClassName={style === 'font-family' ? 'icon block-type font-family' : ''}
      buttonAriaLabel={buttonAriaLabel}>
      {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(([option, text]) => (
        <DropDownItem
          className={`item ${dropDownActiveClass(value === option)} ${style === 'font-size' ? 'fontsize-item' : ''}`}
          onClick={() => handleClick(option)}
          key={option}>
          <span className="text">{text}</span>
        </DropDownItem>
      ))}
    </DropDown>
  );
}

function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel={formatOption.name}
      buttonIconClassName={`icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`}
      buttonClassName="toolbar-item spaced alignment"
      buttonAriaLabel="Formatting options for text alignment">
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="item">
        <i className="icon left-align" />
        <span className="text">Left Align</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className="item">
        <i className="icon center-align" />
        <span className="text">Center Align</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className="item">
        <i className="icon right-align" />
        <span className="text">Right Align</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="item">
        <i className="icon justify-align" />
        <span className="text">Justify Align</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
        }}
        className="item">
        <i className={`icon ${isRTL ? ELEMENT_FORMAT_OPTIONS.start.iconRTL : ELEMENT_FORMAT_OPTIONS.start.icon}`} />
        <span className="text">Start Align</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
        }}
        className="item">
        <i className={`icon ${isRTL ? ELEMENT_FORMAT_OPTIONS.end.iconRTL : ELEMENT_FORMAT_OPTIONS.end.icon}`} />
        <span className="text">End Align</span>
      </DropDownItem>
      <Divider />
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
        className="item">
        <i className={'icon ' + (isRTL ? 'indent' : 'outdent')} />
        <span className="text">Outdent</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}
        className="item">
        <i className={'icon ' + (isRTL ? 'outdent' : 'indent')} />
        <span className="text">Indent</span>
      </DropDownItem>
    </DropDown>
  );
}

export type ToolbarConfig = (
  | 'history'
  | 'divider'
  | 'block-format'
  | 'font'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'code-block'
  | 'link'
  | 'font-color'
  | 'bg-color'
  | 'font-more'
  | 'insert-image'
  | 'insert-audio'
  | 'insert-video'
  | 'insert-youtube'
  | 'import-docx'
  | 'insert-more'
  | 'code-format'
  | 'element-format'
  | 'columns-layout'
  | 'pay-line'
)[];

const defaultToolbarConfig: ToolbarConfig = [
  'history',
  'divider',
  'block-format',
  'font',
  'bold',
  'italic',
  'underline',
  'code-block',
  'link',
  'font-color',
  'bg-color',
  'font-more',
  'insert-image',
  'import-docx',
  'insert-more',
  'code-format',
  'divider',
  'element-format',
];

export default function ToolbarPlugin({
  setIsLinkEditMode,
  toolbarConfig = defaultToolbarConfig,
  showLabel,
}: {
  setIsLinkEditMode: Dispatch<boolean>;
  toolbarConfig?: ToolbarConfig;
  showLabel?: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [rootType, setRootType] = useState<keyof typeof rootTypeToRootName>('root');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [fontSize, setFontSize] = useState<string>('20px');
  const [fontColor, setFontColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#fff');
  const [fontFamily, setFontFamily] = useState<string>('Maven Pro');
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left');
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [modal, showModal] = useModal();
  const [isRTL, setIsRTL] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<string>('');
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        setRootType('table');
      } else {
        setRootType('root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          let type = $isHeadingNode(element) ? element.getTag() : element.getType();
          type = type.replace('-x', '');
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            setCodeLanguage(language ? CODE_LANGUAGE_MAP[language] || language : '');
            return;
          }
        }
      }
      // Handle buttons
      setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000000'));
      setBgColor($getSelectionStyleValueForProperty(selection, 'background-color', '#fff'));
      setFontFamily($getSelectionStyleValueForProperty(selection, 'font-family', 'Maven Pro'));
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      setElementFormat(
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', '20px'));
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor]);

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload;
        const { code, ctrlKey, metaKey } = event;

        if (code === 'KeyK' && (ctrlKey || metaKey)) {
          event.preventDefault();
          let url: string | null;
          if (!isLink) {
            setIsLinkEditMode(true);
            url = sanitizeUrl('https://');
          } else {
            setIsLinkEditMode(false);
            url = null;
          }
          return activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [activeEditor, isLink, setIsLinkEditMode]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistoryStack?: boolean) => {
      activeEditor.update(
        () => {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? { tag: 'historic' } : {},
      );
    },
    [activeEditor],
  );

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const nodes = selection.getNodes();
        const extractedNodes = selection.extract();

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return;
        }

        nodes.forEach((node, idx) => {
          // We split the first and last node by the selection
          // So that we don't format unselected text inside those nodes
          if ($isTextNode(node)) {
            // Use a separate variable to ensure TS does not lose the refinement
            let textNode = node;
            if (idx === 0 && anchor.offset !== 0) {
              textNode = textNode.splitText(anchor.offset)[1] || textNode;
            }
            if (idx === nodes.length - 1) {
              textNode = textNode.splitText(focus.offset)[0] || textNode;
            }
            /**
             * If the selected text has one format applied
             * selecting a portion of the text, could
             * clear the format to the wrong portion of the text.
             *
             * The cleared text is based on the length of the selected text.
             */
            // We need this in case the selected text only has one format
            const extractedTextNode = extractedNodes[0];
            if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
              textNode = extractedTextNode;
            }

            if (textNode.__style !== '') {
              textNode.setStyle('');
            }
            if (textNode.__format !== 0) {
              textNode.setFormat(0);
              $getNearestBlockElementAncestorOrThrow(textNode).setFormat('');
            }
            node = textNode;
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true);
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat('');
          }
        });
      }
    });
  }, [activeEditor]);

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ color: value }, skipHistoryStack);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ 'background-color': value }, skipHistoryStack);
    },
    [applyStyleText],
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'));
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, isLink, setIsLinkEditMode]);

  const insertImage = useCallback(() => {
    showModal('Insert Image', (onClose) => <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />);
  }, [activeEditor]);

  const insertAudio = useCallback(() => {
    showModal('Insert Audio', (onClose) => <InsertAudioDialog activeEditor={activeEditor} onClose={onClose} />);
  }, [activeEditor]);

  const insertVideo = useCallback(() => {
    showModal('Insert Video', (onClose) => <InsertVideoDialog activeEditor={activeEditor} onClose={onClose} />);
  }, [activeEditor]);

  const importDocx = useCallback(() => {
    showModal('Import Word File', (onClose) => <ImportDocxDialog activeEditor={activeEditor} onClose={onClose} />);
  }, [activeEditor]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const History = useCallback(
    () => (
      <>
        <button
          disabled={!canUndo || !isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
          type="button"
          className="toolbar-item spaced"
          aria-label="Undo">
          <i className="format undo" />
        </button>
        <button
          disabled={!canRedo || !isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'}
          type="button"
          className="toolbar-item"
          aria-label="Redo">
          <i className="format redo" />
        </button>
      </>
    ),
    [activeEditor, canRedo, canUndo, isEditable],
  );

  const BlockFormat = useCallback(() => {
    if (blockType in blockTypeToBlockName && activeEditor === editor) {
      return (
        <>
          <BlockFormatDropDown disabled={!isEditable} blockType={blockType} rootType={rootType} editor={editor} />
          <Divider />
        </>
      );
    }

    return null;
  }, [activeEditor, blockType, editor, isEditable, rootType]);

  const ElementFormat = useCallback(
    () => <ElementFormatDropdown disabled={!isEditable} value={elementFormat} editor={activeEditor} isRTL={isRTL} />,
    [activeEditor, elementFormat, isEditable, isRTL],
  );

  const Font = useCallback(
    () => (
      <>
        <FontDropDown disabled={!isEditable} style={'font-family'} value={fontFamily} editor={activeEditor} />
        <Divider />
        <FontSize selectionFontSize={fontSize.slice(0, -2)} editor={activeEditor} disabled={!isEditable} />
        <Divider />
      </>
    ),
    [activeEditor, fontFamily, fontSize, isEditable],
  );

  const Bold = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
        title={IS_APPLE ? 'Bold (⌘B)' : 'Bold (Ctrl+B)'}
        type="button"
        aria-label={`Format text as bold. Shortcut: ${IS_APPLE ? '⌘B' : 'Ctrl+B'}`}>
        <i className="format bold" />
      </button>
    ),
    [activeEditor, isBold, isEditable],
  );

  const Italic = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
        title={IS_APPLE ? 'Italic (⌘I)' : 'Italic (Ctrl+I)'}
        type="button"
        aria-label={`Format text as italics. Shortcut: ${IS_APPLE ? '⌘I' : 'Ctrl+I'}`}>
        <i className="format italic" />
      </button>
    ),
    [activeEditor, isEditable, isItalic],
  );

  const Underline = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
        title={IS_APPLE ? 'Underline (⌘U)' : 'Underline (Ctrl+U)'}
        type="button"
        aria-label={`Format text to underlined. Shortcut: ${IS_APPLE ? '⌘U' : 'Ctrl+U'}`}>
        <i className="format underline" />
      </button>
    ),
    [activeEditor, isEditable, isUnderline],
  );

  const CodeBlock = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }}
        className={'toolbar-item spaced ' + (isCode ? 'active' : '')}
        title="Insert code block"
        type="button"
        aria-label="Insert code block">
        <i className="format code" />
      </button>
    ),
    [activeEditor, isCode, isEditable],
  );

  const Link = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={insertLink}
        className={'toolbar-item spaced ' + (isLink ? 'active' : '')}
        aria-label="Insert link"
        title="Insert link"
        type="button">
        <i className="format link" />
      </button>
    ),
    [insertLink, isEditable, isLink],
  );

  const FontMore = useCallback(
    () => (
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel=""
        buttonAriaLabel="Formatting options for additional text styles"
        buttonIconClassName="icon dropdown-more">
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={'item ' + dropDownActiveClass(isBold)}
          title="Bold"
          aria-label="Format text as bold">
          <i className="icon bold" />
          <span className="text">Bold</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={'item ' + dropDownActiveClass(isItalic)}
          title="Italic"
          aria-label="Format text as italics">
          <i className="icon italic" />
          <span className="text">Italic</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={'item ' + dropDownActiveClass(isUnderline)}
          title="Underline"
          aria-label="Format text as underlined">
          <i className="icon underline" />
          <span className="text">Underline</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          }}
          className={'item ' + dropDownActiveClass(isCode)}
          title="Insert code block"
          aria-label="Insert code block">
          <i className="icon code" />
          <span className="text">Code Block</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
          className={'item ' + dropDownActiveClass(isStrikethrough)}
          title="Strikethrough"
          aria-label="Format text with a strikethrough">
          <i className="icon strikethrough" />
          <span className="text">Strikethrough</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
          }}
          className={'item ' + dropDownActiveClass(isSubscript)}
          title="Subscript"
          aria-label="Format text with a subscript">
          <i className="icon subscript" />
          <span className="text">Subscript</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
          }}
          className={'item ' + dropDownActiveClass(isSuperscript)}
          title="Superscript"
          aria-label="Format text with a superscript">
          <i className="icon superscript" />
          <span className="text">Superscript</span>
        </DropDownItem>
        <DropDownItem
          onClick={clearFormatting}
          className="item"
          title="Clear text formatting"
          aria-label="Clear all text formatting">
          <i className="icon clear" />
          <span className="text">Clear Formatting</span>
        </DropDownItem>
      </DropDown>
    ),
    [
      activeEditor,
      clearFormatting,
      isEditable,
      isStrikethrough,
      isSubscript,
      isSuperscript,
      isBold,
      isItalic,
      isUnderline,
    ],
  );

  const InsertImage = useCallback(() => {
    return (
      <button disabled={!isEditable} onClick={insertImage} className="toolbar-item" type="button">
        <i className="format image" />
        {showLabel && <span className="item-label">Insert Image</span>}
      </button>
    );
  }, [insertImage, isEditable, showLabel]);

  const InsertAudio = useCallback(
    () => (
      <button disabled={!isEditable} onClick={insertAudio} className={'toolbar-item'} type="button">
        <i className="format audio" />
        {showLabel && <span className="item-label">Insert Audio</span>}
      </button>
    ),
    [insertAudio, isEditable, showLabel],
  );

  const InsertVideo = useCallback(
    () => (
      <button disabled={!isEditable} onClick={insertVideo} className={'toolbar-item'} type="button">
        <i className="format video" />
        {showLabel && <span className="item-label">Insert Video</span>}
      </button>
    ),
    [insertVideo, isEditable, showLabel],
  );

  const InsertYoutubeVideo = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(INSERT_EMBED_COMMAND, YoutubeEmbedConfig.type);
        }}
        className={'toolbar-item'}
        type="button">
        <i className="format youtube" />
        {showLabel && <span className="item-label">{YoutubeEmbedConfig.contentName}</span>}
      </button>
    ),
    [isEditable, showLabel],
  );

  const ImportDocx = useCallback(
    () => (
      <button disabled={!isEditable} onClick={importDocx} className={'toolbar-item'} type="button">
        <i className="format word" />
        {showLabel && <span className="item-label">Import Word</span>}
      </button>
    ),
    [importDocx, isEditable, showLabel],
  );

  const InsertMore = useCallback(
    () => (
      <>
        <Divider />
        <DropDown
          disabled={!isEditable}
          buttonClassName="toolbar-item spaced"
          buttonLabel="Insert"
          buttonAriaLabel="Insert specialized editor node"
          buttonIconClassName="icon plus">
          <DropDownItem
            onClick={() => {
              activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
            }}
            className="item">
            <i className="icon horizontal-rule" />
            <span className="text">Horizontal Rule</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              activeEditor.dispatchCommand(INSERT_PAGE_BREAK, undefined);
            }}
            className="item">
            <i className="icon page-break" />
            <span className="text">Page Break</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              showModal('Insert Image', (onClose) => (
                <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
              ));
            }}
            className="item">
            <i className="icon image" />
            <span className="text">Insert Image</span>
          </DropDownItem>
          {/* <DropDownItem
          onClick={() => {
            showModal('Insert Inline Image', (onClose) => (
              <InsertInlineImageDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon image" />
          <span className="text">Inline Image</span>
        </DropDownItem> */}
          <DropDownItem
            onClick={() => {
              showModal('Insert Table', (onClose) => (
                <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
              ));
            }}
            className="item">
            <i className="icon table" />
            <span className="text">Table</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              showModal('Insert Columns Layout', (onClose) => (
                <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
              ));
            }}
            className="item">
            <i className="icon columns" />
            <span className="text">Columns Layout</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
            }}
            className="item">
            <i className="icon caret-right" />
            <span className="text">Collapsible container</span>
          </DropDownItem>

          <DropDownItem onClick={importDocx} className="item">
            <i className="icon word" />
            <span className="text">Import Word</span>
          </DropDownItem>

          <DropDownItem
            onClick={() => {
              showModal('Insert Audio', (onClose) => (
                <InsertAudioDialog activeEditor={activeEditor} onClose={onClose} />
              ));
            }}
            className="item">
            <i className="icon audio" />
            <span className="text">Insert Audio</span>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              showModal('Insert Video', (onClose) => (
                <InsertVideoDialog activeEditor={activeEditor} onClose={onClose} />
              ));
            }}
            className="item">
            <i className="icon video" />
            <span className="text">Insert Video</span>
          </DropDownItem>
          {EmbedConfigs.map((embedConfig) => (
            <DropDownItem
              key={embedConfig.type}
              onClick={() => {
                activeEditor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type);
              }}
              className="item">
              {embedConfig.icon}
              <span className="text">{embedConfig.contentName}</span>
            </DropDownItem>
          ))}
        </DropDown>
      </>
    ),
    [activeEditor, insertImage, importDocx, isEditable, showModal],
  );

  const CodeFormat = useCallback(
    () => (
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item code-language"
        buttonLabel={getLanguageFriendlyName(codeLanguage)}
        buttonAriaLabel="Select language">
        {CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
          return (
            <DropDownItem
              className={`item ${dropDownActiveClass(value === codeLanguage)}`}
              onClick={() => onCodeLanguageSelect(value)}
              key={value}>
              <span className="text">{name}</span>
            </DropDownItem>
          );
        })}
      </DropDown>
    ),
    [codeLanguage, isEditable, onCodeLanguageSelect],
  );

  const ColumnsLayout = useCallback(() => {
    return (
      <button
        disabled={!isEditable}
        onClick={() => {
          showModal('Insert Columns Layout', (onClose) => (
            <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
          ));
        }}
        className="toolbar-item"
        type="button">
        <i className="format columns" />
        {showLabel && <span className="item-label">Columns Layout</span>}
      </button>
    );
  }, [activeEditor, isEditable, showModal, showLabel]);

  const PayLine = useCallback(
    () => (
      <button
        disabled={!isEditable}
        onClick={() => {
          activeEditor.dispatchCommand(INSERT_PAY_LINE, undefined);
        }}
        className={'toolbar-item spaced pay-line'}
        title="Insert Pay Line"
        type="button"
        aria-label="Insert Pay Line">
        <span className="icon pay-line" />
        <span className="text">Insert Pay Line</span>
      </button>
    ),
    [activeEditor, isEditable],
  );

  const ToolbarList = () => {
    return toolbarConfig.map((item, index) => {
      if (blockType === 'code') {
        if (!['history', 'divider', 'block-format', 'code-format'].includes(item)) {
          return null;
        }
      } else {
        if (item === 'code-format') {
          return null;
        }
      }

      let Component;
      switch (item) {
        case 'history':
          Component = <History key="history" />;
          break;
        case 'divider':
          Component = <Divider key={`divider_${index}`} />;
          break;
        case 'block-format':
          Component = <BlockFormat key="block-format" />;
          break;
        case 'element-format':
          Component = <ElementFormat key="element-format" />;
          break;
        case 'code-format':
          Component = <CodeFormat key="code-format" />;
          break;
        case 'font':
          Component = <Font key="font" />;
          break;
        case 'bold':
          Component = <Bold key="bold" />;
          break;
        case 'italic':
          Component = <Italic key="italic" />;
          break;
        case 'underline':
          Component = <Underline key="underline" />;
          break;
        case 'font-color':
          Component = (
            <DropdownColorPicker
              key="font-color"
              disabled={!isEditable}
              buttonClassName="toolbar-item color-picker"
              buttonAriaLabel="Formatting text color"
              buttonIconClassName="icon font-color"
              color={fontColor}
              onChange={onFontColorSelect}
              title="text color"
            />
          );
          break;
        case 'bg-color':
          Component = (
            <DropdownColorPicker
              key="bg-color"
              disabled={!isEditable}
              buttonClassName="toolbar-item color-picker"
              buttonAriaLabel="Formatting background color"
              buttonIconClassName="icon bg-color"
              color={bgColor}
              onChange={onBgColorSelect}
              title="backgroud color"
            />
          );
          break;
        case 'font-more':
          Component = <FontMore key="font-more" />;
          break;
        case 'link':
          Component = <Link key="link" />;
          break;
        case 'insert-image':
          Component = <InsertImage key="insert-image" />;
          break;
        case 'insert-audio':
          Component = <InsertAudio key="insert-audio" />;
          break;
        case 'insert-video':
          Component = <InsertVideo key="insert-video" />;
          break;
        case 'insert-youtube':
          Component = <InsertYoutubeVideo key="insert-youtube" />;
          break;
        case 'import-docx':
          Component = <ImportDocx key="import-docx" />;
          break;
        case 'insert-more':
          Component = <InsertMore key="insert-more" />;
          break;
        case 'code-block':
          Component = <CodeBlock key="code-block" />;
          break;
        case 'columns-layout':
          Component = <ColumnsLayout key="columns-layout" />;
          break;
        case 'pay-line':
          Component = <PayLine key="pay-line" />;
          break;
        default:
          Component = null;
      }
      return Component;
    });
  };

  return (
    <div className="toolbar">
      {ToolbarList()}
      {modal}
    </div>
  );
}
