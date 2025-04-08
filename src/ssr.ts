import { $generateHtmlFromNodes } from '@lexical/html';
import { createHeadlessEditor } from '@lexical/headless';
import editorNodes from './nodes';
import CopusEditorTheme from './themes/CopusEditorTheme';

export async function getEditorHtml(serializedEditorState: string) {
  const html: string = await new Promise((resolve) => {
    const editor = createHeadlessEditor({ namespace: 'CopusEditor', nodes: editorNodes, theme: CopusEditorTheme });
    editor.setEditorState(editor.parseEditorState(serializedEditorState));

    editor.update(() => {
      try {
        const _html = $generateHtmlFromNodes(editor, null);

        resolve(_html);
      } catch (e) {
        console.log(e);
      }
    });
  });

  return html;
}
