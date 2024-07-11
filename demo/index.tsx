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

import App from '../src';
import './index.css';
import { useCallback, useEffect, useState } from 'react';
import { addMark, getMarkList } from './api';

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

const data =
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Since the TextNode is foundational to all Lexical packages, including the plain text use case. Handling any rich text logic is undesirable. This creates the need to override the TextNode to handle serialization and deserialization of HTML/CSS styling properties to achieve full fidelity between JSON <-> HTML. Since this is a very popular use case, below we are proving a recipe to handle the","type":"text-x","version":1,"id":"e7dk7"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"哈哈哈","type":"text-x","version":1,"id":"59i2"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"most common use cases.","type":"text-x","version":1,"id":"8jh8"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"阿斯顿法斯蒂芬","type":"text-x","version":1,"id":"e7q5l"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

const markList = [
  {
    id: '66881067080f1f6e19cf3a6c',
    startNodeId: 'e7dk7',
    startNodeAt: 140,
    endNodeId: 'e7dk7',
    endNodeAt: 309,
    downstreamCount: 1,
  },
  {
    id: '66881095080f1f6e19cf3a6d',
    startNodeId: 'e7dk7',
    startNodeAt: 200,
    endNodeId: '8jh8',
    endNodeAt: 11,
    sourceCount: 1,
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

function DemoApp() {
  // const [markList, setMarkList] = useState();
  useEffect(() => {
    getMarkList(uuid1).then((res) => {
      // setMarkList(res);
    });
  }, []);

  const handleCopusCopy = useCallback(async (params) => {
    console.log('params', params);
    // const res = await addMark({ ...params, opusUuid: uuid1 });
  }, []);

  const createMark = useCallback(async (params) => {
    console.log('createMark', params);
    const res = await addMark({ ...params });
    console.log('res', res);
    return { ...params, id: res.data };
  }, []);

  if (!markList) {
    return null;
  }

  return (
    <>
      {/* <App key="view" initialValue={data} copus={{ markList, copusCopy: handleCopusCopy }} readOnly /> */}
      <div>&nbsp;</div>
      <App
        key="edit"
        initialValue={data}
        copus={{ markList }}
        // copus={{ markList, initialSource: copyMark.textContent, createMark }}
        onChange={(status, html) => {
          console.log(status, html);
        }}
        // toolbar={[
        //   'history',
        //   'block-format',
        //   'font',
        //   'insert-image',
        //   'insert-audio',
        //   'insert-video',
        //   'columns-layout',
        //   'element-format',
        //   'insert-more',
        // ]}
        // showLabel
      />
    </>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <DemoApp />,
  // </React.StrictMode>,
);
