/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// setupEnv must load before App because lexical computes CAN_USE_BEFORE_INPUT
// at import time (disableBeforeInput is used to test legacy events)
// eslint-disable-next-line simple-import-sort/imports

import * as React from 'react';
import { createRoot } from 'react-dom/client';

import App, { getEditorHtml } from '../src';
import './index.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addMark, getDownstreamList, getMarkList } from './api';
import { EditorShellRef, copusEditorEhellStyle } from '../src/EditorShell';

// Handle runtime errors
const showErrorOverlay = (err: Event) => {
  const ErrorOverlay = customElements.get('vite-error-overlay');
  if (!ErrorOverlay) {
    return;
  }
  const overlay = new ErrorOverlay(err);
  const body = document.body;
  if (body !== null) {
    body.appendChild(overlay);
  }
};

window.addEventListener('error', showErrorOverlay);
window.addEventListener('unhandledrejection', ({ reason }) => showErrorOverlay(reason));

let data =
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Since the TextNode is foundational to all Lexical packages, including the plain text use case. Handling any rich text logic is undesirable. This creates the need to override the TextNode to handle serialization and deserialization of HTML/CSS styling properties to achieve full fidelity between JSON <-> HTML. Since this is a very popular use case, below we are proving a recipe to handle the","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-x","version":1,"textFormat":0,"id":"hyyE"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"哈哈哈","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-x","version":1,"textFormat":0,"id":"9w9R"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"most common use cases.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-x","version":1,"textFormat":0,"id":"slkb"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"阿斯顿法斯蒂芬","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph-x","version":1,"textFormat":0,"id":"EhT6"}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

const exampleData = await import('./example.json');
// data = JSON.stringify(exampleData.default);

const markList = [
  {
    id: '66881067080f1f6e19cf3a6c',
    startNodeId: 'hyyE',
    startNodeAt: 140,
    endNodeId: 'hyyE',
    endNodeAt: 300,
    downstreamCount: 2,
  },
  {
    id: '66881095080f1f6e19cf3a6d',
    startNodeId: 'hyyE',
    startNodeAt: 200,
    endNodeId: 'slkb',
    endNodeAt: 11,
    sourceCount: 3,
  },
];

const copyMark = {
  startNodeId: '1jku',
  startNodeAt: 137,
  endNodeId: '8jh8',
  endNodeAt: 11,
  textContent:
    'fidelity between JSON <-> HTML. Since this is a very popular use case, below we are proving a recipe to handle the\n哈哈哈\nmost common',
};

const uuid1 = '8fedcf8a368657d198da212300f15c967756e31f';
const uuid2 = '9fedcf8a368657d198da212300f15c967756e31f';

function DemoApp() {
  const ref1 = useRef<EditorShellRef>(null);
  const ref2 = useRef<EditorShellRef>(null);

  // const [markList, setMarkList] = useState();
  // useEffect(() => {
  //   getMarkList(uuid1).then((res) => {
  //     ref1.current?.attachMarkList(markList);
  //   });
  // }, []);

  const handleCopusCopy = useCallback(async (params) => {
    console.log('params', params);
    // const res = await addMark({ ...params, opusUuid: uuid1 });
  }, []);

  const createMark = useCallback(async (params) => {
    console.log('createMark', params);
    return { ...params, id: Date.now().toString(36) };
    const res = await addMark({ ...params, opusUuid: uuid1 });
    console.log('res', res);
    return { ...params, opusUuid: uuid1, id: res.data };
  }, []);

  const getMarkInfo = useCallback(async (ids) => {
    const res = await getDownstreamList(ids);
    return res;
  }, []);

  const [html, setHtml] = useState('');
  useEffect(() => {
    getEditorHtml(data).then((html) => {
      console.log('html', html);
    });
  }, []);

  return (
    <>
      {/* <App
        key="view"
        initialValue={data}
        copus={{ opusUuid: uuid1, opusId: 1, createMark, getMarkInfo }}
        ref={ref1}
        readOnly
      />
      <div style={{ margin: '10px 0' }}>
        <button
          onClick={() => {
            ref1.current?.attachMarkList(markList);
          }}>
          Attach mark list
        </button>
        &nbsp;
        <button
          onClick={() => {
            ref1.current?.removeMark('66881067080f1f6e19cf3a6c');
          }}>
          Remove one mark
        </button>
        &nbsp;
        <button
          onClick={() => {
            ref1.current?.clearMarkList();
          }}>
          Clear mark list
        </button>
      </div> */}
      <App
        key="edit"
        initialValue={data}
        onChange={(status, opts) => {
          console.log(status, opts);
          setHtml(opts.html);
        }}
        copus={{ opusUuid: uuid2, opusId: 2, getMarkInfo, createMark }}
        ref={ref2}
        toolbar={[
          'history',
          'block-format',
          'font',
          'insert-image',
          'insert-audio',
          'insert-video',
          'columns-layout',
          'element-format',
          'insert-more',
          'pay-line',
          'code-format',
        ]}
        // readOnly
        // showLabel
      />

      <div style={{ margin: '20px 0' }} />

      <div className={copusEditorEhellStyle}>
        <div className="editor-container plain-text editor-read-only">
          <div className="ContentEditable__root" dangerouslySetInnerHTML={{ __html: html }}></div>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <DemoApp />,
  // </React.StrictMode>,
);
