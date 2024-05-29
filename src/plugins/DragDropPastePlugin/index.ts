/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {DRAG_DROP_PASTE} from '@lexical/rich-text';
import {isMimeType, mediaFileReader} from '@lexical/utils';
import {COMMAND_PRIORITY_LOW} from 'lexical';
import {useEffect} from 'react';

import {INSERT_IMAGE_COMMAND} from '../ImagesPlugin';
import {INSERT_AUDIO_COMMAND} from '../AudioPlugin';
import useFlashMessage from '../../hooks/useFlashMessage';
import {INSERT_VIDEO_COMMAND} from '../VideoPlugin';
import {
  ACCEPTABLE_AUDIO_TYPES,
  ACCEPTABLE_IMAGE_TYPES,
  ACCEPTABLE_VIDEO_TYPES,
  mineTypeMap,
} from '../../utils/constant';

const commandMap = {
  image: INSERT_IMAGE_COMMAND,
  audio: INSERT_AUDIO_COMMAND,
  video: INSERT_VIDEO_COMMAND,
};

function getMimeType(file: File): string {
  return file.type.split('/')[0];
}

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  const showFlashMessage = useFlashMessage();

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [
              ACCEPTABLE_IMAGE_TYPES,
              ACCEPTABLE_AUDIO_TYPES,
              ACCEPTABLE_VIDEO_TYPES,
            ].flatMap((x) => x),
          );

          if (files.length > filesResult.length) {
            showFlashMessage('Some file types are not supported');
          }

          for (const {file} of filesResult) {
            const mimeType = getMimeType(file) as keyof typeof mineTypeMap;
            const {limitSize, limitMessage} = mineTypeMap[mimeType];
            if (file.size > limitSize) {
              showFlashMessage(limitMessage);
              return;
            }

            editor.dispatchCommand(commandMap[mimeType], {
              altText: file.name,
              src: URL.createObjectURL(file),
              file: file,
            });
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}
