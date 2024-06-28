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
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"哈哈哈哈😄","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

const data2 =
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"等等吧阿","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"萨德发","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"mark","version":1,"ids":["womgv"]},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"生 sdfgth","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"mark","version":1,"ids":["xkcgh","womgv"]},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"rh 儿童","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"mark","version":1,"ids":["womgv"]}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":" ","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"mark","version":1,"ids":["womgv"]},{"detail":0,"format":0,"mode":"normal","style":"","text":"dddddd","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"qw 人 wr 我让问","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

const data3 =
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Since the TextNode is foundational to all Lexical packages, including the plain text use case. Handling any rich text logic is undesirable. This creates the need to override the TextNode to handle serialization and deserialization of HTML/CSS styling properties to achieve full fidelity between JSON <-> HTML. Since this is a very popular use case, below we are proving a recipe to handle the","type":"text-x","version":1,"id":"e7dk7"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"哈哈哈","type":"text-x","version":1,"id":"59i2"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"most common use cases.","type":"text-x","version":1,"id":"8jh8"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"阿斯顿法斯蒂芬","type":"text-x","version":1,"id":"e7q5l"}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

function DemoApp() {
  return (
    <App
      initialValue={data3}
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
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>,
);
