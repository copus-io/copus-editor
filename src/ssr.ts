import { JSDOM } from 'jsdom';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createHeadlessEditor } from '@lexical/headless';
import editorNodes from './nodes';
import CopusEditorTheme from './themes/CopusEditorTheme';

function setupDom() {
  const dom = new JSDOM();

  const _window = global.window;
  const _document = global.document;

  // @ts-expect-error
  global.window = dom.window;
  global.document = dom.window.document;

  return () => {
    global.window = _window;
    global.document = _document;
  };
}

function setupWindow() {
  const _window = global.window;
  // need to setup window for CodeNode since facebook#5828
  // https://github.com/facebook/lexical/pull/5828
  // @ts-expect-error
  global.window = global;

  return () => {
    global.window = _window;
  };
}

export async function getEditorHtml(serializedEditorState: string) {
  const html: string = await new Promise((resolve) => {
    const cleanup = setupWindow();
    const editor = createHeadlessEditor({ namespace: 'CopusEditor', nodes: editorNodes, theme: CopusEditorTheme });

    editor.setEditorState(editor.parseEditorState(serializedEditorState));
    cleanup();

    editor.update(() => {
      try {
        const cleanup = setupDom();
        const _html = $generateHtmlFromNodes(editor, null);
        cleanup();

        resolve(_html);
      } catch (e) {
        console.log(e);
      }
    });
  });

  return html;
}
