/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {EditorThemeClasses} from 'lexical';

const themeNamePrefix = 'CET';

const theme: EditorThemeClasses = {
  autocomplete: `${themeNamePrefix}__autocomplete`,
  blockCursor: `${themeNamePrefix}__blockCursor`,
  characterLimit: `${themeNamePrefix}__characterLimit`,
  code: `${themeNamePrefix}__code`,
  codeHighlight: {
    atrule: `${themeNamePrefix}__tokenAttr`,
    attr: `${themeNamePrefix}__tokenAttr`,
    boolean: `${themeNamePrefix}__tokenProperty`,
    builtin: `${themeNamePrefix}__tokenSelector`,
    cdata: `${themeNamePrefix}__tokenComment`,
    char: `${themeNamePrefix}__tokenSelector`,
    class: `${themeNamePrefix}__tokenFunction`,
    'class-name': `${themeNamePrefix}__tokenFunction`,
    comment: `${themeNamePrefix}__tokenComment`,
    constant: `${themeNamePrefix}__tokenProperty`,
    deleted: `${themeNamePrefix}__tokenProperty`,
    doctype: `${themeNamePrefix}__tokenComment`,
    entity: `${themeNamePrefix}__tokenOperator`,
    function: `${themeNamePrefix}__tokenFunction`,
    important: `${themeNamePrefix}__tokenVariable`,
    inserted: `${themeNamePrefix}__tokenSelector`,
    keyword: `${themeNamePrefix}__tokenAttr`,
    namespace: `${themeNamePrefix}__tokenVariable`,
    number: `${themeNamePrefix}__tokenProperty`,
    operator: `${themeNamePrefix}__tokenOperator`,
    prolog: `${themeNamePrefix}__tokenComment`,
    property: `${themeNamePrefix}__tokenProperty`,
    punctuation: `${themeNamePrefix}__tokenPunctuation`,
    regex: `${themeNamePrefix}__tokenVariable`,
    selector: `${themeNamePrefix}__tokenSelector`,
    string: `${themeNamePrefix}__tokenSelector`,
    symbol: `${themeNamePrefix}__tokenProperty`,
    tag: `${themeNamePrefix}__tokenProperty`,
    url: `${themeNamePrefix}__tokenOperator`,
    variable: `${themeNamePrefix}__tokenVariable`,
  },
  embedBlock: {
    base: `${themeNamePrefix}__embedBlock`,
    focus: `${themeNamePrefix}__embedBlockFocus`,
  },
  hashtag: `${themeNamePrefix}__hashtag`,
  heading: {
    h1: `${themeNamePrefix}__h1`,
    h2: `${themeNamePrefix}__h2`,
    h3: `${themeNamePrefix}__h3`,
    h4: `${themeNamePrefix}__h4`,
    h5: `${themeNamePrefix}__h5`,
    h6: `${themeNamePrefix}__h6`,
  },
  image: 'editor-image',
  indent: `${themeNamePrefix}__indent`,
  inlineImage: 'inline-editor-image',
  layoutContainer: `${themeNamePrefix}__layoutContainer`,
  layoutItem: `${themeNamePrefix}__layoutItem`,
  link: `${themeNamePrefix}__link`,
  list: {
    checklist: `${themeNamePrefix}__checklist`,
    listitem: `${themeNamePrefix}__listItem`,
    listitemChecked: `${themeNamePrefix}__listItemChecked`,
    listitemUnchecked: `${themeNamePrefix}__listItemUnchecked`,
    nested: {
      listitem: `${themeNamePrefix}__nestedListItem`,
    },
    olDepth: [
      `${themeNamePrefix}__ol1`,
      `${themeNamePrefix}__ol2`,
      `${themeNamePrefix}__ol3`,
      `${themeNamePrefix}__ol4`,
      `${themeNamePrefix}__ol5`,
    ],
    ul: `${themeNamePrefix}__ul`,
  },
  ltr: `${themeNamePrefix}__ltr`,
  mark: `${themeNamePrefix}__mark`,
  markOverlap: `${themeNamePrefix}__markOverlap`,
  paragraph: `${themeNamePrefix}__paragraph`,
  quote: `${themeNamePrefix}__quote`,
  rtl: `${themeNamePrefix}__rtl`,
  table: `${themeNamePrefix}__table`,
  tableAddColumns: `${themeNamePrefix}__tableAddColumns`,
  tableAddRows: `${themeNamePrefix}__tableAddRows`,
  tableCell: `${themeNamePrefix}__tableCell`,
  tableCellActionButton: `${themeNamePrefix}__tableCellActionButton`,
  tableCellActionButtonContainer:
    `${themeNamePrefix}__tableCellActionButtonContainer`,
  tableCellEditing: `${themeNamePrefix}__tableCellEditing`,
  tableCellHeader: `${themeNamePrefix}__tableCellHeader`,
  tableCellPrimarySelected: `${themeNamePrefix}__tableCellPrimarySelected`,
  tableCellResizer: `${themeNamePrefix}__tableCellResizer`,
  tableCellSelected: `${themeNamePrefix}__tableCellSelected`,
  tableCellSortedIndicator: `${themeNamePrefix}__tableCellSortedIndicator`,
  tableResizeRuler: `${themeNamePrefix}__tableCellResizeRuler`,
  tableSelected: `${themeNamePrefix}__tableSelected`,
  tableSelection: `${themeNamePrefix}__tableSelection`,
  text: {
    bold: `${themeNamePrefix}__textBold`,
    code: `${themeNamePrefix}__textCode`,
    italic: `${themeNamePrefix}__textItalic`,
    strikethrough: `${themeNamePrefix}__textStrikethrough`,
    subscript: `${themeNamePrefix}__textSubscript`,
    superscript: `${themeNamePrefix}__textSuperscript`,
    underline: `${themeNamePrefix}__textUnderline`,
    underlineStrikethrough: `${themeNamePrefix}__textUnderlineStrikethrough`,
  },
};

export default theme;
